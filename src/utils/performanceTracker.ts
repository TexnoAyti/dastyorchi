class PerformanceTracker {
  private renderCounts: Record<string, number> = {};
  private firestoreReads: Record<string, number> = {};
  private firestoreReadTotal = 0;
  private activeListeners: Set<string> = new Set();
  private maxActiveListeners = 0;
  private apiRequests: Record<string, number> = {};
  private apiRequestTotal = 0;
  private initStartTime = 0;
  private initDuration = 0;

  constructor() {
    if (typeof window !== "undefined") {
      (window as any).__performanceTracker = this;
    }
  }

  trackRender(componentName: string) {
    this.renderCounts[componentName] = (this.renderCounts[componentName] || 0) + 1;
    this.logDebounced();
  }

  trackFirestoreRead(path: string, count = 1) {
    this.firestoreReads[path] = (this.firestoreReads[path] || 0) + count;
    this.firestoreReadTotal += count;
    this.logDebounced();
  }

  trackListenerActive(name: string) {
    this.activeListeners.add(name);
    if (this.activeListeners.size > this.maxActiveListeners) {
      this.maxActiveListeners = this.activeListeners.size;
    }
    this.logDebounced();
  }

  trackListenerInactive(name: string) {
    this.activeListeners.delete(name);
    this.logDebounced();
  }

  trackApiCall(name: string) {
    this.apiRequests[name] = (this.apiRequests[name] || 0) + 1;
    this.apiRequestTotal += 1;
    this.logDebounced();
  }

  startChatInit() {
    this.initStartTime = performance.now();
    console.log("⏱️ Performance audit: Chat initialization started...");
  }

  endChatInit() {
    if (this.initStartTime) {
      this.initDuration = performance.now() - this.initStartTime;
      console.log(`⏱️ Performance audit: Chat initialization completed in ${this.initDuration.toFixed(2)}ms`);
      this.logDebounced();
    }
  }

  getStats() {
    return {
      renderCounts: { ...this.renderCounts },
      firestoreReads: { ...this.firestoreReads },
      firestoreReadTotal: this.firestoreReadTotal,
      activeListenersCount: this.activeListeners.size,
      activeListenersList: Array.from(this.activeListeners),
      maxActiveListeners: this.maxActiveListeners,
      apiRequests: { ...this.apiRequests },
      apiRequestTotal: this.apiRequestTotal,
      chatInitDurationMs: this.initDuration
    };
  }

  private logTimeout: any = null;
  private logDebounced() {
    if (this.logTimeout) clearTimeout(this.logTimeout);
    this.logTimeout = setTimeout(() => {
      console.groupCollapsed("⚖️ YURIDIK TIZIM PERFORMANCE PROFILE");
      console.log("Component Renders:", JSON.stringify(this.renderCounts, null, 2));
      console.log(`Firestore Reads Total: ${this.firestoreReadTotal}`, JSON.stringify(this.firestoreReads, null, 2));
      console.log(`Active App Listeners (${this.activeListeners.size}):`, Array.from(this.activeListeners));
      console.log(`Peak App Listeners: ${this.maxActiveListeners}`);
      console.log(`API/AI Requests Total: ${this.apiRequestTotal}`, JSON.stringify(this.apiRequests, null, 2));
      console.log(`Chat Initialization Duration: ${this.initDuration.toFixed(2)}ms`);
      console.groupEnd();
    }, 1500);
  }
}

export const performanceTracker = new PerformanceTracker();
