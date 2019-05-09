require('dotenv').config();
const { VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN, VIMEO_PLAYER, PER_PAGE, PER_SEARCH } = process.env;
const request = require('request');
const VimeoClient = require('vimeo').Vimeo;

class Vimeo {
    constructor() {
        this.client = new VimeoClient(VIMEO_CLIENT, VIMEO_SECRET, VIMEO_TOKEN);
    }

    getVideos(cat = null, skip = 0) {
        return new Promise((resolve) => {
            let url = '';
            if (cat) url = `categories/${cat}/videos`;
            else url = 'channels/bestofthemonth/videos';

            let skipPage = skip / PER_PAGE;
            this.client.request({
                path: url,
                query: {
                    page: skipPage + 1,
                    per_page: PER_PAGE,
                    sort: 'likes',
                    fields: 'uri,link,user,name,description,language,duration,created_time,pictures,categories'
                }
            }, (error, body) => {
                if (error) resolve([]);
                else resolve(body.data || []);
            });
        });
    }

    getVideo(video_id) {
        const id = video_id.split(':')[1];
        return new Promise((resolve) => {
            this.client.request({
                path: `videos/${id}`,
                query: {
                    fields: 'uri,link,user,name,description,language,duration,created_time,pictures,categories'
                }
            }, (error, body) => {
                if (error) resolve({});
                else resolve(body || {});
            });
        });
    }

    getStreams(video_id) {
        return new Promise(async (resolve) => {
            const id = video_id.split(':')[1];
            request(`${VIMEO_PLAYER.replace(`{vimeo_prefix}`, id)}`, (err, res, body) => {
                if (err) resolve(null);
                else {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });
    }

    searchVideos(query) {
        return new Promise(resolve => {
            this.client.request({
                path: 'videos',
                query: {
                    query: encodeURIComponent(query),
                    page: 1,
                    per_page: PER_SEARCH,
                    sort: 'revelant',
                    fields: 'uri,link,user,name,description,language,duration,created_time,pictures,categories'
                }
            }, (error, body) => {
                if (error) {
                    resolve([]);
                } else {
                    resolve(body.data || []);
                }
            });
        });
    }
}

module.exports = Vimeo;