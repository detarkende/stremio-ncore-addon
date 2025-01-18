# Setup details for advanced users

## Docker compose sample

```yaml
services:
  stremio-ncore-addon:
    image: detarkende/stremio-ncore-addon:0.5.0
    environment:
      - NCORE_PASSWORD=
      - NCORE_USERNAME=
    ports:
      - target: 3000
        published: 3000
        protocol: tcp
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

| Variable name   | Description                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | Port where the server will run. If you change this, don't forget to change the target port as well.                                                                                                                                         |
| `ADDON_DIR`     | The directory where the addon will place all its files. If you use docker, the default value is `/addon` and you should instead change where the volume is mounted, but if you run it without docker, then you have to supply this manually |
| `TORRENTS_DIR`  | The directory where the addon will place the torrent files. By default, it will be `ADDON_DIR`/torrents                                                                                                                                     |
| `DOWNLOADS_DIR` | The directory where the addon will place the downloaded files. By default, it will be `ADDON_DIR`/downloads                                                                                                                                 |
| `CONFIG_DIR`    | The directory where the addon will place the configuration files (e.g. SQLite db file). By default, it will be `ADDON_DIR`/config                                                                                                           |
| `NCORE_URL`     | The URL of nCore. It's set by default, but if for some reason nCore changes URLs again and the addon isn't maintained by that point, then you can just change it yourself.                                                                  |
| `CINEMETA_URL`  | The URL of Cinemeta. It's set by default, but if for some reason Cinemeta changes URLs again and the addon isn't maintained by that point, then you can just change it yourself.                                                            |

> [!TIP]
> If you would like to place the torrents, the config and the downloads into 3 separate places (so not everything in the same dir),
> then I recommend setting the env vars manually (e.g. `DOWNLOADS_DIR=/my-downloads/dir`)
> and mounting individual volumes for them.

## Stremio client setup

To add the addon to Stremio follow the [Client Setup Guide](../../client-setup.md).
