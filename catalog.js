const fs = require('fs');
const Utils = require('./utils');
const Vimeo = require('./vimeo');

const vimeo = new Vimeo();

global.CATEGORIES = JSON.parse(fs.readFileSync('./categories.json', 'utf8'));
global.CATALOG = {};

exports.cacheCatalog = async () => {
    console.log('CATALOG CACHING ...');

    // Fetch all metas for each categories
    await Promise.all(Object.values(global.CATEGORIES).map(async name => {
        const videos = await vimeo.getVideos(name);
        global.CATALOG[name] = videos.map(video => {
            return Utils.toMeta(video);
        });
    }));

    // Fetch top (bestofthemonth) metas
    const videos = await vimeo.getVideos(null);
    global.CATALOG['top'] = videos.map(video => {
        return Utils.toMeta(video);
    });

    console.log('CACHED CATALOG !');
}