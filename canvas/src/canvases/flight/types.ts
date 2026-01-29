export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: { code: string; city: string; };
  destination: { code: string; city: string; };
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
}

export interface FlightConfig {
  flights: Flight[];
  title?: string;
}

export interface FlightResult {
  selectedFlight: Flight;
}

export function formatPrice(cents: number, currency: string = "USD"): string {
  return `$${(cents / 100).toFixed(0)}`;
}
