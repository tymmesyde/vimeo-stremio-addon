![](https://raw.githubusercontent.com/tymmesyde/vimeo-stremio-addon/master/static/vimeo.png)
# Vimeo: Stremio Addon

Built with [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk)

## Install

- Install node packages: `npm install`
- Create an .env file at the root, add and update these variables:
  
```
ENV="dev"
PORT={PORT}
ID="{ID}"
DOMAIN="{DOMAIN}"
PER_PAGE=60
PER_SEARCH=15
CACHING_DELAY=600000
VIDEO_PREFIX="vimeo"
VIMEO_CLIENT="{VIMEO_CLIENT}"
VIMEO_SECRET="{VIMEO_SECRET}"
VIMEO_TOKEN="{VIMEO_TOKEN}"
VIMEO_PLAYER="https://player.vimeo.com/video/{vimeo_prefix}/config"
```