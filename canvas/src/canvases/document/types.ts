export interface DocumentConfig {
  content: string;
  title?: string;
  readOnly?: boolean;
}

export interface DocumentSelection {
  selectedText: string;
  startOffset: number;
  endOffset: number;
}
