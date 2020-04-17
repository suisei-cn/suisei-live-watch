module.exports = (main, extra = {}) => {
  main.updateConfigAndInit(
    Object.assign(
      {
        CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        BOT_KEY: process.env.TELEGRAM_BOT_KEY,
        CHECK_INTERVAL: 1000,
        SERVER_PORT: 3000,
        PATH_KEY: "/sub",
        CALLBACK_URL: "http://127.0.0.1",
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
        RECORD_TIME_LIMIT_FUTURE: 2592000000,
        RECORD_TIME_LIMIT_PAST: 2592000000,
        TOPICS: {
          星姐:
            "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A",
        },
        SUB_TOPICS: {
          星街: [
            "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC8NZiqKx6fsDT3AVcMiVFyA",
          ],
        },
      },
      extra
    )
  );
};
