import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";
import { errorLogger } from "../services/errorLoggingService";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log the error centrally using our logger service!
    errorLogger.log(
      "component_render_fault",
      "ReactRenderException",
      error,
      `Uncaught render exception in crash fence: ${error.message}`
    );
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    // Navigate home and reset the error state to allow clean rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Kutilmagan xatolik yuz berdi.";
      
      if (this.state.error?.message) {
        try {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            if (String(parsed.error).includes("Missing or insufficient permissions")) {
              errorMessage = "Sizda ushbu amalni bajarish uchun yetarli huquqlar mavjud emas (Ruxsat rad etildi).";
            } else {
              errorMessage = "Ma'lumotlar bazasi bilan muvozanatlash xatosi yuz berdi.";
            }
          } else {
            errorMessage = this.state.error.message;
          }
        } catch {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 to-black p-6 font-sans text-white">
          <div className="max-w-md w-full bg-slate-900/80 border border-white/10 p-8 rounded-[32px] shadow-2xl backdrop-blur-xl text-center">
            
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-3">
              Tizimda ogohlantirish
            </h1>
            
            <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
              {errorMessage}
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 text-white font-semibold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Qayta urinish
              </button>
              
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                <Home className="w-4 h-4 text-slate-400" />
                Bosh sahifaga o'tish
              </button>
              
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-medium rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Ilovani yangilash
              </button>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div className="mt-8 text-left bg-black/50 p-4 rounded-xl border border-white/5 overflow-auto text-[10px] font-mono text-amber-300 max-h-[160px] glass-scrollbar">
                <span className="font-bold">Developer Stacktrace:</span>
                <p className="whitespace-pre mt-1">{this.state.error.stack}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
