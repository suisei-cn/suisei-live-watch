const fetch = require("node-fetch");
const moment = require("moment");
require("moment-timezone");
moment.locale("zh-cn");

var BOT_KEY = "";

function setConfig(conf) {
  BOT_KEY = conf.BOT_KEY;
}

async function sendTGMessage(chatid, text) {
  await fetch(`https://api.telegram.org/bot${BOT_KEY}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      chat_id: chatid,
      text: text,
      parse_mode: "markdown",
    }),
  });
}

function announceCast(data, chatid) {
  let momentDate = moment(data.time);
  let dateTzString = momentDate.tz("Asia/Shanghai").format("lll");
  sendTGMessage(
    chatid,
    data.time_left
      ? `#${data.name}直播预告 ${data.fromSubtopic ? "#联动" : ""}\n` +
          `距离${data.name}直播还有${data.time_left}。\n` +
          `${data.title}\n` +
          `时间：${dateTzString} (CST)\n` +
          `[直播地址](https://youtu.be/${data.vid})`
      : `#${data.name}直播预告 ${
          data.fromSubtopic ? "#联动 " : ""
        }#新直播计划\n` +
          `${data.title}\n` +
          `时间：${dateTzString} (CST)\n` +
          `[直播地址](https://youtu.be/${data.vid})`
  );
}

function announceVid(data, chatid, wasstream = false) {
  let momentDate = moment(data.time);
  let dateTzString = momentDate.tz("Asia/Shanghai").format("lll");
  sendTGMessage(
    chatid,
    (wasstream
      ? `#${data.name}直播录像 ${data.fromSubtopic ? "#联动" : ""}\n`
      : `#${data.name}发布新视频 ${data.fromSubtopic ? "#联动" : ""}\n`) +
      `${data.title}\n` +
      `时间：${dateTzString} (CST)\n` +
      `[视频地址](https://youtu.be/${data.vid})`
  );
}

module.exports = { announceCast, announceVid, setConfig };
