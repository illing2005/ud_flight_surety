import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.mainAirline = null;
    this.passenger = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }
      this.mainAirline = this.airlines[0];
      this.passenger = this.passengers[0];
      callback();
    });
  }
  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload);
      });
  }

  registerAirline(airlineAddress, callback) {
    let self = this;
    let payload = {
      airline: airlineAddress,
    };
    self.flightSuretyApp.methods
      .registerAirline(payload.airline, "")
      .send({ from: self.mainAirline }, (error, result) => {
        callback(error, payload);
      });
  }

  async fundAirline(amount, callback) {
    const value = this.web3.utils.toWei(amount, "ether");
    const self = this;
    this.flightSuretyData.methods
      .fund()
      .send({ from: self.mainAirline, value }, (error, result) => {
        callback(error, { value });
      });
  }

  async registerFlight(flightNumber, callback) {
    const self = this;
    this.flightSuretyApp.methods
      .registerFlight(flightNumber)
      .send({ from: self.mainAirline, gas: 1000000 }, (error, result) => {
        callback(error, { flightNumber });
      });
  }

  async buyInsurance(flightNumber, amount, callback) {
    const self = this;
    const value = this.web3.utils.toWei(amount, "ether");
    this.flightSuretyApp.methods
      .buyInsurance(flightNumber)
      .send({ from: self.passenger, value, gas: 1000000 }, (error, result) => {
        callback(error, { flightNumber });
      });
  }

  async getPassengerFunds(callback) {
    const self = this;
    this.flightSuretyData.methods
      .getPassengerFunds(self.passenger)
      .call({ from: self.owner }, (error, result) => {
        callback(this.web3.utils.fromWei(result, "ether"));
      });
  }

  async withdrawFunds(callback) {
    const self = this;
    this.flightSuretyData.methods
      .pay()
      .send({ from: self.passenger, gas: 1000000 }, (error, result) => {
        callback(error, { });
      });
  }
}
