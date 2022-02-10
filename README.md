# Ethereum Dapp for Flight Surety

This project was developed as part of the [Udacity Blockchain Developer Nanodegree Program](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309)

FlightSurety is a decentralized application where passengers can buy flight insurance.
The flow is the following:

### For Airlines:
- Airlines can be registered to be part of the insurance program
- Airlines need to deploy 10 ETH to the contract to get activated
- Airlines can register flights in the contract

### For Passengers:
- Passengers can buy flight insurance for up to 1 ETH
- If the flight is delayed because of the airline the passenger gets 150% of his depost
- Passengers can withdraw their funds at any time

### Consensus: 
Consensus on the flight status is achieved by oracles. 
- Oracles can register to take part of the flight status voting. 
- Oracles need to pay a registration fee of 1 ETH.
- Oracles get asked for their input on flight status after the flight has arrived.
- The flight status is determined by majority vote.
- In case the flight was delayed all insurees get credited.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Libraries:

- Node v10.24.1
- Truffle v5.0.2
- Solidity v0.4.24
