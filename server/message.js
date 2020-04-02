const fetch = require("node-fetch");
const config = require("./config.json");
const moment = require("moment");
const mtz = require("moment-timezone");
moment.locale("zh-cn");

const BOT_KEY = config.BOT_KEY;

async function sendTGMessage(chatid, text) {
  await fetch(`https://api.telegram.org/bot${BOT_KEY}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      chat_id: chatid,
      text: text,
      parse_mode: "markdown"
    })
  });
}

function announceCast(data, chatid) {
  let momentDate = moment(data.time);
  let dateTzString = momentDate.tz("Asia/Shanghai").format("lll");
  sendTGMessage(
    chatid,
    data.time_left
      ? `#${data.name}直播预告\n` +
          `距离${data.name}直播还有${data.time_left}。\n` +
          `${data.title}\n` +
          `时间：${dateTzString} (CST)\n` +
          `[直播地址](https://youtu.be/${data.vid})`
      : `#${data.name}直播预告 #新直播计划\n` +
          `${data.title}\n` +
          `时间：${dateTzString} (CST)\n` +
          `[直播地址](https://youtu.be/${data.vid})`
  );
}

module.exports = { announceCast };
