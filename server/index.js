const express = require("express");
const cron = require("./cron");
const message = require("./message");
const bodyParser = require("body-parser");
const config = require("./config.json");

const CHAT_ID = config.CHAT_ID;
const SERVER_PORT = config.SERVER_PORT;

const app = express();
app.use(bodyParser.json());

cron.init();

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/schedule", (req, res) => {
  if (!req.body.vid) {
    res.status(400).send("Bad request: No video id");
    return;
  }
  if (!req.body.time) {
    res.status(400).send("Bad request: No start time");
    return;
  }
  let vid = req.body.vid;
  let time = req.body.time;
  let oldCron = cron.getCronGroupLast(vid);
  let isChangedOrNewCron = true;
  if (oldCron) {
    if (time === oldCron.time) isChangedOrNewCron = false;
  }
  cron.delCronGroup(vid);
  let announceData = {
    name: "星姐",
    title: req.body.title,
    time: time,
    vid: vid
  };
  let targetDate = new Date(time);
  let currDate = new Date();
  if (isChangedOrNewCron) {
    cron.addCron(
      currDate,
      function() {
        message.announceCast(announceData, CHAT_ID);
      },
      vid
    );
  }
  if (targetDate - 3 * 60 * 60 * 1000 <= currDate) {
    console.log(`Less than 3 hours to this stream. Ignoring this cron.`);
    res.sendStatus(200);
    return;
  }
  cron.addCron(
    targetDate - 3 * 60 * 60 * 1000,
    function() {
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
    function() {
      message.announceCast(announceData, CHAT_ID);
    },
    vid
  );
  res.sendStatus(200);
});

app.listen(SERVER_PORT, () =>
  console.log(`SLW server listening on port ${SERVER_PORT}!`)
);
