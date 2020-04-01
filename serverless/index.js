addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const YOUTUBE_API_KEY = "YOUTUBE_API_KEY";
const SERVER_SIDE_URL = "http://server/schedule";

const validTopic = [
  "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A" // Suisei Hosimati
];

async function handleRequest(request) {
  let body = await request.text();

  let match = body.match(/\<yt:videoId\>(.+)\<\/yt:videoId\>/);

  if (match === null) {
    // No information here

    let url = new URL(request.url);
    // 1. Reply to PSHB challenge
    if (request.method == "GET" && url.searchParams.has("hub.challenge")) {
      // It's a challenge
      if (validTopic.includes(url.searchParams.get("hub.topic"))) {
        // Topic is what we want, accept it
        return new Response(url.searchParams.get("hub.challenge"), {
          status: 200
        });
      }
    }
    return new Response("bad", { status: 404 });
  }

  // 2. Process subscription

  let videoId = match[1];

  let targetData = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails%2Csnippet&id=${videoId}&key=${YOUTUBE_API_KEY}&fields=items(id,snippet(title),liveStreamingDetails(scheduledStartTime))`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  ).then(x => x.json());

  let targetItem;
  try {
    targetItem = targetData.items[0];
  } catch (e) {
    return new Response("ok", { status: 204 });
  }

  await fetch(SERVER_SIDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      vid: videoId,
      time: targetItem.liveStreamingDetails.scheduledStartTime,
      title: targetItem.snippet.title
    })
  });

  return new Response("posted", { status: 200 });
}
