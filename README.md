# yt-watch

This project has been shifted to a **general-purpose YouTube channel video/live watcher**. It send notifications to Telegram, but it's not complicated to mod this CLI to other chat services.

Still, it's initially aimed at watching [Hosimati Suisei](https://www.youtube.com/channel/UC5CwaMl1eIgY8h02uZw7u8A)'s YouTube livestreams. But you know.. she's just not used to schedule her livestreams on YouTube. We are considering fetching directly from [Hololive website](https://schedule.hololive.tv/), but that's another story...

## Usage

```
npm install -g yt-watch
yt-watch -c config.json
```

## Configurations

Configure is shown in `config.sample.json`.

```jsonc
{
  // Telegram chat ID for sending the notifications.
  "CHAT_ID": 0,
  // Telegram bot key.
  "BOT_KEY": "BOT_KEY",

  // Cron check interval. 1000 is usually okay.
  "CHECK_INTERVAL": 1000,

  // Server endpoint configurations. Choose one in the two choices.
  // 1. URL to this endpoint. This is needed when sending subscription requests.
  // Note that the ip/domain should be your external IP/domain.
  "CALLBACK_URL": "http://127.0.0.1:3000/test",

  // (Will override CALLBACK_URL) 2. server port and path key.
  "SERVER_PORT": 3000,
  "PATH_KEY": "/sub",

  // YouTube API key.
  "YOUTUBE_API_KEY": "",

  // Allowed topics.
  "TOPICS": {
    "星姐": "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A"
  }
}
```
