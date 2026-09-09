export interface PipelineMetrics {
  pdfInputReceived: boolean;
  extractedTextLength: number;
  ocrFallbackTriggered: boolean;
  chunkingTriggered: boolean;
  numberOfChunksCreated: number;
  chunkSizes: number[];
  aiRequestsSent: { index: number; payloadSize: number }[];
  aiResponsesReceived: { index: number; status: string; latency: number }[];
  synthesisStartTime: number;
  synthesisEndTime: number;
  totalTokensEstimated: number;
  apiCallsCount: number;
  totalLatency: number;
  costEstimation: number;
}

class PipelineTracker {
  metrics: PipelineMetrics = this.getInitialMetrics();
  listeners: ((metrics: PipelineMetrics) => void)[] = [];

  getInitialMetrics(): PipelineMetrics {
    return {
      pdfInputReceived: false,
      extractedTextLength: 0,
      ocrFallbackTriggered: false,
      chunkingTriggered: false,
      numberOfChunksCreated: 0,
      chunkSizes: [],
      aiRequestsSent: [],
      aiResponsesReceived: [],
      synthesisStartTime: 0,
      synthesisEndTime: 0,
      totalTokensEstimated: 0,
      apiCallsCount: 0,
      totalLatency: 0,
      costEstimation: 0,
    };
  }

  reset() {
    this.metrics = this.getInitialMetrics();
    this.notify();
  }

  update(updates: Partial<PipelineMetrics>) {
    this.metrics = { ...this.metrics, ...updates };
    this.notify();
  }

  log(category: string, title: string, data?: any) {
    console.log(`[PIPELINE - ${category}] ${title}`, data !== undefined ? data : '');
  }
  
  error(functionName: string, filePath: string, lineNumber: number, reason: string) {
    console.error(`[PIPELINE ERROR] Failed at ${functionName} (${filePath}:${lineNumber}). Reason: ${reason}`);
  }

  subscribe(listener: (metrics: PipelineMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.metrics));
  }
}

export const pipelineTracker = new PipelineTracker();
