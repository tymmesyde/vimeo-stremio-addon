curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "transportUrl": "https://stremio-vimeo.ga/manifest.json", "transportName": "http" }' \
  https://api.strem.io/api/addonPublish