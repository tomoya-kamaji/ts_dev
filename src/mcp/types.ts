export type Tool = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
};

export type ToolCall = {
  name: string;
  arguments: Record<string, any>;
};

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: ToolCall[];
};

export type MCPRequest = {
  messages: Message[];
  tools?: Tool[];
};

export type MCPResponse = {
  messages: Message[];
};
