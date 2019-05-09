require('dotenv').config()
const { ID, DOMAIN, VIDEO_PREFIX } = process.env
const { version, description, author } = require('../package.json')
const Utils = require('./utils')

module.exports = {
    id: ID,
    version: version,
    name: 'Vimeo',
    description: description,
    logo: `${DOMAIN}/public/vimeo.png`,
    background: `${DOMAIN}/public/background.jpg`,
    contactEmail: author.email,
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
}