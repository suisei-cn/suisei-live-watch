const express = require("express");
const cron = require("./cron");
const message = require("./message");
const config = require("./config.json");
const utils = require("./utils");
const bodyParser = require("body-parser");
const Parser = require("rss-parser");
const ytAPI = require("./ytapi");
const parser = new Parser({
  customFields: {
    item: [
      ["yt:videoId", "videoId"],
      ["yt:channelId", "channelId"],
    ],
  },
});

const options = {
  inflate: true,
  limit: "100kb",
  type: "*/*",
};

const CHAT_ID = config.CHAT_ID;
const SUBPATH = utils.getSubpath(config);
const RECORD_TIME_LIMIT = config.RECORD_TIME_LIMIT || 90 * 24 * 60 * 60 * 1000;

const app = express();
app.use(bodyParser.text(options));

cron.init();
const seenVidsAndTime = {};

function identicalInfo(a, b) {
  for (const i of ["name", "title", "time", "vid"]) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

app.get(SUBPATH, (req, res) => {
  // Filter PSHB challenges
  // https://pubsubhubbub.github.io/PubSubHubbub/pubsubhubbub-core-0.4.html
  if (req.get("Content-Type") == "application/x-www-form-urlencoded") {
    let topic = req.query["hub.topic"] || "";
    if (Object.values(config.TOPICS || {}).includes(topic)) {
      let topicTitle = Object.entries(config.TOPICS).filter(
        (x) => x[1] == topic
      )[0][0];
      console.info(`Topic ${topicTitle} challenge passed.`);
      res.status(200).send(req.query["hub.challenge"]);
      return;
    } else {
      console.info(
        `Topic challenge failed (topic: ${topic} ). If this is what you want, add this link to "config.json".`
      );
    }
  }
  res.sendStatus(400);
  return;
});

app.post(SUBPATH, async (req, res) => {
  let parsingDone = true;
  let body = await parser.parseString(req.body).catch((reason) => {
    console.warn(`RSS parsing failed: ${reason}. Ignoring.`);
    parsingDone = false;
  });
  if (!parsingDone) {
    // Normally we SHOULD NOT return 400 in this case...
    res.sendStatus(400);
    return;
  }
  if (!Object.values(config.TOPICS || {}).includes(body.feedUrl)) {
    // This is not what we want
    res.sendStatus(200);
    return;
  }
  let topicTitle = Object.entries(config.TOPICS).filter(
    (x) => x[1] == body.feedUrl
  )[0][0];
  for (const item of body.items) {
    if (!item.videoId || !item.channelId) continue;
    let meta = await ytAPI
      .getVideoInfo(item.videoId, config.YOUTUBE_API_KEY || "")
      .catch((e) => {
        console.error(
          `YouTube API Error when requesting ${item.videoId}:`,
          e.code,
          e.errors,
          e.message
        );
      });
    if (meta === undefined) {
      // Upstream API error but we still give 200
      res.sendStatus(200);
      return;
    }

    // Everything is well
    console.log(meta);
    //
    let vid = meta.id;
    let time = meta.liveStreamingDetails.scheduledStartTime;
    let title = item.title;
    let targetDate = new Date(time);
    let currDate = new Date();
    if (targetDate - currDate > RECORD_TIME_LIMIT) {
      console.log(`${vid}: Schedule too far away. Ignoring.`);
      res.sendStatus(304);
      return;
    }
    let announceData = {
      name: topicTitle,
      title: title,
      time: time,
      vid: vid,
    };

    if (
      Object.keys(seenVidsAndTime).includes(vid) &&
      identicalInfo(seenVidsAndTime[vid], announceData)
    ) {
      // Don't modify it if there's no changes!
      console.log(`${vid}: Identical info has been seen before.`);
      res.sendStatus(200);
      return;
    }

    // Clean info
    cron.delCronGroup(vid);
    // Update history info
    seenVidsAndTime[vid] = announceData;

    cron.addCron(
      currDate,
      function () {
        message.announceCast(announceData, CHAT_ID);
      },
      vid
    );
    if (targetDate - 30 * 60 * 1000 <= currDate) {
      console.log(`Less than 30 minutes to this stream. Ignoring this cron.`);
      res.sendStatus(200);
      return;
    }
    cron.addCron(
      targetDate - 30 * 60 * 1000,
      function () {
        message.announceCast(
          Object.assign(announceData, {
            time_left: "30分钟",
          }),
          CHAT_ID
        );
      },
      vid
    );

    if (targetDate - 3 * 60 * 60 * 1000 <= currDate) {
      console.log(`Less than 3 hours to this stream. Ignoring this cron.`);
      res.sendStatus(200);
      return;
    }
    cron.addCron(
      targetDate - 3 * 60 * 60 * 1000,
      function () {
        message.announceCast(
          Object.assign(announceData, {
            time_left: "3小时",
          }),
          CHAT_ID
        );
      },
      vid
    );
  }

  res.sendStatus(200);
  return;
});

console.log("Accepting", config.TOPICS);

module.exports = app;
