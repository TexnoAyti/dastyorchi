import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  X,
  Database,
  Zap,
  Clock,
  DollarSign,
  List,
  FileText,
} from "lucide-react";
import { pipelineTracker, PipelineMetrics } from "../utils/pipelineTracker";

export const PipelineObservabilityPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<PipelineMetrics>(
    pipelineTracker.getInitialMetrics(),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return pipelineTracker.subscribe((updatedMetrics) => {
      setMetrics({ ...updatedMetrics });
    });
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-4 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 text-gray-200 text-sm overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                AI Pipeline Status
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* INPUT STAGE */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-400" /> Input Stage
                </h4>
                <div className="bg-gray-800 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">PDF Received</span>
                    <span
                      className={
                        metrics.pdfInputReceived
                          ? "text-emerald-400"
                          : "text-gray-500"
                      }
                    >
                      {metrics.pdfInputReceived ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Extracted Text Length</span>
                    <span className="text-white">
                      {metrics.extractedTextLength.toLocaleString()} chars
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">OCR Fallback</span>
                    <span
                      className={
                        metrics.ocrFallbackTriggered
                          ? "text-amber-400"
                          : "text-gray-500"
                      }
                    >
                      {metrics.ocrFallbackTriggered ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHUNKING EXECUTION */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3 h-3 text-blue-400" /> Chunking
                  Execution
                </h4>
                <div className="bg-gray-800 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chunking Triggered</span>
                    <span
                      className={
                        metrics.chunkingTriggered
                          ? "text-blue-400 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {metrics.chunkingTriggered ? "YES" : "NO"}
                    </span>
                  </div>
                  {metrics.chunkingTriggered && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Chunks</span>
                        <span className="text-white">
                          {metrics.numberOfChunksCreated}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {metrics.chunkSizes.map((size, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-gray-500 pl-2 border-l border-gray-700"
                          >
                            <span>Chunk {idx + 1}</span>
                            <span className="text-gray-300">
                              {size.toLocaleString()} chars
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {metrics.extractedTextLength > 70000 &&
                    !metrics.chunkingTriggered && (
                      <div className="p-1 mt-1 bg-red-900/50 text-red-400 text-xs rounded border border-red-800/50">
                        CRITICAL BUG: Threshold exceeded but chunking was
                        bypassed!
                      </div>
                    )}
                </div>
              </div>

              {/* NETWORK / SYNTHESIS */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Network & Synthesis
                </h4>
                <div className="bg-gray-800 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total API Calls</span>
                    <span className="text-white">
                      {metrics.apiCallsCount} requests
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requests Sent</span>
                    <span className="text-white">
                      {metrics.aiRequestsSent.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Responses Received</span>
                    <span className="text-white">
                      {metrics.aiResponsesReceived.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Synthesis Time</span>
                    <span className="text-white">
                      {metrics.synthesisStartTime && metrics.synthesisEndTime
                        ? `${metrics.synthesisEndTime - metrics.synthesisStartTime}ms`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUMMARY METRICS */}
              <div className="bg-gray-800/50 p-2 rounded border border-gray-700 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500 flex items-center gap-1 mb-1">
                    <List className="w-3 h-3" /> Tokens
                  </div>
                  <div className="font-mono text-white text-sm">
                    ~{metrics.totalTokensEstimated.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" /> Latency
                  </div>
                  <div className="font-mono text-white text-sm">
                    {metrics.totalLatency}ms
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gray-900 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all"
        title="View AI Pipeline Observability"
      >
        <Activity className="w-5 h-5" />
      </button>
    </div>
  );
};
