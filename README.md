# suisei-live-watch

Will Suisei live today?

## Configurations

Confige is shown in `config.sample.json`.

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

  // 2. server port and path key.
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
