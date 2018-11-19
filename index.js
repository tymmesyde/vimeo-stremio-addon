#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs');
const path = require('path');
const request = require('request');
const Vimeo = require('vimeo').Vimeo;
const express = require('express');
const exphbs = require('express-handlebars');
const sassMiddleware = require('node-sass-middleware');
const addon = express();

const { DEV, PORT, PER_PAGE, ID, MANIFEST_URL, VIMEO_ID, VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN, VIMEO_OEMBED, VIMEO_PLAYER } = process.env;
const JSONCATS = './categories.json';
const CATS = getCategories();

const vimeo = new Vimeo(VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN);
const manifest = {
  id: ID,
  version: '1.1.0',
  name: 'Vimeo',
  description: 'Watch Vimeo videos & channels on Stremio',
  logo: '/public/vimeo.png',
  background: '/public/background.jpg',
  endpoint: MANIFEST_URL,
  contactEmail: 'tymmesyde@gmail.com',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'channel'],
  idPrefixes: ['vimeo_id'],
  catalogs: [
    {
      type: 'movie',
      id: 'vimeo',
      name: 'Vimeo',
      genres: objToArr(CATS),
      extraSupported: ['search', 'genre', 'skip', 'top']
    }
  ]
};

const respond = (res, data) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
}

// EXPRESS / HANDLEBARS CONFIG
addon.use(sassMiddleware({
  src: __dirname,
  dest: __dirname,
  debug: false,
  outputStyle: 'compressed'
}));
addon.use('/public', express.static(path.join(__dirname, 'public')));

addon.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
addon.set('view engine', '.hbs')
addon.set('views', path.join(__dirname, 'views'))

// ROUTES
addon.get('/', (req, res) => {
  res.render('home', manifest);
});

addon.get('/manifest.json', (req, res) => {
  respond(res, manifest);
});

addon.get('/catalog/:type/:id/:extra?.json', async (req, res) => {
  if (DEV) console.log('CATALOG:', req.params);

  const { type, id } = req.params;
  const { genre, skip } = parseParams(req.params.extra || "") || {};

  if(type == 'movie' && id == 'vimeo') {
    let videos = await getVideos(genre, skip);
    let metas = await Promise.all(videos.map(async id => {
      return await getMeta(id);
    }));

    respond(res, { metas: metas });
  }else {
    respond(res, { metas: [] });
  }
});

addon.get('/meta/:type/:id.json', async (req, res) => {
  if (DEV) console.log('META:', req.params);

  const { type, id } = req.params;

  if(type == 'movie' && id.includes(VIMEO_ID)) {
    let video = await getMeta(id);
    respond(res, { meta: video });
  }else {
    respond(res, { meta: [] });
  }
});

addon.get('/stream/:type/:id.json', async (req, res) => {
  if (DEV) console.log('STREAM:', req.params);

  const { type, id } = req.params;

  if(type == 'movie' && id.includes(VIMEO_ID)) {
    let streams = await getStreams(id);
    respond(res, { streams: streams });
  }else {
    respond(res, { streams: [] });
  }
});

const app = addon.listen(PORT, () => {
  console.log(`Add-on Repository URL: http://127.0.0.1:${PORT}/manifest.json`);
});

function getVideos(genre = null, skip = 0) {
  return new Promise((resolve) => {
    let url = '';
    if(genre) {
      let cat = CATS[Object.keys(CATS).filter(title => title.startsWith(genre))];
      if(cat) url = `categories/${cat}/videos`;
      else resolve([]);
    }else {
      url = 'channels/bestofthemonth/videos';
    }

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
        resolve([]);
      }else {
        let data = body.data || [];
        let list = data.map(video => {
          let { uri, name, description, duration, created_time } = video;
          return `vimeo_id:${uri.split('/')[2]}`;
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
      id: `vimeo_id:${id}`,
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

    resolve(streams);
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

function getCategories() {
  return JSON.parse(fs.readFileSync(JSONCATS, 'utf8'));
}

function objToArr(obj) {
  return Object.keys(obj).map(name => {
    return name;
  });
}

function toYear(date) {
  return new Date(date).getFullYear();
}

function toChrono(sec) {
  return (sec/60).toFixed(2).replace('.', ':');
}

function parseParams(paramsString) {
  var params = {}, queries, temp, i, l;
  queries = paramsString.split("&");
  for (i = 0, l = queries.length; i < l; i++) {
    temp = queries[i].split('=');
    params[temp[0]] = temp[1];
  }
  return params;
};


module.exports = app;