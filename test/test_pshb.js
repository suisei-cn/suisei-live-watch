const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const main = require("../src/index");
chai.use(chaiHttp);
const should = require("chai").should();
const server = main.app;

describe("PSHB Challenges", function () {
  before(() => {
    main.updateConfigAndInit({
      CHAT_ID: -1,
      BOT_KEY: "",
      CHECK_INTERVAL: 1000,
      SERVER_PORT: 3000,
      PATH_KEY: "/sub",
      YOUTUBE_API_KEY: "",
      TOPICS: {
        星姐:
          "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A",
      },
    });
  });
  it("should accept right challenges", (done) => {
    chai
      .request(server)
      .get(
        "/sub?hub.topic=https%3A%2F%2Fwww.youtube.com%2Fxml%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUC5CwaMl1eIgY8h02uZw7u8A&hub.challenge=challenge"
      )
      .set("content-type", "application/x-www-form-urlencoded")
      .send({})
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("challenge");
        done();
      });
  });

  it("should refuse false challenges", (done) => {
    chai
      .request(server)
      .get(
        "/4213?hub.topic=https%3A%2F%2Fwww.youtube.com%2Fxml%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUCDqI2jOz0weumE8s7paEk6g&hub.challenge=challenge"
      )
      .set("content-type", "application/x-www-form-urlencoded")
      .send({})
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
