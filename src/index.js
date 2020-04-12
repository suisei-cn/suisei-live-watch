const express = require("express");
const cron = require("./cron");
const message = require("./message");
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

var config = {};

const options = {
  inflate: true,
  limit: "100kb",
  type: "*/*",
};

const app = express();
app.use(bodyParser.text(options));

const seenVidsAndTime = {};

function listen() {
  const CHAT_ID = config.CHAT_ID;
  const SUBPATH = utils.getSubpath(config);
  const RECORD_TIME_LIMIT =
    config.RECORD_TIME_LIMIT || 90 * 24 * 60 * 60 * 1000;
  const EDIT_PREVIOUS_MESSAGE_IN = config.EDIT_PREVIOUS_MESSAGE_IN || 1000;
  const RENEW_BEFORE = config.RENEW_BEFORE || 12 * 60 * 60;
  const CALLBACK_URL = config.CALLBACK_URL;

  cron.init();

  function identicalInfo(a, b) {
    for (const i of ["name", "title", "time", "vid"]) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  // Sometime I really miss flatten
  const validTopics = [].concat(
    ...[...Object.values(config.SUB_TOPICS || {})],
    ...Object.values(config.TOPICS || {})
  );

  app.get(SUBPATH, (req, res) => {
    // Filter PSHB challenges
    // https://pubsubhubbub.github.io/PubSubHubbub/pubsubhubbub-core-0.4.html
    let topic = req.query["hub.topic"] || "";
    if (validTopics.includes(topic)) {
      if (Object.values(config.TOPICS || {}).includes(topic)) {
        let topicTitle = Object.entries(config.TOPICS).filter(
          (x) => x[1] == topic
        )[0][0];
        console.info(`Topic ${topicTitle} challenge passed.`);
      } else {
        console.info(`Side-topic (id: ${topic}) challenge passed.`);
      }
      if (config.CALLBACK_URL && req.query["hub.lease_seconds"]) {
        cron.addCron(
          Number(new Date()) +
            (Number(req.query["hub.lease_seconds"]) - RENEW_BEFORE) * 1000,
          function () {
            utils.subscriptionRequest(CALLBACK_URL, topic);
          },
          topic
        );
      } else {
        console.warn(
          `${topic}: We can't see the lease time of this subscription. It may expire without notice.`
        );
      }
      res.status(200).send(req.query["hub.challenge"]);
      return;
    } else {
      console.info(
        `Topic challenge failed (topic: ${topic}). If this is what you want, add this link to "config.json".`
      );
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
      res.status(200).send("bad_rss");
      return;
    }
    if (!validTopics.includes(body.feedUrl)) {
      // This is not what we want
      res.status(200).send("bad_topic");
      return;
    }

    let topicTitle;
    let fromSubtopic = false;
    if (Object.values(config.TOPICS || {}).includes(body.feedUrl)) {
      topicTitle = Object.entries(config.TOPICS).filter(
        (x) => x[1] == body.feedUrl
      )[0][0];
    } else {
      fromSubtopic = true;
      topicTitle = Object.entries(config.SUB_TOPICS).filter((x) =>
        x[1].includes(body.feedUrl)
      )[0][0];
    }

    for (const item of body.items) {
      if (!item.videoId || !item.channelId) continue;
      let meta = await ytAPI
        .getVideoInfo(
          item.videoId,
          config.YOUTUBE_API_KEY || "",
          fromSubtopic || config.POST_FETCH
        )
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
        res.status(200).send("no_info_from_youtube");
        return;
      }

      if (config.POST_FETCH) {
        try {
          const pf = require(config.POST_FETCH);
          pf(Object.assign({}, item, meta));
        } catch (e) {
          console.warn(`post_fetch hook failed: ${e}`);
        }
      }

      if (fromSubtopic) {
        if (
          !meta.snippet.title.includes(topicTitle) &&
          !meta.snippet.description.includes(topicTitle)
        ) {
          // It's not related
          res.status(200).send("thx_but_not_useful");
          return;
        }
      }

      let vid = meta.id;
      let title = item.title;

      let announceData = {
        name: topicTitle,
        title: title,
        time: new Date(item.pubDate),
        vid: vid,
        fromSubtopic,
      };

      if (
        Object.keys(seenVidsAndTime).includes(vid) &&
        identicalInfo(seenVidsAndTime[vid], announceData)
      ) {
        // Don't modify it if there's no changes!
        console.log(`${vid}: Identical info has been seen before.`);
        res.status(200).send("no_change");
        return;
      }

      // Clean info
      cron.delCronGroup(vid);
      // Last latest message
      let lastMsgId = seenVidsAndTime[vid]
        ? seenVidsAndTime[vid].lastMsg
        : false;

      if (!meta.liveStreamingDetails) {
        // It's a video, not livestream
        // Well let's post it ONCE.
        console.log(`${vid} is a video.`);
        if (!seenVidsAndTime[vid]) {
          let msgid = await message.announceVid(
            announceData,
            CHAT_ID,
            lastMsgId
          );
          seenVidsAndTime[vid] = {
            lastMsg: msgid,
          };
          setTimeout(() => {
            seenVidsAndTime[vid].lastMsg = undefined;
          }, EDIT_PREVIOUS_MESSAGE_IN);
        }
        res.status(200).send("video");
        return;
      }

      if (meta.liveStreamingDetails.actualEndTime) {
        // It's now a video...
        // ALso, let's post it ONCE.
        console.log(`${vid} has ended.`);
        if (!seenVidsAndTime[vid]) {
          let msgid = await message.announceVid(
            announceData,
            CHAT_ID,
            lastMsgId,
            true
          );
          seenVidsAndTime[vid] = {
            lastMsg: msgid,
          };

          setTimeout(() => {
            seenVidsAndTime[vid].lastMsg = undefined;
          }, EDIT_PREVIOUS_MESSAGE_IN);
        }
        res.status(200).send("finished_livestream");
        return;
      }

      // Update history info
      seenVidsAndTime[vid] = announceData;

      // Everything is well
      let targetDate = new Date(meta.liveStreamingDetails.scheduledStartTime);
      announceData.time = targetDate;
      let currDate = new Date();
      if (targetDate - currDate > RECORD_TIME_LIMIT) {
        console.log(`${vid}: Schedule too far away. Ignoring.`);
        res.status(200).send("too_far_away");
        return;
      }

      cron.addCron(
        currDate,
        async function () {
          let msgid = await message.announceCast(
            announceData,
            CHAT_ID,
            lastMsgId
          );
          seenVidsAndTime[vid].lastMsg = msgid;
          setTimeout(() => {
            seenVidsAndTime[vid].lastMsg = undefined;
          }, EDIT_PREVIOUS_MESSAGE_IN);
        },
        vid
      );
      if (targetDate - 30 * 60 * 1000 <= currDate) {
        console.log(`Less than 30 minutes to this stream. Ignoring this cron.`);
        res.status(200).send("about_to_start");
        return;
      }
      cron.addCron(
        targetDate - 30 * 60 * 1000,
        async function () {
          let msgid = message.announceCast(
            Object.assign(announceData, {
              time_left: "30分钟",
            }),
            CHAT_ID,
            lastMsgId
          );
          seenVidsAndTime[vid].lastMsg = msgid;
          console.log(EDIT_PREVIOUS_MESSAGE_IN);
          setTimeout(() => {
            seenVidsAndTime[vid].lastMsg = undefined;
          }, EDIT_PREVIOUS_MESSAGE_IN);
        },
        vid
      );

      if (targetDate - 3 * 60 * 60 * 1000 <= currDate) {
        console.log(`Less than 3 hours to this stream. Ignoring this cron.`);
        res.status(200).send("soon_to_start");
        return;
      }
      cron.addCron(
        targetDate - 3 * 60 * 60 * 1000,
        async function () {
          let msgid = await message.announceCast(
            Object.assign(announceData, {
              time_left: "3小时",
            }),
            CHAT_ID,
            lastMsgId
          );
          seenVidsAndTime[vid].lastMsg = msgid;
          setTimeout(() => {
            seenVidsAndTime[vid].lastMsg = undefined;
          }, EDIT_PREVIOUS_MESSAGE_IN);
        },
        vid
      );
    }

    res.status(200).send("ack");
    return;
  });
}

function updateConfigAndInit(conf) {
  config = conf;
  listen();
  console.log("Accepting", config.TOPICS, config.SUB_TOPICS);
  cron.setConfig(conf);
  message.setConfig(conf);
  if (!config.CALLBACK_URL) {
    console.warn(
      "[WARN] You didn't specify the CALLBACK_URL! Your subscription may expire automatically without notice."
    );
  }
}

module.exports = {
  app,
  updateConfigAndInit,
  seenVidsAndTime,
  cronList: cron.cronList,
};
