require('dotenv').config();
const { DOMAIN } = process.env;
const { publishToCentral } = require('stremio-addon-sdk');
publishToCentral(`${DOMAIN}/manifest.json`);