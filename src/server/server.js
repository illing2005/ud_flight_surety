import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
require("babel-polyfill");

const NUMBER_OF_ORACLES = 10;

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
  function (error, event) {
    if (error) console.log(error);
    console.log(event);
  }
);

// listen to OracleRegistered event
flightSuretyApp.events.OracleRegistered(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) console.log(error);
    console.log(event);
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
