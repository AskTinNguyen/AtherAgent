import { AssistantContent, Message, ToolContent } from 'ai';
import { ChatChartMessage } from './types.visualization';

export enum StreamMessageType {
  TEXT = '0',
  DATA = '2',
  ERROR = '3',
  TOOL_CALL = '9',
  TOOL_RESULT = 'a',
  TOOL_CALL_START = 'b',
  TOOL_CALL_DELTA = 'c',
  FINISH = 'd'
}

export enum StreamState {
  IDLE = 'idle',
  STREAMING = 'streaming',
  TOOL_CALLING = 'tool_calling',
  ERROR = 'error',
  FINISHED = 'finished'
}

export interface StreamError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BaseStreamConfig {
  messages: Message[]
  model: string
  chatId: string
  searchMode: boolean
}

export interface StreamUsage {
  promptTokens: number
  completionTokens: number
}

export interface ChartDataResult {
  content: AssistantContent | ToolContent
  chartData?: ChatChartMessage
}

export interface StreamFinishEvent {
  readonly steps: Array<{
    response?: {
      messages?: Message[]
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        promptTokens?: number
        completionTokens?: number
      }
    }
  }>
}

// Shared type for usage data extraction
export interface ExtractedUsage {
  promptTokens: number
  completionTokens: number
}
// Message processor result type that matches both our system and AI SDK
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolChoice {
  type: 'function';
  function?: {
    name: string;
  };
}

export interface TransformConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface MessageProcessorResult {
  messages: Message[];
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
  maxSteps?: number;
  experimental_transform?: TransformConfig;
  model?: string;
}

export interface StreamEvent {
  type: StreamMessageType;
  payload: unknown;
  timestamp: number;
}

export interface StreamEventHandler {
  onStateChange?: (state: StreamState) => void;
  onError?: (error: StreamError) => void;
  onToolCall?: (toolCall: ToolCallInfo) => void;
  onToolResult?: (result: ToolCallResult) => void;
  onFinish?: (usage: UsageInfo) => void;
}

export interface RetryConfig {
  maxRetries: number;
  backoffFactor: number;
  initialDelay: number;
}

export interface ToolCallInfo {
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

export interface ToolCallResult {
  toolCallId: string;
  result: unknown;
}

export interface UsageInfo {
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Type guard to check if a message has an ID
export function hasMessageId(message: unknown): message is Message {
  return typeof message === 'object' && message !== null && 'id' in message;
}

// Helper to convert between message types
export function convertMessageTypes(messages: Message[]): Message[] {
  return messages.map(msg => {
    const { id, ...rest } = msg;
    return rest as Message;
  });
} 