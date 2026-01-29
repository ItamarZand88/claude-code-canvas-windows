import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
}

export interface CalendarConfig {
  title?: string;
  events?: CalendarEvent[];
}

// Example events for demo purposes
function getExampleEvents(): CalendarEvent[] {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return [
    {
      id: "1",
      title: "Morning Standup",
      startTime: `${today}T09:00:00`,
      endTime: `${today}T09:30:00`,
      color: "cyan",
    },
    {
      id: "2",
      title: "Project Planning",
      startTime: `${today}T10:00:00`,
      endTime: `${today}T11:30:00`,
      color: "blue",
    },
    {
      id: "3",
      title: "Lunch Break",
      startTime: `${today}T12:00:00`,
      endTime: `${today}T13:00:00`,
      color: "green",
    },
    {
      id: "4",
      title: "Code Review",
      startTime: `${today}T14:00:00`,
      endTime: `${today}T15:30:00`,
      color: "magenta",
    },
    {
      id: "5",
      title: "1:1 with Manager",
      startTime: `${today}T16:00:00`,
      endTime: `${today}T16:30:00`,
      color: "yellow",
    },
    {
      id: "6",
      title: "Team Retrospective",
      startTime: `${tomorrow}T10:00:00`,
      endTime: `${tomorrow}T11:00:00`,
      color: "cyan",
    },
    {
      id: "7",
      title: "Client Demo",
      startTime: `${tomorrow}T14:00:00`,
      endTime: `${tomorrow}T15:00:00`,
      color: "red",
    },
    {
      id: "8",
      title: "Friday Wrap-up",
      startTime: `${dayAfter}T17:00:00`,
      endTime: `${dayAfter}T17:30:00`,
      color: "green",
    },
  ];
}

interface Props {
  id: string;
  config?: CalendarConfig;
  socketPath?: string;
  scenario?: string;
}

export function Calendar({ id, config, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const [currentWeek, setCurrentWeek] = useState(0);

  const title = config?.title || "My Calendar";
  // Use example events if none provided
  const events = config?.events && config.events.length > 0 ? config.events : getExampleEvents();

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    } else if (key.rightArrow || input === "n") {
      setCurrentWeek(w => w + 1);
    } else if (key.leftArrow || input === "p") {
      setCurrentWeek(w => Math.max(0, w - 1));
    } else if (input === "t") {
      setCurrentWeek(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">{title} - Week {currentWeek}</Text>
      </Box>
      
      <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
        {events.length === 0 ? (
          <Text color="gray">No events scheduled</Text>
        ) : (
          events.map((event) => (
            <Box key={event.id} marginBottom={1}>
              <Text color={event.color || "blue"}>{event.title}</Text>
              <Text color="gray"> - {new Date(event.startTime).toLocaleTimeString()}</Text>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">{"←/→ navigate • t today • q quit"}</Text>
      </Box>
    </Box>
  );
}
