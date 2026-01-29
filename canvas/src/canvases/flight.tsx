import React, { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import type { FlightConfig } from "./flight/types";
import { formatPrice } from "./flight/types";

interface Props {
  id: string;
  config?: FlightConfig;
  socketPath?: string;
  scenario?: string;
}

export function FlightCanvas({ id, config, socketPath, scenario = "booking" }: Props) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const flights = config?.flights || [];
  const title = config?.title || "Flight Booking";

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    } else if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.min(flights.length - 1, i + 1));
    } else if (key.return && flights[selectedIndex]) {
      console.log(`Selected: ${flights[selectedIndex].flightNumber}`);
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta">{title}</Text>
      </Box>
      
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
        {flights.length === 0 ? (
          <Text color="gray">No flights available</Text>
        ) : (
          flights.map((flight, idx) => (
            <Box key={flight.id} marginBottom={1}>
              <Text color={idx === selectedIndex ? "cyan" : "white"} bold={idx === selectedIndex}>
                {idx === selectedIndex ? "> " : "  "}
                {flight.flightNumber} - {flight.origin.code} → {flight.destination.code}
              </Text>
              <Text color="green"> {formatPrice(flight.price, flight.currency)}</Text>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">{"↑↓ navigate • Enter select • q quit"}</Text>
      </Box>
    </Box>
  );
}
