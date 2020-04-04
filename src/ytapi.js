const fetch = require("node-fetch");

async function getVideoInfo(videoId, apikey) {
  let resp = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apikey}&fields=items(id,snippet(title),liveStreamingDetails(scheduledStartTime))`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  ).then((x) => x.json());
  if (resp.error) throw resp.error;
  return resp.items[0];
}

module.exports = {
  getVideoInfo,
};
