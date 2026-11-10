export interface StreamingOptions {
  /** Called with citations (web search sources) when the stream finishes. */
  onCitations?: (citations: { title: string; url: string }[]) => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  headers?: Record<string, string>;
}

export interface StreamingState {
  isActive: boolean;
  chunks: string[];
  fullResponse: string;
  error?: Error;
}

export class StreamingClient {
  private controller: AbortController | null = null;
  private state: StreamingState = {
    isActive: false,
    chunks: [],
    fullResponse: ''
  };

  async streamAIResponse(
    endpoint: string,
    data: any,
    options: StreamingOptions = {}
  ): Promise<string> {
    this.controller = new AbortController();
    this.state = {
      isActive: true,
      chunks: [],
      fullResponse: ''
    };

    try {
      options.onStart?.();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
        body: JSON.stringify(data),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.done) {
                options.onCitations?.(parsed.citations ?? []);
              } else if (parsed.content) {
                this.state.chunks.push(parsed.content);
                this.state.fullResponse += parsed.content;
                options.onChunk?.(parsed.content);
              }
            } catch (e) {
              if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
              console.warn('Failed to parse streaming data:', data);
            }
          }
        }
      }

      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.content) {
            this.state.chunks.push(parsed.content);
            this.state.fullResponse += parsed.content;
            options.onChunk?.(parsed.content);
          }
        } catch (e) {
          console.warn('Failed to parse final buffer:', buffer);
        }
      }

      this.state.isActive = false;
      options.onComplete?.(this.state.fullResponse);

      return this.state.fullResponse;

    } catch (error) {
      this.state.isActive = false;
      this.state.error = error as Error;
      options.onError?.(error as Error);
      throw error;
    }
  }

  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.state.isActive = false;
    }
  }

  getState(): StreamingState {
    return { ...this.state };
  }

  isActive(): boolean {
    return this.state.isActive;
  }
}

// Singleton instance
export const streamingClient = new StreamingClient();