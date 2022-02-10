import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });

    DOM.elid("submit-airline").addEventListener("click", () => {
      const airlineAddress = DOM.elid("airline-address").value;
      contract.registerAirline(airlineAddress, (error, result) => {
        display("Airline Status", "", [
        { label: "Register Airline", error: error, value: result.airline },
      ]);
      })

    });

    DOM.elid("submit-fund").addEventListener("click", () => {
      const amount = DOM.elid("airline-fund").value;
      contract.fundAirline(amount, (error, result) => {
        display("Airline Status", "", [
            { label: "Fund Airline", error: error, value: `${amount} ETH added` }
            ]);
      });
    });

    DOM.elid("submit-flight").addEventListener("click", () => {
      const flightNumber = DOM.elid("airline-flight").value;
      contract.registerFlight(flightNumber, (error, result) => {
        display("Airline Status", "", [
            { label: "Flight submitted", error: error, value: `${flightNumber} added` }
            ]);
      });
    });

    DOM.elid("submit-insurance").addEventListener("click", () => {
      const flightNumber = DOM.elid("passenger-flight").value;
      const amount = DOM.elid("passenger-fund").value;
      contract.buyInsurance(flightNumber, amount, (error, result) => {
        display("Passenger Status", "", [
            { label: "Buy insurance", error: error, value: `${amount} ETH insurance for ${flightNumber} bought` }
            ]);
      })
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
