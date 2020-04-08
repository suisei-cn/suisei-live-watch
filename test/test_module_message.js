const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const main = require("../src/message");
chai.use(chaiHttp);
const should = require("chai").should();

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BOT_KEY = process.env.TELEGRAM_BOT_KEY;

describe("Message processing", function () {
  before(() => {
    main.setConfig({
      BOT_KEY,
    });
  });
  it("can announce and edit cast", async function () {
    let ret = await main.announceVid(
      {
        name: "text1",
        vid: 123,
      },
      CHAT_ID,
      false
    );
    expect(ret).to.be.a("number");
    let ret2 = await main.announceVid(
      {
        name: "text2",
        vid: 456,
      },
      CHAT_ID,
      ret
    );
    expect(ret2).to.equal(ret);
  });
  it("can announce and edit video", async function () {
    let ret = await main.announceVid(
      {
        name: "text11",
        vid: 123,
      },
      CHAT_ID,
      false,
      true
    );
    expect(ret).to.be.a("number");
    let ret2 = await main.announceVid(
      {
        name: "text12",
        vid: 456,
      },
      CHAT_ID,
      ret,
      true
    );
    expect(ret2).to.equal(ret);
  });
});
