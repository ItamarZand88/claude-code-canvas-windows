import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import type { DocumentConfig } from "./document/types";
import type { ControllerMessage } from "../ipc/types";

interface Props {
  id: string;
  config?: DocumentConfig;
  socketPath?: string;
  scenario?: string;
}

export function Document({ id, config, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const [scrollOffset, setScrollOffset] = useState(0);

  // Use state for content and title to support live updates
  const [content, setContent] = useState(config?.content || "# No content");
  const [title, setTitle] = useState(config?.title || "Document");
  const [readOnly, setReadOnly] = useState(config?.readOnly !== false);
  const [connected, setConnected] = useState(false);

  // Track if we should auto-scroll to bottom on updates
  const autoScrollRef = useRef(false);

  const lines = content.split("\n");
  // Dynamic viewport: show all content if small, otherwise cap at 20 lines
  const maxViewportHeight = 20;
  const minViewportHeight = 5;
  // Add 1 line padding for better appearance when content exactly fits
  const viewportHeight = Math.min(maxViewportHeight, Math.max(minViewportHeight, lines.length + 1));
  const maxScroll = Math.max(0, lines.length - viewportHeight);

  // Connect to IPC for live updates when socketPath is provided
  useEffect(() => {
    if (!socketPath) return;

    let client: { send: (msg: unknown) => void; close: () => void } | null = null;
    let mounted = true;

    async function connect() {
      try {
        const { connectWithRetry } = await import("../ipc");

        if (!mounted) return;

        client = await connectWithRetry({
          socketPath,
          onMessage(msg: ControllerMessage) {
            if (!mounted) return;

            switch (msg.type) {
              case "update":
                // Handle live content updates
                const updateConfig = msg.config as DocumentConfig;
                if (updateConfig.content !== undefined) {
                  setContent(updateConfig.content);
                  // Auto-scroll to bottom if we were already at the bottom
                  if (autoScrollRef.current) {
                    const newLines = updateConfig.content.split("\n");
                    const newMaxScroll = Math.max(0, newLines.length - viewportHeight);
                    setScrollOffset(newMaxScroll);
                  }
                }
                if (updateConfig.title !== undefined) {
                  setTitle(updateConfig.title);
                }
                if (updateConfig.readOnly !== undefined) {
                  setReadOnly(updateConfig.readOnly);
                }
                break;

              case "close":
                exit();
                break;
            }
          },
          onDisconnect() {
            if (mounted) {
              setConnected(false);
            }
          },
          onError(error) {
            // Silently handle errors - the canvas can still display static content
          },
        });

        if (mounted && client) {
          setConnected(true);
          // Notify controller that we're ready
          client.send({ type: "ready", scenario });
        }
      } catch (e) {
        // Failed to connect - canvas will show static content
      }
    }

    connect();

    return () => {
      mounted = false;
      client?.close();
    };
  }, [socketPath, scenario, exit]);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    } else if (key.upArrow) {
      setScrollOffset(o => Math.max(0, o - 1));
      autoScrollRef.current = false;
    } else if (key.downArrow) {
      setScrollOffset(o => {
        const newOffset = Math.min(maxScroll, o + 1);
        // Track if we're at the bottom
        autoScrollRef.current = newOffset >= maxScroll;
        return newOffset;
      });
    } else if (key.pageUp) {
      setScrollOffset(o => Math.max(0, o - viewportHeight));
      autoScrollRef.current = false;
    } else if (key.pageDown) {
      setScrollOffset(o => {
        const newOffset = Math.min(maxScroll, o + viewportHeight);
        autoScrollRef.current = newOffset >= maxScroll;
        return newOffset;
      });
    } else if (input === "g") {
      // Go to top
      setScrollOffset(0);
      autoScrollRef.current = false;
    } else if (input === "G") {
      // Go to bottom
      setScrollOffset(maxScroll);
      autoScrollRef.current = true;
    }
  });

  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewportHeight);

  // Render a line with basic markdown highlighting
  function renderLine(line: string, idx: number) {
    // Headers
    if (line.startsWith("### ")) {
      return <Text bold color="cyan">{line}</Text>;
    }
    if (line.startsWith("## ")) {
      return <Text bold color="cyan">{line}</Text>;
    }
    if (line.startsWith("# ")) {
      return <Text bold color="cyan">{line}</Text>;
    }
    // Code blocks
    if (line.startsWith("```")) {
      return <Text color="gray">{line}</Text>;
    }
    // Inline code (backticks)
    if (line.includes("`") && !line.startsWith("```")) {
      return <Text color="yellow">{line}</Text>;
    }
    // List items
    if (line.match(/^[\s]*[-*]\s/)) {
      // Check for italic list items
      if (line.match(/^\*[^*]+\*$/)) {
        return <Text italic color="gray">{line.replace(/\*/g, "")}</Text>;
      }
      return <Text color="white">{line}</Text>;
    }
    // Numbered list items
    if (line.match(/^[\s]*\d+\.\s/)) {
      return <Text color="white">{line}</Text>;
    }
    // Italic text (single asterisks)
    if (line.match(/^\*[^*]+\*$/)) {
      return <Text italic color="gray">{line.replace(/\*/g, "")}</Text>;
    }
    // Bold text (simple pattern)
    if (line.includes("**")) {
      return <Text bold>{line.replace(/\*\*/g, "")}</Text>;
    }
    // Table borders
    if (line.includes("|") && line.includes("-")) {
      return <Text color="gray">{line}</Text>;
    }
    // Regular text
    return <Text>{line}</Text>;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">{title}</Text>
        {socketPath && (
          <Text color={connected ? "green" : "yellow"}>
            {connected ? " [live]" : " [connecting...]"}
          </Text>
        )}
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
        {visibleLines.map((line, idx) => (
          <Text key={scrollOffset + idx}>
            {renderLine(line, scrollOffset + idx)}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          {readOnly ? "↑↓ scroll • g/G top/bottom • " : "↑↓ scroll • type to edit • "}
          q quit • {scrollOffset + 1}-{Math.min(scrollOffset + viewportHeight, lines.length)}/{lines.length}
        </Text>
      </Box>
    </Box>
  );
}
