import React, { useRef, useState, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const displayWidth = rect.width || 360;
      const displayHeight = Math.min(220, Math.max(160, Math.round(rect.width * 0.45)));

      // Set display size
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Set actual render resolution
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a';
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      // Only resize if empty to not erase during mid-signature, but ensure setup
      if (isEmpty) {
        updateCanvasSize();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [isEmpty]);

  const getCoordinates = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setIsEmpty(false);
    }
  };

  const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      setIsEmpty(true);
    }
  };

  const save = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || isEmpty) {
        alert("Iltimos, avval imzo chizing.");
        return;
      }

      const trimmedCanvas = trimCanvas(canvas);
      const dataUrl = trimmedCanvas.toDataURL('image/png');
      onSave(dataUrl);
    } catch (e: any) {
      console.error("Signature save error:", e);
      alert("Imzoni saqlashda xatolik yuz berdi.");
    }
  };

  const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const pixels = ctx.getImageData(0, 0, width, height);
    const l = pixels.data.length;

    let bound = {
      top: -1,
      left: -1,
      right: -1,
      bottom: -1,
    };

    let x, y;

    for (let i = 0; i < l; i += 4) {
      if (pixels.data[i + 3] !== 0) {
        x = (i / 4) % width;
        y = Math.floor((i / 4) / width);

        if (bound.top === -1) bound.top = y;
        if (bound.left === -1 || x < bound.left) bound.left = x;
        if (bound.right === -1 || x > bound.right) bound.right = x;
        if (bound.bottom === -1 || y > bound.bottom) bound.bottom = y;
      }
    }

    if (bound.top === -1) return canvas;

    const padding = 16;
    const left = Math.max(0, bound.left - padding);
    const top = Math.max(0, bound.top - padding);
    const right = Math.min(width, bound.right + padding);
    const bottom = Math.min(height, bound.bottom + padding);

    const trimmedWidth = right - left;
    const trimmedHeight = bottom - top;

    const copy = document.createElement('canvas');
    copy.width = trimmedWidth;
    copy.height = trimmedHeight;
    const copyCtx = copy.getContext('2d');
    if (copyCtx) {
      copyCtx.drawImage(canvas, left, top, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);
      return copy;
    }

    return canvas;
  };

  return (
    <div className="w-full flex flex-col font-sans">
      <div 
        ref={containerRef}
        className="w-full border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-950 mb-4 h-44 sm:h-52 relative overflow-hidden touch-none select-none shadow-inner"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 select-none px-4 text-center">
            <span className="text-sm font-semibold">Shu yerga imzo qo'ying</span>
            <span className="text-[11px] mt-0.5 opacity-80">Barmog'ingiz yoki stilus orqali chizing</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-gray-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tozalash</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Saqlash</span>
          </button>
        </div>
      </div>
    </div>
  );
}
