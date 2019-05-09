const tape = require('tape')
const client = require('stremio-addon-client')
const { serveHTTP } = require("stremio-addon-sdk")
const catalog = require('../src/catalog')

const PORT = 4651

let addonUrl
let addonServer
let addonClient

let metaID

// Waiting for the catalog to cache
catalog.cacheCatalog().then(() => {

    const addonInterface = require('../src/addon')

    tape('it should serve the addon', (t) => {
        serveHTTP(addonInterface, { port: PORT }).then(h => {
            t.ok(h.url, 'has url')
            t.ok(h.url.endsWith('manifest.json'), 'url ends with manifest.json')
            t.ok(h.server, 'has h.server')

            addonUrl = h.url
            addonServer = h.server

            t.end()
        })
    })

    tape('it should be detected by client', (t) => {
        client.detectFromURL(addonUrl).then(res => {
            t.ok(res, 'has response')
            t.ok(res.addon, 'response has addon')
            t.equal(typeof res.addon, 'object', 'addon is a valid object')

            addonClient = res.addon

            t.end()
        })
    })

    tape('it should return nothing', (t) => {
        addonClient.get('catalog', 'movie', 'nothing').then(res => {
            t.ok(res, 'has response')
            t.equal(res.metas.length, 0, 'should be empty')
            t.end()
        })
    })

    tape('it should return metas movies', (t) => {
        addonClient.get('catalog', 'movie', 'vimeo').then(res => {
            t.ok(res, 'has response')
            t.ok(res.metas, 'has metas')
            t.notEqual(res.metas.length, 0, 'length should be superior to 0')
            t.equal(res.metas[0].type, 'movie', 'should be a movie')
            t.end()
        })
    })

    tape('it should return metas movies for Animation genre', (t) => {
        addonClient.get('catalog', 'movie', 'vimeo', 'genre=Animation').then(res => {
            t.ok(res, 'has response')
            t.ok(res.metas, 'has metas')
            t.notEqual(res.metas.length, 0, 'length should be superior to 0')
            t.equal(res.metas[0].type, 'movie', 'should be a movie')

            metaID = res.metas[0].id

            t.end()
        })
    })

    tape('it should return streams from last query', (t) => {
        addonClient.get('stream', 'movie', metaID).then(res => {
            t.ok(res, 'has response')
            t.ok(res.streams, 'has streams')
            t.notEqual(res.streams.length, 0, 'length should be superior to 0')
            t.equal(res.streams[0].name, 'Vimeo', 'should be a Vimeo stream')
            t.end()
        })
    })

    tape.onFinish(() => {
        addonServer.close()
    })

})

