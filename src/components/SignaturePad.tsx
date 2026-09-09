import { useRef, useState, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas size and default pen rendering config
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Size canvas internally to match its CSS bounded width/height
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = rect.height || 180;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
    }
  }, []);

  const getCoordinates = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  };

  const save = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || isEmpty) {
        alert("Iltimos, imzo cheking.");
        return;
      }

      // Crop non-painted margins around the drawn signature
      const trimmedCanvas = getTrimmedCanvas(canvas);
      const dataUrl = trimmedCanvas.toDataURL('image/png');
      
      console.log("Signature captured");
      onSave(dataUrl);
    } catch (error: any) {
      console.error("Signature capture failed:", error);
      alert(`Signature capture failed. Error details: ${error.message || error}`);
    }
  };

  // Helper method to crop unused bounding areas from signature canvas rendering
  const getTrimmedCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let top = height;
    let bottom = 0;
    let left = width;
    let right = 0;
    let hasContent = false;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3]; // alpha element
        if (alpha > 0) {
          hasContent = true;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    
    if (!hasContent) {
      return canvas;
    }
    
    // Add minor padding to make sure edges are cut cleanly
    const padding = 12;
    left = Math.max(0, left - padding);
    top = Math.max(0, top - padding);
    right = Math.min(width, right + padding);
    bottom = Math.min(height, bottom + padding);
    
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
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl w-full max-w-md mx-auto border border-gray-200 dark:border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-zinc-100">Elektron Imzo</h3>
      <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-100 mb-4 h-48 relative overflow-hidden touch-none">
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
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 dark:text-gray-500 select-none text-sm font-medium">
            Shu yerga imzo qo'ying
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button 
          onClick={clear}
          className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700 font-medium"
        >
          Tozalash
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
          >
            Bekor qilish
          </button>
          <button 
            onClick={save}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
