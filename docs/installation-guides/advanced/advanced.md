# Setup details for advanced users

## Docker compose sample

```yaml
services:
  stremio-ncore-addon:
    image: detarkende/stremio-ncore-addon:0.9.0
    environment:
      - NCORE_USERNAME=
      - NCORE_PASSWORD=
    ports:
      - target: 3000 # Port for HTTP
        published: 3000
        protocol: tcp
      - target: 3443 # Port for HTTPS (if you handle HTTPS yourself, you don't need this exposed)
        published: 3443
        protocol: tcp
      - target: 42069 # Port for torrent seeding
        published: 42069
    volumes:
      - type: bind
        source: /media/share
        target: /addon
    restart: unless-stopped
```

> [!WARNING]
> Until the addon hadn't reached V1, it is **NOT RECOMMENDED** to use the `latest` image tag.
>
> Upgrading to newer minor versions might need manual changes (e.g. changing environment variables or volumes), it could lead to downtime.
>
> Once the project reaches V1, these things should be more stable and breaking changes will only occur during major upgrades.

## Required environment variables

| Variable name    | Description                    |
| ---------------- | ------------------------------ |
| `NCORE_USERNAME` | Username to your nCore account |
| `NCORE_PASSWORD` | Password to your nCore account |

## Optional environment variables

| Variable name   | Description                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | Port where the server will run. If you change this, don't forget to change the target port as well.                                                                                                                                                                                                 |
| `HTTPS_PORT`    | Port where the HTTPS server will run. If you change this, don't forget to change the target port as well. (If you put the addon behind a reverse proxy to get HTTPS, you don't need to expose this port at all, but if you choose to setup the addon in "local only" mode, then this is necessary). |
| `ADDON_DIR`     | The directory where the addon will place all its files. If you use docker, the default value is `/addon` and you should instead change where the volume is mounted, but if you run it without docker, then you have to supply this manually                                                         |
| `TORRENTS_DIR`  | The directory where the addon will place the torrent files. By default, it will be `ADDON_DIR`/torrents                                                                                                                                                                                             |
| `DOWNLOADS_DIR` | The directory where the addon will place the downloaded files. By default, it will be `ADDON_DIR`/downloads                                                                                                                                                                                         |
| `CONFIG_DIR`    | The directory where the addon will place the configuration files (e.g. SQLite db file). By default, it will be `ADDON_DIR`/config                                                                                                                                                                   |
| `NCORE_URL`     | The URL of nCore. It's set by default, but if for some reason nCore changes URLs again and the addon isn't maintained by that point, then you can just change it yourself.                                                                                                                          |
| `CINEMETA_URL`  | The URL of Cinemeta. It's set by default, but if for some reason Cinemeta changes URLs again and the addon isn't maintained by that point, then you can just change it yourself.                                                                                                                    |

> [!TIP]
> If you would like to place the torrents, the config and the downloads into 3 separate places (so not everything in the same dir),
> then I recommend setting the env vars manually (e.g. `DOWNLOADS_DIR=/my-downloads/dir`)
> and mounting individual volumes for them.

## Stremio client setup

To add the addon to Stremio follow the [Client Setup Guide](../../client-setup.md).

## "Local only" setup

The addon automatically listens on three ports:

- an HTTP server (port defined by the `PORT` env var - default is 3000)
- an HTTPS server (port defined by the `HTTPS_PORT` env var - default is 3443). If the incoming request is for `https://x-x-x-x.local-ip.medicmobile.org`, then the server provides the SSL certificate, which is fetched from `https://local-ip.medicmobile.org/keys` every hour.
- the torrent server uses port 42069, don't forget to expose this to seed torrents.

All of these ports spin up automatically, but it's up to you to expose them from the docker container.
If you put the addon behind a reverse proxy, then You don't need to expose the `HTTPS_PORT`.

However, if you want to use the local-only mode, then you need to expose the HTTPS port (you can expose both ports, but you will likely only need the HTTPS port).
