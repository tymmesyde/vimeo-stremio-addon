require('dotenv').config()
const { VIDEO_PREFIX } = process.env;

exports.objToArr = function(obj) {
    return Object.keys(obj).map(name => {
        return name;
    });
}

exports.sortByQuality = function(arr) {
    return arr.sort((a, b) => {
        return parseFloat(b.tag[0].replace('p', '')) - parseFloat(a.tag[0].replace('p', ''));
    });
}

exports.trimParagraph = function(str) {
    if (!str) return '';
    return str.substr(0, str.indexOf('\n')).concat('...');
}

exports.toYear = function(date) {
    return new Date(date).getFullYear();
}

exports.toChrono = function(sec) {
    return (sec / 60).toFixed(2).replace('.', ':');
}

exports.getCatByGenre = function(genre) {
    return global.CATEGORIES[Object.keys(global.CATEGORIES).filter(t => t.startsWith(genre))] || 'top'
}

exports.toMeta = function(video) {
    const { uri, link, user, name, description, language, duration, created_time, pictures, categories } = video;

    const genres = categories.map(cat => {
        return cat.name
    });

    const imgs = pictures.sizes;
    const thumbnail = imgs[1].link;
    const background = imgs[imgs.length - 1].link;

    return {
        id: `${VIDEO_PREFIX}:${uri.split('/')[2]}`,
        name,
        description: this.trimParagraph(description),
        language,
        genres,
        director: [(user && user.name) || 'unknown'],
        website: link,
        releaseInfo: this.toYear(created_time),
        runtime: `${this.toChrono(duration)} min`,
        logo: thumbnail,
        background,
        poster: background,
        posterShape: 'landscape',
        type: 'movie'
    }
}

exports.toStream = function(video, file) {
    return {
        name: `Vimeo`,
        title: `${video.title}\n${file.quality}`,
        url: file.url,
        tag: [file.quality, `${file.fps} FPS`]
    }
}