#!/usr/bin/env node
require('dotenv').config()
const { PROD, VIDEO_PREFIX } = process.env;
const isProd = (PROD === 'true' ? true : false);

const Utils = require('./utils');
const Vimeo = require('./vimeo');
const manifest = require("./manifest");
const { addonBuilder } = require("stremio-addon-sdk");

const addon = new addonBuilder(manifest);
const vimeo = new Vimeo();

addon.defineCatalogHandler(async ({ type, id, extra }) => {
  if (!isProd) console.log('CATALOG:', type, id, extra);

  const { genre, skip, search } = extra || {};

  let metas = [];
  if (type == 'movie' && id == 'vimeo') {
    if (search) {
      const videos = await vimeo.searchVideos(search);
      metas = videos.map(video => {
        return Utils.toMeta(video);
      });
    } else {
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
  if (!isProd) console.log('META:', type, id);

  if (type == 'movie' && id.includes(VIDEO_PREFIX)) {
    const video = await vimeo.getVideo(id);
    const meta = Utils.toMeta(video);
    return Promise.resolve({ meta: meta });
  } else {
    return Promise.resolve({ meta: [] });
  }
});

addon.defineStreamHandler(async ({ type, id }) => {
  if (!isProd) console.log('STREAM:', type, id);

  if (type == 'movie' && id.includes(VIDEO_PREFIX)) {
    const { request, video } = await vimeo.getStreams(id);
    const streams = request.files.progressive.map(file => {
      return Utils.toStream(video, file);
    });

    return Promise.resolve({ streams: Utils.sortByQuality(streams) });
  } else {
    return Promise.resolve({ streams: [] });
  }
});

module.exports = addon.getInterface();