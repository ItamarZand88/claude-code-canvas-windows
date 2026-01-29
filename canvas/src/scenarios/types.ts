export type InteractionMode = "view-only" | "selection" | "multi-select";
export type CloseOn = "selection" | "escape" | "command" | "never";

export interface ScenarioDefinition<TConfig = unknown, TResult = unknown> {
  name: string;
  description: string;
  canvasKind: string;
  interactionMode: InteractionMode;
  closeOn: CloseOn;
  autoCloseDelay?: number;
  defaultConfig: Partial<TConfig>;
}
