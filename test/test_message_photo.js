const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const main = require("../src/index");
chai.use(chaiHttp);
const should = require("chai").should();
const server = main.app;
const init = require("./utils");

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

describe("Message processing (with photo)", function () {
  before(() => {
    init(main, {
      SEND_AS_PHOTO_MESSAGE: true,
    });
  });
  it("should handle bad RSS", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send("")
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("bad_rss");
        done();
      });
  });
  it("should handle bad topic", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("", ""))
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("bad_topic");
        done();
      });
  });
  it("should handle bad video id", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("su1se1"))
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("no_info_from_youtube");
        done();
      });
  });
  it("should properly process video", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("3cqV5BKJHyk")) // video_only, pub at 20181122
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("past_video");
        should.exist(main.seenVidsAndTime["3cqV5BKJHyk"]);
        done();
      });
  });
  it("should properly process past stream", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("vQHVGXdcqEQ")) // stream, pub at 20200322
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("past_finished_livestream");
        should.exist(main.seenVidsAndTime["vQHVGXdcqEQ"]);
        done();
      });
  });
  it("should properly process very past stream", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("MOyqbQ_X63k")) // stream, pub at 20200107
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("past_finished_livestream");
        should.exist(main.seenVidsAndTime["MOyqbQ_X63k"]);
        done();
      });
  });
  it("should properly process far-away stream", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(generatePayloadForVideoID("O9V_EFbgpKQ")) // stream, plan at 20201030, might need to change in the future
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("too_far_away");
        done();
      });
  });
  it("should properly process non-keyword sub-topic", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(
        generatePayloadForVideoID("TZMDMFy1Phw", "UC8NZiqKx6fsDT3AVcMiVFyA")
      ) // Sub-topic video not related to keyword
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("thx_but_not_useful");
        done();
      });
  });
  it("should properly process keyword sub-topic", (done) => {
    chai
      .request(server)
      .post("/sub")
      .set("content-type", "application/atom+xml")
      .send(
        generatePayloadForVideoID("0HZJTIzy4aE", "UC8NZiqKx6fsDT3AVcMiVFyA")
      ) // Sub-topic video not related to keyword
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("past_finished_livestream");
        should.exist(main.seenVidsAndTime["0HZJTIzy4aE"]);
        done();
      });
  });
});
