var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyApp.setOperatingStatus(false);
    let reverted = false;
    try {
      await config.flightSuretyApp.registerAirline();
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyApp.setOperatingStatus(true);
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) creates first airline on deployment", async () => {
    const airline = await config.flightSuretyData.getAirline(
      config.firstAirline
    );
    assert.equal(airline[0], config.firstAirline);
    assert.equal(airline[1], 1);
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, "New Name", {
        from: config.firstAirline,
      });
    } catch (e) {}

    let result = await config.flightSuretyData.isAirline.call(newAirline);
    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) can add initial funds", async () => {
    let amount = web3.utils.toWei("10", "ether");

    await config.flightSuretyData.fund({
      from: config.firstAirline,
      value: amount,
    });
    const isFunded = await config.flightSuretyData.isAirlineFunded(
      config.firstAirline
    );

    assert.equal(isFunded, true, "Airline should be able to add funds");
  });

  it("(ariline) can register another airline WITHOUT consensus below 5 airlines", async () => {
    let newAirline = accounts[2];
    let amount = web3.utils.toWei("10", "ether");

    await config.flightSuretyApp.registerAirline(newAirline, "New Name", {
      from: config.firstAirline,
    });
    await config.flightSuretyData.fund({
      from: newAirline,
      value: amount,
    });
    let result = await config.flightSuretyData.isAirline.call(newAirline);
    let airlineCount = await config.flightSuretyData.getAirlineCount.call();
    assert.equal(result, true);
    assert.equal(airlineCount, 2);
  });

  it("(airline) needs at least 50% votes before registering new airline above 5 airlines", async () => {
    let amount = web3.utils.toWei("10", "ether");
    let airlineCount = parseInt(
      await config.flightSuretyData.getAirlineCount.call()
    );

    // Create and fund additional airlines without voting
    while (airlineCount < 4) {
      const newAirline = accounts[airlineCount + 1];
      await config.flightSuretyApp.registerAirline(
        newAirline,
        `Airline ${airlineCount + 1}`,
        {
          from: config.firstAirline,
        }
      );
      await config.flightSuretyData.fund({
        from: newAirline,
        value: amount,
      });
      airlineCount++;
    }
    airlineCount = parseInt(
      await config.flightSuretyData.getAirlineCount.call()
    );
    assert.equal(airlineCount, 4);

    // create new airline with voting
    const newAirline = accounts[airlineCount + 1];
    await config.flightSuretyApp.registerAirline(
      newAirline,
      `Airline ${airlineCount + 1}`,
      {
        from: config.firstAirline,
      }
    );
    // airline should not yet have been added
    let result = await config.flightSuretyData.isAirline.call(newAirline);
    assert.equal(
      result,
      false,
      "Airline should not be created with just one vote"
    );

    // airline should be created after third vote
    await config.flightSuretyApp.registerAirline(
      newAirline,
      `Airline ${airlineCount + 1}`,
      {
        from: accounts[3],
      }
    );
    result = await config.flightSuretyData.isAirline.call(newAirline);
    assert.equal(
      result,
      false,
      "Airline should not be created after second vote"
    );
    await config.flightSuretyApp.registerAirline(
      newAirline,
      `Airline ${airlineCount + 1}`,
      {
        from: accounts[4],
      }
    );
    result = await config.flightSuretyData.isAirline.call(newAirline);
    assert.equal(
      result,
      true,
      "Airline should have been created after third vote"
    );
  });

  it("(airline) can register new flight", async () => {
    const flightNumber = "AA100";
    await config.flightSuretyApp.registerFlight(flightNumber, {
      from: config.firstAirline,
    });

    const flight = await config.flightSuretyData.getFlight(
      flightNumber,
      config.owner,
      { from: config.firstAirline }
    );

    assert.equal(flight[0], true);
    assert.equal(flight[4], flightNumber);
  });
});
