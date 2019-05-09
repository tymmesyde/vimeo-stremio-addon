#!/usr/bin/env node
require('dotenv').config()
const { PORT, CACHING_DELAY } = process.env
const { serveHTTP } = require("stremio-addon-sdk")
const catalog = require('./catalog')
const addonInterface = require('./addon')

catalog.cacheCatalog().then(() => {
    serveHTTP(addonInterface, { port: PORT, static: '/static' }).then((s) => {
        setInterval(async () => {
            catalog.cacheCatalog()
        }, CACHING_DELAY)
    })
})

