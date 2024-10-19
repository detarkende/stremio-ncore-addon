![banner](./assets/stremio-ncore-addon-banner.png)

# nCore addon

A self-hostable Stremio addon that lets you stream content straight from nCore.

![demo video](./assets/stremio-ncore-addon-demo-video.webp)

> [!WARNING]
> This project is very much in its alpha phase. The setup is still a bit rough and even a full rewrite is not out of the picture. It's the early days of the project, so don't expect stability yet, but feel free to experiment with it.
> When you update, expect new or removed env vars and new or removed volumes from the docker compose config.

> [!IMPORTANT] I maintain this project in my free time as a hobby. Feel free to leave suggestions or feedback in the form of issues, but don't _expect_ free labor. Rude or entitled issues will be deleted without explanation.
> The project is source-available, meaning that I currently don't accept contributions.

## FAQ

### What is Stremio?

<details>
<summary>
View answer
</summary>

Stremio is a media hub for your Smart TV, phone, or computer, just like Netflix, Disney+, or other services.

The differe is that Stremio doesn't provide any media sources by default, you have to use addons for that.

Learn more about Stremio [here](https://www.stremio.com/), or download the apps [here](https://www.stremio.com/downloads).

</details>

### What is this addon?

<details>
<summary>
View answer
</summary>

This project is an addon that connects your nCore account to Stremio. Without an addon, stremio will show no "streams" for any media.

Once you configure this addon, you will be able to click on any movie/show and you will see a list of all torrents for that particular media from nCore.

The addon will even rank them based on your configured preferences (language + resolution).

</details>

### What do I need to get started?

<details>
<summary>
View answer
</summary>

- nCore account (that isn't banned)
- A computer to host this program on
  - Docker needs to be installed
  - Needs enough free space where the downloaded files will fit.
  - This computer should ideally always be on (because it needs to seed the files back to nCore)
- A device that can run Stremio (newer LG/Samsung Smart TVs, an Android TV box, or just a laptop/PC)
- Your own domain name with HTTPS (tutorials coming soon...)
  - If you use Stremio on computer or an Android TV box and you don't want to share the addon with your friends and family, then this step can be optional.

</details>

## Features

- Self-hostable. The downloading PC/server can be anywhere and you can stream remotely.
- Seeds torrents after download.
- Saves torrent files and downloads to disk. If you come back the next day, the files will already be downloaded, so you won't have to wait too long.
- Configurable to delete torrents when you no longer have to seed them. (Hit'n'run checker)
- Multiple users without having to tell your nCore password to anyone.
- Recommendations and torrent ordering based on user preferences (Language + Resolution).

## Setup

**Server**: the computer where you will host this addon.

**Client**: the device where you will watch the content through the Stremio app.

### Using docker

Example docker compose:

```yml
---
services:
  stremio-ncore-addon:
    image: detarkende/stremio-ncore-addon:0.3.0
    container_name: stremio-ncore-addon
    environment:
      - ADDON_URL=https://subdomain.example.com
      - APP_SECRET=changeme
      - NCORE_USERNAME=ncore_username
      - NCORE_PASSWORD=ncore_password
      - DELETE_AFTER_HITNRUN=true
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=changeme
      - ADMIN_PREFERRED_LANGUAGE=hu
      - ADMIN_PREFERRED_RESOLUTIONS=720P,1080P
    volumes:
      - /path/to/downloads:/downloads
      - /path/to/torrents:/torrents
    ports:
      - 3000:3000
    restart: unless-stopped
```

> [!IMPORTANT]
> Don't use the `latest` tag for now in your docer compose. The environment variables are going to change in many ways,
> so I recommend using a fixed tag version of the docker image.

1. Install the plugin on the device where you use Stremio
   <details>
   <summary>I don't have an Android TV / Chromecast or similar.</summary>

   1. Make sure that the config URL can be reached with HTTPS: `https://<ADDON-URL>/configure`. (Example: https://stremio-addon.example.com/configure)
   2. Open [Stremio on the web](https://web.strem.io/#/intro?form=login), and log in.
   3. Go to the configuration URL, log in to the addon with one of the users, then click on "Configure on the web".
   4. Click on "Install".
   5. Now you can log in on any device and the plugin will work. (Note: you might have to sync your addons first on some Smart TVs.)
   </details>

   <details>
   <summary>I have an Android TV / Chromecast or similar.</summary>

   6. Open the app and log in.
   7. Go to addons.
   8. Click on the "Add addon" button.
   9. Type in your server's address. If you have this set up to a certain URL, type that. Otherwise, just replace the parts in this: `http://<SERVER_IP_ADDRESS>:<PORT>/manifest.json`. (Example: https://192.168.0.110:3000/manifest.json)
   10. Click "Configure" and wait for the configuration window to open.
   11. Log in with one of the users you saved in your config file.
   12. Click on "Add in the Stremio app".
   13. You should be redirected to the Stremio Addons screen. Click "Install" to finish the installation.
   </details>

## Environment variable reference

| Variable name                 | Required / Optional                      | Description                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ADDON_URL`                   | Required                                 | The https URL where the addon will be reachable. This should be available from outside your local network.                                                                                 |
| `APP_SECRET`                  | Required                                 | A random string that will be used to sign the JWTs for authentication. You can generate on [here](https://randomkeygen.com/#504_wpa).                                                      |
| `NCORE_USERNAME`              | Required                                 | Your username for nCore.                                                                                                                                                                   |
| `NCORE_PASSWORD`              | Required                                 | Your password for nCore.                                                                                                                                                                   |
| `ADMIN_USERNAME`              | Required                                 | Username for the admin user.                                                                                                                                                               |
| `ADMIN_PASSWORD`              | Required                                 | Password for the admin user.                                                                                                                                                               |
| `ADMIN_PREFERRED_LANGUAGE`    | Required                                 | Preferred language of the admin user of the addon.<br>This setting will be used to rank and order the found torrents and for giving recommendations.                                       |
| `ADMIN_PREFERRED_RESOLUTIONS` | Required                                 | A comma separated list of resolutions that the admin user prefers in preferential order.<br>This setting will be used to rank and order the found torrents and for giving recommendations. |
|                               |                                          |                                                                                                                                                                                            |
| `PORT`                        | Optional (default = `3000`)              | The port where the addon will run.<br>If you are running this from docker, don't change this, change the exposed port instead.                                                             |
| `DOWNLOADS_DIR`               | Required (Optional for docker)           | Directory path where the video files will be downloaded to.<br>Should be an empty directory.<br>If the given path doesn't exist, it will be created.                                       |
| `TORRENTS_DIR`                | Required (Optional for docker)           | Directory path where the torrent files will be downloaded to.<br>Should be an empty directory.<br>If the given path doesn't exist, it will be created.                                     |
| `NCORE_URL`                   | Optional (default = `https://ncore.pro`) | URL of the nCore website. This is only here in case the URL changes.<br>Otherwise, you don't need to provide this.                                                                         |
| `DELETE_AFTER_HITNRUN`        | Optional (default = `false`)             | Enable automatic deletion of torrents that are not mandatory to seed anymore.                                                                                                              |
| `DELETE_AFTER_HITNRUN_CRON`   | Optional (default = `'0 2 * * *'`)       | Cron expression for running the hitnrun table check. Defaults to "Once every day at 2:00 AM"                                                                                               |
| `USERS`                       | Optional                                 | A JSON array of users as a string.<br>Check the `.env.example` file [here](/.env.example) for an example.                                                                                  |

## Roadmap

- [x] Admin panel for torrents
- [x] Sort torrents based on user preferences
- [ ] Add database + install flow in WebUI to replace most environment variables
- [ ] Integrate with [local-ip.co](http://local-ip.co/) to allow https for local network
- [ ] Add more unit tests to backend
- [ ] Add unit tests to frontend
- [ ] Create user friendly tutorials
  - [ ] Add video tutorials
  - [ ] Add a documentation website
