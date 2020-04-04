var cronList = [];
var routineID;
var config = {};
var CHECK_INTERVAL = 1000;

function setConfig(conf) {
  config = conf;
  CHECK_INTERVAL = config.CHECK_INTERVAL || 1000;
}

function addCron(time, callback, group) {
  let insertSeq = 0;
  for (; insertSeq < cronList.length; insertSeq++) {
    if (cronList[insertSeq].time > time) break;
  }
  console.log(`Cron added for ${group} at ${new Date(time).toLocaleString()}`);
  cronList.splice(insertSeq, 0, {
    time,
    callback,
    group,
  });
}

function delCronGroup(group) {
  console.log(`All cron deleted for ${group}`);
  cronList = cronList.filter((x) => x.group !== group);
}

function init() {
  routineID = setInterval(() => {
    let now = new Date();
    while (cronList.length && cronList[0].time - now < CHECK_INTERVAL) {
      let cron = cronList.splice(0, 1)[0];
      console.log(
        `Cron resolved for ${cron.group} at ${new Date(
          cron.time
        ).toLocaleString()}`
      );
      try {
        cron.callback();
      } catch (e) {
        console.log(`Cron ${cron.group} errored: ${e}`);
      }
    }
  }, CHECK_INTERVAL);
}

function deinit() {
  clearInterval(routineID);
  routineID = undefined;
}

module.exports = {
  addCron,
  delCronGroup,
  init,
  deinit,
  setConfig,
};
