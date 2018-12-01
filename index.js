#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs');
const path = require('path');
const request = require('request');
const Vimeo = require('vimeo').Vimeo;
const AddonSDK = require('stremio-addon-sdk');

const { ENV, PORT, PER_PAGE, ID, DOMAIN, MANIFEST_URL, CACHING_TIME, VIMEO_ID, VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN, VIMEO_OEMBED, VIMEO_PLAYER } = process.env;
const CATEGORIES = JSON.parse(fs.readFileSync('./categories.json', 'utf8'));

const manifest = {
  id: ID,
  version: '1.2.3',
  name: 'Vimeo',
  description: 'Watch Vimeo videos & channels on Stremio',
  logo: `${DOMAIN}/public/vimeo.png`,
  background: `${DOMAIN}/public/background.jpg`,
  endpoint: MANIFEST_URL,
  contactEmail: 'tymmesyde@gmail.com',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'channel'],
  idPrefixes: [VIMEO_ID],
  catalogs: [
    {
      type: 'movie',
      id: 'vimeo',
      name: 'Vimeo',
      genres: objToArr(CATEGORIES),
      extraSupported: ['genre', 'skip', 'top']
    }
  ]
};

const vimeo = new Vimeo(VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN);
const addon = new AddonSDK(manifest);

// Catalog caching
var CATALOG = {};

// Cache catalog
async function cacheCatalog() {
  console.log('CATALOG CACHING ...');

  // Fetch all metas for each categories
  await Promise.all(Object.values(CATEGORIES).map(async name => {
    let videos = await getVideos(name);
    CATALOG[name] = await Promise.all(videos.map(async id => {
      return await getMeta(id);
    }));
  }));

  // Fetch top (bestofthemonth) metas
  let tops = await getVideos();
  CATALOG['top'] = await Promise.all(tops.map(async id => {
    return await getMeta(id);
  }));

  if (ENV == 'dev') console.log(CATALOG);
  console.log('CATALOG CACHED !');
}

addon.defineCatalogHandler(async (args, cb) => {
  if (ENV == 'dev') console.log('CATALOG:', args);

  const { type, id } = args;
  const { genre, skip, search } = args.extra || {};

  if (type == 'movie' && id == 'vimeo' && !search) {
    let name = getCatByTitle(genre);
    if (!name) { cb(null, { metas: [] }); return; }
    if (!skip) { cb(null, { metas: CATALOG[name] }); return; }

    let videos = await getVideos((name == 'top' ? null : name), skip);
    let metas = await Promise.all(videos.map(async id => {
      return await getMeta(id);
    }));

    cb(null, { metas: metas });
  }else {
    cb(null, { metas: [] });
  }
});

addon.defineMetaHandler(async (args, cb) => {
  if (ENV == 'dev') console.log('META:', args);

  const { type, id } = args;

  if(type == 'movie' && id.includes(VIMEO_ID)) {
    let video = await getMeta(id);
    cb(null, { meta: video });
  }else {
    cb(null, { meta: [] });
  }
});

addon.defineStreamHandler(async (args, cb) => {
  if (ENV == 'dev') console.log('STREAM:', args);

  const { type, id } = args;

  if(type == 'movie' && id.includes(VIMEO_ID)) {
    let streams = await getStreams(id);
    cb(null, { streams: streams });
  }else {
    cb(null, { streams: [] });
  }
});

addon.serveDir('/public', './public');
addon.publishToWeb('http://localhost:'+PORT);
addon.runHTTPWithOptions({port: PORT}, () => {
  cacheCatalog();

  setInterval(async () => {
    cacheCatalog();
  }, CACHING_TIME);
});

function getVideos(cat = null, skip = 0) {
  return new Promise((resolve) => {
    let url = '';
    if (cat) url = `categories/${cat}/videos`;
    else url = 'channels/bestofthemonth/videos';

    let skipPage = skip / PER_PAGE;
    vimeo.request({
      path: url,
      query: {
        page: skipPage + 1,
        per_page: PER_PAGE,
        sort: 'likes',
        fields: 'uri,name,description,duration,created_time'
      }
    }, (error, body, status, headers) => {
      if(error) {
        if (ENV == 'dev') console.error(error);
        resolve([]);
      }else {
        let data = body.data || [];
        let list = data.map(video => {
          let { uri, name, description, duration, created_time } = video;
          return `${VIMEO_ID}:${uri.split('/')[2]}`;
        });

        resolve(list);
      }
    });
  });
}

function getMeta(addon_id) {
  return new Promise(async (resolve) => {
    let id = addon_id.split(':')[1];
    let { title, description, author_name, thumbnail_url, duration, upload_date} = await fetchOEmbed(id) || {};

    let meta = {
      id: `${VIMEO_ID}:${id}`,
      name: title,
      description: description,
      director: [author_name],
      genres: null,
      year: toYear(upload_date),
      runtime: `${toChrono(duration)} min`,
      logo: thumbnail_url,
      background: thumbnail_url,
      poster: thumbnail_url,
      posterShape: 'landscape',
      type: 'movie'
    }

    resolve(meta);
  });
}

function getStreams(addon_id) {
  return new Promise(async (resolve) => {
    let id = addon_id.split(':')[1];
    let { request, video } = await fetchStreams(id) || {};

    let streams = request.files.progressive.map(file => {
      return {
        title: `${file.quality} | ${video.title}`,
        url: file.url,
        tag: [file.quality, `${file.fps} FPS`],
        isFree: true
      }
    })

    resolve(sortByQuality(streams));
  });
}

function fetchOEmbed(id) {
  return new Promise((resolve) => {
    request(`${VIMEO_OEMBED}${id}`, (err, res, body) => {
      if(err) resolve(null);
      else {
        try {
          let data = JSON.parse(body);
          resolve(data);
        }catch {
          resolve(null);
        }
      }
    });
  });
}

function fetchStreams(id) {
  return new Promise((resolve) => {
    request(`${VIMEO_PLAYER.replace('{vimeo_id}', id)}`, (err, res, body) => {
      if(err) resolve(null);
      else {
        try {
          let data = JSON.parse(body);
          resolve(data);
        }catch {
          resolve(null);
        }
      }
    });
  });
}

function getCatByTitle(title) {
  return CATEGORIES[Object.keys(CATEGORIES).filter(t => t.startsWith(title))] || 'top'
}

function objToArr(obj) {
  return Object.keys(obj).map(name => {
    return name;
  });
}

function sortByQuality(arr) {
  return arr.sort((a, b) => {
    return parseFloat(b.tag[0].replace('p', '')) - parseFloat(a.tag[0].replace('p', ''))
  });
}

function toYear(date) {
  return new Date(date).getFullYear();
}

function toChrono(sec) {
  return (sec/60).toFixed(2).replace('.', ':');
}

module.exports = addon;