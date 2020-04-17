const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const main = require("../src/index");
chai.use(chaiHttp);
const should = require("chai").should();
const server = main.app;
const init = require("./utils");

describe("PSHB Challenges", function () {
  before(() => {
    init(main);
  });
  it("should accept right challenges and plan renew (topic)", (done) => {
    chai
      .request(server)
      .get(
        "/sub?hub.topic=https%3A%2F%2Fwww.youtube.com%2Fxml%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUC5CwaMl1eIgY8h02uZw7u8A&hub.challenge=challenge&hub.lease_seconds=15"
      )
      .send({})
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("challenge");
        main.cronList
          .filter(
            (x) =>
              x.group ==
              "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC5CwaMl1eIgY8h02uZw7u8A"
          )
          .length.should.equal(1);
        done();
      });
  });

  it("should accept right challenges and plan renew (side-topic)", (done) => {
    chai
      .request(server)
      .get(
        "/sub?hub.topic=https%3A%2F%2Fwww.youtube.com%2Fxml%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUC8NZiqKx6fsDT3AVcMiVFyA&hub.challenge=challenge&hub.lease_seconds=15"
      )
      .set("content-type", "application/x-www-form-urlencoded")
      .send({})
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.equal("challenge");
        main.cronList
          .filter(
            (x) =>
              x.group ==
              "https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC8NZiqKx6fsDT3AVcMiVFyA"
          )
          .length.should.equal(1);
        done();
      });
  });

  it("should refuse false challenges", (done) => {
    chai
      .request(server)
      .get(
        "/4213?hub.topic=https%3A%2F%2Fwww.youtube.com%2Fxml%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUCDqI2jOz0weumE8s7paEk6g&hub.challenge=challenge&hub.lease_seconds=15"
      )
      .send({})
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
