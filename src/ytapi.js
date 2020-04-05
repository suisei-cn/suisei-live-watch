const fetch = require("node-fetch");

async function getVideoInfo(videoId, apikey, wantSnippet) {
  let resp = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails${
      wantSnippet ? ",snippet" : ""
    }&id=${videoId}&key=${apikey}&fields=items(id,snippet,liveStreamingDetails)`,
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
