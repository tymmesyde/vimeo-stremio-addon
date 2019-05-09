const Utils = require('./utils');
const Vimeo = require('./vimeo');
const categories = require('./categories.json');

const vimeo = new Vimeo();

global.CATEGORIES = categories;
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
    Promise.resolve();
}