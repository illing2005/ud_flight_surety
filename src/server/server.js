import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
require("babel-polyfill");

const NUMBER_OF_ORACLES = 10;
const FLIGHT_STATUS_CODES = [0, 10, 20, 30, 40, 50];

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
const accounts = web3.eth.getAccounts();
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);
let flightSuretyData = new web3.eth.Contract(
  FlightSuretyData.abi,
  config.dataAddress
);
const oracles = [];

// listen to OracleRequest event
flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0,
  },
  async function (error, event) {
    const { returnValues } = event;
    const index = returnValues[0];
    const airline = returnValues[1];
    const flightNumber = returnValues[2];
    const timestamp = returnValues[3];

    for (let i = 0; i < oracles.length; i++) {
      let statusCode = FLIGHT_STATUS_CODES[Math.floor(Math.random() * FLIGHT_STATUS_CODES.length)];

      let oracleIndices = await flightSuretyApp.methods
        .getMyIndexes()
        .call({ from: oracles[i] });

      // only submit response if correct index
      if (oracleIndices.indexOf(index) >= 0) {
        try {
          await flightSuretyApp.methods
            .submitOracleResponse(
              index,
              airline,
              flightNumber,
              timestamp,
              statusCode
            )
            .send({ from: oracles[i], gas: 99999 });
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
);

// listen to OracleRegistered event
flightSuretyApp.events.OracleRegistered(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) console.log(error);
    console.log("OracleRegistered");
    console.log(event.returnValues);
    console.log('-----------------');
  }
);

// listen to OracleReport event
flightSuretyApp.events.OracleReport(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) console.log(error);
    console.log("OracleReport");
    console.log(event.returnValues);
    console.log('-----------------');
  }
);

// listen to FlightStatusInfo event
flightSuretyApp.events.FlightStatusInfo(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) console.log(error);
    console.log("FlightStatusInfo");
    console.log(event.returnValues);
    console.log('-----------------');
  }
);


async function registerOracles() {
  const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  const accts = await accounts;

  const startAccount = 10;

  for (let i = startAccount; i < startAccount + NUMBER_OF_ORACLES; i++) {
    oracles.push(accts[i]);
    await flightSuretyApp.methods.registerOracle().send({
      from: accts[i],
      value: fee,
      gas: 5000000,
      gasPrice: 20000000,
    });
  }
}

registerOracles();

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!",
  });
});

export default app;
