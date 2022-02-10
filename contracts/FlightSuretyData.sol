pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    uint256 private constant INSURANCE_PERCENTAGE = 150;

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => uint256) private authorizedContracts;

    struct Airline {
        uint256 id;
        uint256 funds;
        bool isActive;
        string name;
    }
    uint256 private airlinesCount = 0;
    uint256 private fundedAirlinesCount = 0;
    mapping(address => Airline) airlines;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        string flightNumber;
    }
    mapping(bytes32 => Flight) private flights;

    struct Insurance {
        address passenger;
        uint256 amount;
        string flightNumber;
        bool paidOut;
    }

    mapping(bytes32 => Insurance[]) private insurances;

    mapping(address => uint256) private passengerFunds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event PassengerCredited(string flight, address passenger, uint256 amount);
    event PayoutPassenger(address passenger, uint256 amount);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner and register first airline
     */
    constructor(address firstAirline) public {
        contractOwner = msg.sender;
        authorizedContracts[msg.sender] = 1;
        airlinesCount = airlinesCount.add(1);
        airlines[firstAirline] = Airline({
            id: airlinesCount,
            name: "First Airline",
            isActive: true,
            funds: 0
        });
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    /   @dev Modifier that requires caller in authorized callers
    **/
    modifier isCallerAuthorized() {
        require(
            authorizedContracts[msg.sender] == 1,
            "Caller is not authorized"
        );
        _;
    }

    modifier requireAirlineExists(address _address) {
        require(airlines[_address].id > 0, "Airline does not exists");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deAuthorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function getAirline(address _airline)
        external
        view
        requireAirlineExists(_airline)
        returns (
            address airlineAddress,
            uint256 id,
            bool isActive,
            string name,
            uint256 funds
        )
    {
        airlineAddress = _airline;
        id = airlines[airlineAddress].id;
        isActive = airlines[_airline].isActive;
        name = airlines[_airline].name;
        funds = airlines[_airline].funds;
    }

    function isAirline(address _airline) external view returns (bool) {
        return airlines[_airline].id > 0;
    }

    function isAirlineFunded(address _airline) external view returns (bool) {
        return airlines[_airline].funds > 0;
    }

    function getAirlineCount()
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return airlinesCount;
    }

    function getFundedAirlinesCount()
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return fundedAirlinesCount;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address _airline, string _name)
        external
        isCallerAuthorized
        requireIsOperational
        returns (bool)
    {
        require(_airline != address(0), "Provide a valid address.");
        require(
            !bool(airlines[_airline].id > 0),
            "Airline already registered."
        );

        airlinesCount = airlinesCount.add(1);
        airlines[_airline] = Airline({
            name: _name,
            id: airlinesCount,
            isActive: false,
            funds: 0
        });
        return true;
    }

    /**
     * @dev Register a flight for insurance
     *
     */
    function registerFlight(string flightNumber)
        external
        requireIsOperational
        isCallerAuthorized
    {
        require(bytes(flightNumber).length > 0);
        bytes32 key = getFlightKey(flightNumber);
        require(!flights[key].isRegistered, "Flight is already registered");

        flights[key] = Flight({
            isRegistered: true,
            statusCode: 0,
            updatedTimestamp: block.timestamp,
            airline: msg.sender,
            flightNumber: flightNumber
        });
    }

    function updateFlightStatus(
        string _flightNumber,
        uint8 _statusCode,
        uint256 _timestamp
    ) external requireIsOperational isCallerAuthorized {
        bytes32 key = getFlightKey(_flightNumber);
        flights[key].updatedTimestamp = _timestamp;
        flights[key].statusCode = _statusCode;
    }

    function getFlight(string _flightNumber)
        external
        view
        returns (
            bool isRegistered,
            uint8 statusCode,
            uint256 updatedTimestamp,
            address airline,
            string flightNumber
        )
    {
        bytes32 key = getFlightKey(_flightNumber);
        Flight memory flight = flights[key];
        isRegistered = flight.isRegistered;
        statusCode = flight.statusCode;
        updatedTimestamp = flight.updatedTimestamp;
        airline = flight.airline;
        flightNumber = flight.flightNumber;
    }

    function isFlightRegistered(string _flightNumber)
        external
        view
        returns (bool)
    {
        return flights[getFlightKey(_flightNumber)].isRegistered;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(string flightNumber)
        external
        payable
        requireIsOperational
        isCallerAuthorized
    {
        bytes32 key = getFlightKey(flightNumber);
        insurances[key].push(
            Insurance({
                passenger: tx.origin,
                amount: msg.value,
                flightNumber: flightNumber,
                paidOut: false
            })
        );
    }

    function isPassengerInsuredForFlight(string flightNumber, address passenger)
        external
        view
        returns (bool)
    {
        bytes32 key = getFlightKey(flightNumber);
        Insurance[] memory flightInsurances = insurances[key];
        for (uint256 i = 0; i < flightInsurances.length; i++) {
            if (flightInsurances[i].passenger == passenger) {
                return true;
            }
        }
        return false;
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(string flight)
        external
        requireIsOperational
        isCallerAuthorized
    {
        bytes32 key = getFlightKey(flight);
        for (uint256 i = 0; i < insurances[key].length; i++) {
            Insurance memory flightInsurance = insurances[key][i];
            if (!flightInsurance.paidOut) {
                flightInsurance.paidOut = true;
                // calculate insurance amount 1.5 * input
                uint256 amount = flightInsurance
                    .amount
                    .mul(INSURANCE_PERCENTAGE)
                    .div(100);
                // credit the passenger with funds
                insurances[key][i] = flightInsurance;
                passengerFunds[flightInsurance.passenger] = passengerFunds[
                    flightInsurance.passenger
                ].add(amount);
                emit PassengerCredited(
                    flight,
                    flightInsurance.passenger,
                    amount
                );
            }
        }
    }

    function getPassengerFunds(address passenger)
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return passengerFunds[passenger];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external payable {
        uint256 amount = passengerFunds[msg.sender];
        require(passengerFunds[msg.sender] > 0, "You don't have any credits");
        require(
            address(this).balance >= amount,
            "Contract has insufficient funds."
        );
        passengerFunds[msg.sender] = 0;
        msg.sender.transfer(amount);
        emit PayoutPassenger(msg.sender, amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable requireIsOperational {
        uint256 currentFunds = airlines[msg.sender].funds;
        if (currentFunds == 0) {
            require(
                msg.value >= 10 ether,
                "Initial funding has to be 10 Ether"
            );
            fundedAirlinesCount = fundedAirlinesCount.add(1);
        }
        airlines[msg.sender].funds = currentFunds.add(msg.value);
    }

    function getFlightKey(string memory flight)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(flight));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        fund();
    }
}
