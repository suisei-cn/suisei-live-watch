const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const should = require("chai").should();

async function sleep(time) {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
  return;
}

var main, server;

function generatePayloadForVideoID(
  vid,
  channel = "UC5CwaMl1eIgY8h02uZw7u8A",
  time = "2015-03-09T19:05:24.552394234+00:00"
) {
  let timestr = new Date(time).toISOString();
  return `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
    xmlns="http://www.w3.org/2005/Atom">
<link rel="hub" href="https://pubsubhubbub.appspot.com"/>
<link rel="self" href="https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel}"/>
<title>YouTube video feed</title>
<updated>2015-04-01T19:05:24.552394234+00:00</updated>
<entry>
<id>yt:video:${vid}</id>
<yt:videoId>${vid}</yt:videoId>
<yt:channelId>${channel}</yt:channelId>
<title>FOR_TESTING_ONLY</title>
<link rel="alternate" href="http://www.youtube.com/watch?v=${vid}"/>
<author>
<name>Channel name</name>
<uri>http://www.youtube.com/channel/${channel}</uri>
</author>
<published>${timestr}</published>
<updated>2015-03-09T19:05:24.552394234+00:00</updated>
</entry>
</feed>`;
}

describe("Message processing", function () {
  before(() => {
    main = require("../src/index");
    server = main.app;
    main.updateConfigAndInit({
      CHAT_ID: process.env.TELEGRAM_CHAT_ID,
      BOT_KEY: process.env.TELEGRAM_BOT_KEY,
      CHECK_INTERVAL: 1000,
      SERVER_PORT: 3000,
      PATH_KEY: "/sub",
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
      EDIT_PREVIOUS_MESSAGE_IN: 1000,
      TOPICS: {
        星姐:
          "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A",
      },
      SUB_TOPICS: {
        星街: [
          "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC8NZiqKx6fsDT3AVcMiVFyA",
        ],
      },
    });
  });

  it("should delete the message id at expire", async function () {
    await new Promise((resolve) => {
      chai
        .request(server)
        .post("/sub")
        .set("content-type", "application/atom+xml")
        .send(
          generatePayloadForVideoID("IRr6aAS3zLQ", "UC5CwaMl1eIgY8h02uZw7u8A")
        ) // Sub-topic video not related to keyword
        .end((err, res) => {
          resolve();
        });
    });

    let lastMsg = main.seenVidsAndTime["IRr6aAS3zLQ"].lastMsg;
    await sleep(500);
    main.seenVidsAndTime["IRr6aAS3zLQ"].lastMsg.should.equal(lastMsg);
    await sleep(1000);
    should.not.exist(main.seenVidsAndTime["IRr6aAS3zLQ"].lastMsg);
  });
});
