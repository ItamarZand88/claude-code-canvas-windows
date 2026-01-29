---
name: flight
description: |
  Flight canvas for comparing flights and selecting seats.
  Use when users need to browse flight options and book seats.
---

# Flight Canvas

Flight comparison and selection interface.

## Example Prompts

Try asking Claude:

- "Find flights from San Francisco to Denver"
- "Show me morning flights to NYC"
- "Book me a window seat on the cheapest flight"

## Scenarios

### `booking` (default)
Interactive flight comparison.

```bash
bun run src/cli.ts spawn flight --scenario booking --config '{
  "title": "Flight Booking",
  "flights": [
    {
      "id": "ua123",
      "airline": "United Airlines",
      "flightNumber": "UA 123",
      "origin": {"code": "SFO", "city": "San Francisco"},
      "destination": {"code": "DEN", "city": "Denver"},
      "departureTime": "2026-01-27T12:55:00",
      "arrivalTime": "2026-01-27T16:37:00",
      "price": 34500,
      "currency": "USD"
    }
  ]
}'
```

## Configuration

```typescript
interface FlightConfig {
  flights: Flight[];
  title?: string;
}

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departureTime: string;  // ISO datetime
  arrivalTime: string;    // ISO datetime
  price: number;          // Cents
  currency: string;       // e.g., "USD"
}
```

## Controls

- `↑/↓` - Navigate flights
- `Enter` - Confirm selection
- `q` or `Esc` - Cancel
