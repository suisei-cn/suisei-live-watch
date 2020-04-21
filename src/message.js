const fetch = require("node-fetch");
const moment = require("moment");
require("moment-timezone");
moment.locale("zh-cn");

var BOT_KEY = "";
var SEND_AS_PHOTO_MESSAGE = false;

function setConfig(conf) {
  BOT_KEY = conf.BOT_KEY;
  SEND_AS_PHOTO_MESSAGE = conf.SEND_AS_PHOTO_MESSAGE || false;
}

function checkResult(result, chatid, text, func) {
  if (!result.ok) {
    console.log(`Message sending failed when invoking ${func}:`, result);
    console.log(`Chatid: ${chatid}, text: ${text}`);
    return -1;
  }
  return result.result.message_id;
}

async function sendTGMessage(chatid, text) {
  let result = await fetch(
    `https://api.telegram.org/bot${BOT_KEY}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chatid,
        text: text,
        parse_mode: "markdown",
      }),
    }
  ).then((x) => x.json());
  return checkResult(result, chatid, text, "sendTGMessage");
}

async function sendTGPhotoMessage(chatid, text, photo_link) {
  let result = await fetch(`https://api.telegram.org/bot${BOT_KEY}/sendPhoto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      chat_id: chatid,
      photo: photo_link,
      caption: text,
      parse_mode: "markdown",
    }),
  }).then((x) => x.json());
  if (result.ok === false) {
    console.warn(`Send image post failed: ${result.description}`);
    return await sendTGMessage(chatid, text);
  }
  return checkResult(result, chatid, text, "sendTGPhotoMessage");
}

async function editTGMessageText(chatid, msgid, text) {
  let result = await fetch(
    `https://api.telegram.org/bot${BOT_KEY}/editMessageText`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chatid,
        message_id: msgid,
        text: text,
        parse_mode: "markdown",
      }),
    }
  ).then((x) => x.json());
  return checkResult(result, chatid, text, "editTGMessageText");
}

async function editTGMessageCaption(chatid, msgid, text) {
  let result = await fetch(
    `https://api.telegram.org/bot${BOT_KEY}/editMessageCaption`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chatid,
        message_id: msgid,
        caption: text,
        parse_mode: "markdown",
      }),
    }
  ).then((x) => x.json());
  return checkResult(result, chatid, text, "editTGMessageCaption");
}

async function announceCast(data, chatid, oldmsgid) {
  let momentDate = moment(data.time);
  let dateTzString = momentDate.tz("Asia/Shanghai").format("lll");
  let msgText = data.time_left
    ? `#${data.name}直播预告 ${data.fromSubtopic ? "#联动" : ""}\n` +
      `距离${data.name}直播还有${data.time_left}。\n` +
      `${data.title}\n` +
      `时间：${dateTzString} (CST)\n` +
      `[直播地址](https://youtube.com/watch?v=${data.vid})`
    : `#${data.name}直播预告 ${
        data.fromSubtopic ? "#联动 " : ""
      }#新直播计划\n` +
      `${data.title}\n` +
      `时间：${dateTzString} (CST)\n` +
      `[直播地址](https://youtube.com/watch?v=${data.vid})`;
  let r;
  if (oldmsgid) {
    if (SEND_AS_PHOTO_MESSAGE) {
      r = await editTGMessageCaption(chatid, oldmsgid, msgText);
    } else {
      r = await editTGMessageText(chatid, oldmsgid, msgText);
    }
  } else {
    if (SEND_AS_PHOTO_MESSAGE) {
      r = await sendTGPhotoMessage(
        chatid,
        msgText,
        `https://i.ytimg.com/vi/${data.vid}/sddefault.jpg`
      );
    } else {
      r = await sendTGMessage(chatid, msgText);
    }
  }
  return r;
}

async function announceVid(data, chatid, oldmsgid, wasstream = false) {
  let momentDate = moment(data.time);
  let dateTzString = momentDate.tz("Asia/Shanghai").format("lll");
  let msgText =
    (wasstream
      ? `#${data.name}直播录像 ${data.fromSubtopic ? "#联动" : ""}\n`
      : `#${data.name}发布新视频 ${data.fromSubtopic ? "#联动" : ""}\n`) +
    `${data.title}\n` +
    `时间：${dateTzString} (CST)\n` +
    `[视频地址](https://youtube.com/watch?v=${data.vid})`;
  let r;
  if (oldmsgid) {
    if (SEND_AS_PHOTO_MESSAGE) {
      r = await editTGMessageCaption(chatid, oldmsgid, msgText);
    } else {
      r = await editTGMessageText(chatid, oldmsgid, msgText);
    }
  } else {
    if (SEND_AS_PHOTO_MESSAGE) {
      r = await sendTGPhotoMessage(
        chatid,
        msgText,
        `https://i.ytimg.com/vi/${data.vid}/sddefault.jpg`
      );
    } else {
      r = await sendTGMessage(chatid, msgText);
    }
  }
  return r;
}

module.exports = { announceCast, announceVid, setConfig };
