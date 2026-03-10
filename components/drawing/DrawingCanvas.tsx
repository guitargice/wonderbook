"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

type Point = { x: number; y: number };

type DrawingCanvasProps = {
  width?: number;
  height?: number;
  onExportChange?: (dataUrl: string | null) => void;
  initialImage?: string | null;
};

const palette = ["#111827", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];

export function DrawingCanvas({
  width = 900,
  height = 360,
  onExportChange,
  initialImage,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(8);
  const [color, setColor] = useState(palette[0]);
  const [eraser, setEraser] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const activePointerId = useRef<number | null>(null);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  };

  const pushHistory = useCallback(() => {
    const target = canvasRef.current;
    if (!target) return;
    setHistory((prev) => [...prev.slice(-20), target.toDataURL("image/png")]);
  }, []);

  const emitExport = useCallback(() => {
    const target = canvasRef.current;
    if (!target) return;
    onExportChange?.(target.toDataURL("image/png"));
  }, [onExportChange]);

  const drawPoint = (point: Point) => {
    const result = getContext();
    if (!result) return;
    const { ctx } = result;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = eraser ? "#ffffff" : color;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>, point: Point) => {
    const result = getContext();
    if (!result) return;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    result.ctx.beginPath();
    result.ctx.moveTo(point.x, point.y);
  };

  const stopDrawing = (event?: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (event && activePointerId.current !== event.pointerId) return;
    setIsDrawing(false);
    if (event) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerId.current = null;
    pushHistory();
    emitExport();
  };

  const toPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const clear = useCallback(() => {
    const result = getContext();
    if (!result) return;
    result.ctx.fillStyle = "#ffffff";
    result.ctx.fillRect(0, 0, result.canvas.width, result.canvas.height);
    onExportChange?.(null);
    pushHistory();
  }, [onExportChange, pushHistory]);

  const undo = () => {
    const previous = history.at(-2);
    if (!previous) {
      clear();
      return;
    }
    const result = getContext();
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      result.ctx.clearRect(0, 0, result.canvas.width, result.canvas.height);
      result.ctx.drawImage(img, 0, 0);
      setHistory((prev) => prev.slice(0, -1));
      emitExport();
    };
    img.src = previous;
  };

  useEffect(() => {
    const result = getContext();
    if (!result) return;
    result.ctx.fillStyle = "#ffffff";
    result.ctx.fillRect(0, 0, result.canvas.width, result.canvas.height);
    pushHistory();
  }, [pushHistory]);

  useEffect(() => {
    if (!initialImage) return;
    const result = getContext();
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      result.ctx.clearRect(0, 0, result.canvas.width, result.canvas.height);
      result.ctx.drawImage(img, 0, 0, result.canvas.width, result.canvas.height);
      pushHistory();
      emitExport();
    };
    img.src = initialImage;
  }, [emitExport, initialImage, pushHistory]);

  return (
    <div className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {palette.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              setColor(swatch);
              setEraser(false);
            }}
            className="h-10 w-10 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: swatch }}
            aria-label={`Set color ${swatch}`}
          />
        ))}
        <button
          type="button"
          onClick={() => setEraser((value) => !value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            eraser ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
          }`}
        >
          Eraser
        </button>
        <button
          type="button"
          onClick={undo}
          className="rounded-xl bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Clear
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm font-medium text-slate-600">
          Brush
          <input
            type="range"
            min={2}
            max={30}
            value={brushSize}
            onChange={(event) => setBrushSize(Number(event.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full touch-none rounded-2xl border border-indigo-100 bg-white"
        onPointerDown={(event) => startDrawing(event, toPoint(event))}
        onPointerMove={(event) => {
          if (!isDrawing) return;
          if (activePointerId.current !== event.pointerId) return;
          drawPoint(toPoint(event));
        }}
        onPointerUp={(event) => stopDrawing(event)}
        onPointerCancel={(event) => stopDrawing(event)}
        onPointerLeave={(event) => stopDrawing(event)}
      />
    </div>
  );
}
