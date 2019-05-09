#!/usr/bin/env node
require('dotenv').config()
const Utils = require('./utils');
const Vimeo = require('./vimeo');
const { addonBuilder } = require("stremio-addon-sdk");

const { ENV, ID, DOMAIN, VIDEO_PREFIX } = process.env;

const manifest = {
  id: ID,
  version: '1.3.0',
  name: 'Vimeo',
  description: 'Watch Vimeo videos & channels on Stremio',
  logo: `${DOMAIN}/public/vimeo.png`,
  background: `${DOMAIN}/public/background.jpg`,
  contactEmail: 'tymmesyde@gmail.com',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'channel'],
  idPrefixes: [VIDEO_PREFIX],
  catalogs: [
    {
      type: 'movie',
      id: 'vimeo',
      name: 'Vimeo',
      genres: Utils.objToArr(global.CATEGORIES),
      extraSupported: ['genre', 'skip', 'top', 'search']
    }
  ]
};

const addon = new addonBuilder(manifest);
const vimeo = new Vimeo();

addon.defineCatalogHandler(async ({ type, id, extra }) => {
  if (ENV == 'dev') console.log('CATALOG:', type, id, extra);

  const { genre, skip, search } = extra || {};

  let metas = [];
  if (type == 'movie' && id == 'vimeo') {
    if(search) {
      const videos = await vimeo.searchVideos(search);
      metas = videos.map(video => {
        return Utils.toMeta(video);
      });
    }else {
      const name = Utils.getCatByGenre(genre);
      if (!name) { return Promise.resolve({ metas: [] }); }
      if (!skip) { return Promise.resolve({ metas: global.CATALOG[name] }); }

      const videos = await vimeo.getVideos((name == 'top' ? null : name), skip);
      metas = videos.map(video => {
        return Utils.toMeta(video);
      });
    }
  }

  return Promise.resolve({ metas: metas });
});

addon.defineMetaHandler(async ({ type, id }) => {
  if (ENV == 'dev') console.log('META:', type, id);

  if(type == 'movie' && id.includes(VIDEO_PREFIX)) {
    const video = await vimeo.getVideo(id);
    const meta = Utils.toMeta(video);
    return Promise.resolve({ meta: meta });
  }else {
    return Promise.resolve({ meta: [] });
  }
});

addon.defineStreamHandler(async ({ type, id }) => {
  if (ENV == 'dev') console.log('STREAM:', type, id);

  if(type == 'movie' && id.includes(VIDEO_PREFIX)) {
    const { request, video } = await vimeo.getStreams(id);
    const streams = request.files.progressive.map(file => {
      return Utils.toStream(video, file);
    });

    return Promise.resolve({ streams: Utils.sortByQuality(streams) });
  }else {
    return Promise.resolve({ streams: [] });
  }
});

module.exports = addon.getInterface();