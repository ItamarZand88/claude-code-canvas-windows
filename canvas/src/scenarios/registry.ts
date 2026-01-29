import type { ScenarioDefinition } from "./types";

// Registry of all available scenarios
export const scenarios: Record<string, ScenarioDefinition> = {
  // Calendar scenarios
  "calendar:display": {
    name: "calendar:display",
    description: "View calendar events",
    canvasKind: "calendar",
    interactionMode: "view-only",
    closeOn: "escape",
    defaultConfig: {
      title: "Calendar",
      events: [],
    },
  },

  "calendar:meeting-picker": {
    name: "calendar:meeting-picker",
    description: "Pick a meeting time from available slots",
    canvasKind: "calendar",
    interactionMode: "selection",
    closeOn: "selection",
    autoCloseDelay: 500,
    defaultConfig: {
      title: "Pick a Meeting Time",
      calendars: [],
      slotGranularity: 30,
    },
  },

  // Document scenarios
  "document:display": {
    name: "document:display",
    description: "View a document",
    canvasKind: "document",
    interactionMode: "view-only",
    closeOn: "escape",
    defaultConfig: {
      content: "",
      title: "Document",
      readOnly: true,
    },
  },

  "document:edit": {
    name: "document:edit",
    description: "Edit a document with text selection",
    canvasKind: "document",
    interactionMode: "selection",
    closeOn: "command",
    defaultConfig: {
      content: "",
      title: "Edit Document",
      readOnly: false,
    },
  },

  // Flight scenarios
  "flight:booking": {
    name: "flight:booking",
    description: "Compare and select flights",
    canvasKind: "flight",
    interactionMode: "selection",
    closeOn: "selection",
    autoCloseDelay: 500,
    defaultConfig: {
      flights: [],
      title: "Flight Booking",
    },
  },
};

export function getScenario(name: string): ScenarioDefinition | undefined {
  return scenarios[name];
}

export function getScenariosByCanvas(canvasKind: string): ScenarioDefinition[] {
  return Object.values(scenarios).filter((s) => s.canvasKind === canvasKind);
}
