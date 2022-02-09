const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");

module.exports = function (deployer) {
  let firstAirline = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";
  deployer.deploy(FlightSuretyData, firstAirline).then((dataContract) => {
    return deployer.deploy(FlightSuretyApp, FlightSuretyData.address).then((appContract) => {
      let config = {
        localhost: {
          url: "http://localhost:9545",
          dataAddress: FlightSuretyData.address,
          appAddress: FlightSuretyApp.address,
        },
      };
      fs.writeFileSync(
        __dirname + "/../src/dapp/config.json",
        JSON.stringify(config, null, "\t"),
        "utf-8"
      );
      fs.writeFileSync(
        __dirname + "/../src/server/config.json",
        JSON.stringify(config, null, "\t"),
        "utf-8"
      );

      // Authorize app contract to call data contract
      dataContract.authorizeCaller(FlightSuretyApp.address);

    });
  });
};
