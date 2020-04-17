# yt-watch

[![David deps](https://img.shields.io/david/suisei-cn/suisei-live-watch.svg?style=flat)](https://david-dm.org//suisei-cn/suisei-live-watch)

[![](https://nodei.co/npm/yt-watch.png?global=true)](https://nodei.co/npm/yt-watch)

This project has been shifted to a **general-purpose YouTube channel video/live watcher**. It sends notifications to Telegram, but it's not complicated to mod this CLI to other chat services.

Still, it's initially aimed at watching [Hosimati Suisei](https://www.youtube.com/channel/UC5CwaMl1eIgY8h02uZw7u8A)'s YouTube livestreams. But you know.. she's just not used to schedule her livestreams on YouTube. ~We are considering fetching directly from [Hololive schedule site](https://schedule.hololive.tv/), but that's another story...~ Since Hololive schedule site only releases livestreams scheduled on YouTube, this approach will not work, either. _Don't attempt to fetch Suisei's livestream schedule fully automatically unless you are really good at NLP._

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

  // 2. server port and path key. (Will override CALLBACK_URL)
  // Note that in a future version the two configurations might be deprecated
  // and CALLBACK_URL will be mandatory.
  "SERVER_PORT": 3000,
  "PATH_KEY": "/sub",

  // YouTube API key.
  "YOUTUBE_API_KEY": "",

  // Allowed topics.
  "TOPICS": {
    "星姐": "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A"
  },

  // Allowed sub-topics. Only send notifications when the keyword appears in video title or description.
  "SUB_TOPICS": {
    "星街": [
      "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC8NZiqKx6fsDT3AVcMiVFyA"
    ]
  }，

  // Post_fetch functions if you want to process other stuffs. (optional)
  // Notice that this will cause yt-watch to fetch snippet for every time,
  // which might slightly increase the speed of quota burnout.
  "POST_FETCH": "/home/ubuntu/post-fetch.js",

  // If last message sent is less than n seconds, update the old message rather than sending a new one.
  "EDIT_PREVIOUS_MESSAGE_IN": 1000,

  // Renew the subscription n (seconds) before expiration.
  "RENEW_BEFORE": 43200,

  // Subscribe request sending interval.
  "SUBSCRIBE_INTERVAL": 4000，

  // With these settings, you can ignore video published too early (in the past) or too far from now (in the future)
  // Set to 0 to disable.
  "RECORD_TIME_LIMIT_FUTURE": 7776000000, // 90 days
  "RECORD_TIME_LIMIT_PAST": 2592000000    // 30 days
}
```
