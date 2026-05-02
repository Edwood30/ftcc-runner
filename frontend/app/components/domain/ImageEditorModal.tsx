import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "../ui/Button";

interface ImageEditorModalProps {
  file: File;
  initialDataURL?: string;
  onSave: (dataURL: string) => void;
  onClose: () => void;
}

type Tool = "brush" | "eraser" | "zoom" | "pan" | "crop";
type ActivePanel = "blur" | "adjust" | "crop" | null;

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}

interface CropRect {
  x: number; y: number; w: number; h: number;
  dragging: boolean;
  handle: string | null;
  startX: number; startY: number;
}

const HANDLE_SIZE = 10;

export function ImageEditorModal({ file, initialDataURL, onSave, onClose }: ImageEditorModalProps) {
  const canvasRef      = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef  = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef   = useRef<HTMLDivElement | null>(null);
  const brushCursorRef = useRef<HTMLDivElement | null>(null);

  const [sourceDataURL, setSourceDataURL] = useState<string>(() => initialDataURL ?? "");
  const [blurStrength, setBlurStrength]   = useState(10);
  const [brushSize, setBrushSize]         = useState(40);
  const [tool, setTool]                   = useState<Tool>("brush");
  const [activePanel, setActivePanel]     = useState<ActivePanel>("blur");
  const [isPainting, setIsPainting]       = useState(false);
  const [hasMask, setHasMask]             = useState(false);
  const [zoom, setZoom]                   = useState(1);
  const [pan, setPan]                     = useState({ x: 0, y: 0 });
  const [adjustments, setAdjustments]     = useState<Adjustments>({
    brightness: 100, contrast: 100, saturation: 100, sharpness: 0,
  });
  const [cropRect, setCropRect]           = useState<CropRect | null>(null);
  const [isCropping, setIsCropping]       = useState(false);
  const [cursorPos, setCursorPos]         = useState({ x: -999, y: -999 });
  const [showCursor, setShowCursor]       = useState(false);
  const [history, setHistory]             = useState<string[]>([]);
  const [flipped, setFlipped]             = useState({ h: false, v: false });

  const lastPos      = useRef<{ x: number; y: number } | null>(null);
  const panStart     = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const cropStart    = useRef<{ x: number; y: number } | null>(null);

  // ── Load file ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialDataURL) return;
    const reader = new FileReader();
    reader.onload = () => setSourceDataURL(reader.result as string);
    reader.readAsDataURL(file);
  }, [file, initialDataURL]);

  // ── Draw image with adjustments ────────────────────────────────────────────
  const drawImage = useCallback((dataURL: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !dataURL) return;
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      if (flipped.h || flipped.v) {
        ctx.translate(flipped.h ? img.width : 0, flipped.v ? img.height : 0);
        ctx.scale(flipped.h ? -1 : 1, flipped.v ? -1 : 1);
      }
      ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      [maskCanvasRef, overlayCanvasRef].forEach((r) => {
        if (r.current) {
          r.current.width  = img.width;
          r.current.height = img.height;
          r.current.getContext("2d")?.clearRect(0, 0, img.width, img.height);
        }
      });
      setHasMask(false);
    };
    img.src = dataURL;
  }, [adjustments, flipped]);

  useEffect(() => { drawImage(sourceDataURL); }, [sourceDataURL, drawImage]);

  // ── History ────────────────────────────────────────────────────────────────
  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory((h) => [...h.slice(-19), canvas.toDataURL("image/png")]);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setSourceDataURL(prev);
  };

  // ── Rotate ─────────────────────────────────────────────────────────────────
  const rotate = (clockwise: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushHistory();
    const next = document.createElement("canvas");
    next.width  = canvas.height;
    next.height = canvas.width;
    const ctx = next.getContext("2d")!;
    ctx.translate(next.width / 2, next.height / 2);
    ctx.rotate((clockwise ? 90 : -90) * (Math.PI / 180));
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    setSourceDataURL(next.toDataURL("image/png"));
  };

  // ── Flip ───────────────────────────────────────────────────────────────────
  const flip = (axis: "h" | "v") => {
    pushHistory();
    setFlipped((f) => ({ ...f, [axis]: !f[axis] }));
  };

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.2, z - e.deltaY * 0.001)));
  };

  const zoomIn  = () => setZoom((z) => Math.min(5, parseFloat((z + 0.2).toFixed(1))));
  const zoomOut = () => setZoom((z) => Math.max(0.2, parseFloat((z - 0.2).toFixed(1))));
  const zoomFit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ── Pan ────────────────────────────────────────────────────────────────────
  const startPan = (e: React.MouseEvent) => {
    if (tool !== "pan") return;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const doPan = (e: React.MouseEvent) => {
    if (tool !== "pan" || !panStart.current) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const stopPan = () => { panStart.current = null; };

  // ── Brush cursor ───────────────────────────────────────────────────────────
  const updateCursor = (e: React.MouseEvent) => {
    if (tool !== "brush" && tool !== "eraser") return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShowCursor(true);
  };

  // ── Brush helpers ──────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const drawDots = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number } | null,
    to: { x: number; y: number },
    radius: number
  ) => {
    ctx.beginPath();
    if (from) {
      const dx = to.x - from.x, dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / (radius / 4)));
      for (let i = 0; i <= steps; i++) {
        ctx.arc(from.x + dx * i / steps, from.y + dy * i / steps, radius, 0, Math.PI * 2);
      }
    } else {
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  };

  const paint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPainting || (tool !== "brush" && tool !== "eraser")) return;
    const overlay = overlayCanvasRef.current;
    const mask    = maskCanvasRef.current;
    if (!overlay || !mask) return;
    const ovCtx   = overlay.getContext("2d")!;
    const maskCtx = mask.getContext("2d")!;
    const pos     = getPos(e, overlay);
    const radius  = brushSize / 2;
    const isBrush = tool === "brush";

    ovCtx.globalCompositeOperation   = isBrush ? "source-over" : "destination-out";
    ovCtx.fillStyle = "rgba(56,189,248,0.4)";
    drawDots(ovCtx, lastPos.current, pos, radius);

    maskCtx.globalCompositeOperation = isBrush ? "source-over" : "destination-out";
    maskCtx.fillStyle = "white";
    drawDots(maskCtx, lastPos.current, pos, radius);

    lastPos.current = pos;
    setHasMask(true);
    if ("touches" in e) {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCursorPos({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top });
      }
    }
  }, [isPainting, tool, brushSize]);

  const startPaint = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool !== "brush" && tool !== "eraser") return;
    e.preventDefault();
    setIsPainting(true);
    lastPos.current = null;
    paint(e);
  };

  const stopPaint = () => { setIsPainting(false); lastPos.current = null; };

  const clearMask = () => {
    [maskCanvasRef, overlayCanvasRef].forEach((r) => {
      const c = r.current;
      if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    });
    setHasMask(false);
  };

  // ── Apply selective blur ───────────────────────────────────────────────────
  const applyBlur = () => {
    const base    = canvasRef.current;
    const mask    = maskCanvasRef.current;
    if (!base || !mask) return;
    pushHistory();
    const { width, height } = base;
    const baseCtx = base.getContext("2d")!;
    const maskCtx = mask.getContext("2d")!;

    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = width; blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext("2d")!;
    blurCtx.filter = `blur(${blurStrength}px)`;
    blurCtx.drawImage(base, 0, 0);
    blurCtx.filter = "none";

    const orig   = baseCtx.getImageData(0, 0, width, height);
    const blrd   = blurCtx.getImageData(0, 0, width, height);
    const msk    = maskCtx.getImageData(0, 0, width, height);
    const result = baseCtx.createImageData(width, height);

    for (let i = 0; i < result.data.length; i += 4) {
      const a = msk.data[i + 3] / 255;
      result.data[i]     = orig.data[i]     * (1 - a) + blrd.data[i]     * a;
      result.data[i + 1] = orig.data[i + 1] * (1 - a) + blrd.data[i + 1] * a;
      result.data[i + 2] = orig.data[i + 2] * (1 - a) + blrd.data[i + 2] * a;
      result.data[i + 3] = 255;
    }
    baseCtx.putImageData(result, 0, 0);
    clearMask();
  };

  // ── Apply adjustments permanently ─────────────────────────────────────────
  const applyAdjustments = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushHistory();
    const next = document.createElement("canvas");
    next.width = canvas.width; next.height = canvas.height;
    const ctx = next.getContext("2d")!;
    ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";
    setSourceDataURL(next.toDataURL("image/png"));
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, sharpness: 0 });
  };

  // ── Crop ───────────────────────────────────────────────────────────────────
  const startCrop = (e: React.MouseEvent) => {
    if (tool !== "crop") return;
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const pos = getPos(e, overlay);
    cropStart.current = pos;
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0, dragging: false, handle: null, startX: 0, startY: 0 });
    setIsCropping(true);
  };

  const doCrop = (e: React.MouseEvent) => {
    if (!isCropping || !cropStart.current) return;
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const pos = getPos(e, overlay);
    const x   = Math.min(pos.x, cropStart.current.x);
    const y   = Math.min(pos.y, cropStart.current.y);
    const w   = Math.abs(pos.x - cropStart.current.x);
    const h   = Math.abs(pos.y - cropStart.current.y);
    setCropRect((r) => r ? { ...r, x, y, w, h } : null);

    // Draw crop overlay
    const overlay2 = overlayCanvasRef.current;
    const ctx = overlay2?.getContext("2d");
    if (!ctx || !overlay2) return;
    ctx.clearRect(0, 0, overlay2.width, overlay2.height);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, overlay2.width, overlay2.height);
    ctx.clearRect(x, y, w, h);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Rule-of-thirds
    ctx.strokeStyle = "rgba(56,189,248,0.3)";
    ctx.lineWidth = 1 / zoom;
    [1/3, 2/3].forEach((t) => {
      ctx.beginPath(); ctx.moveTo(x + w * t, y); ctx.lineTo(x + w * t, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h * t); ctx.lineTo(x + w, y + h * t); ctx.stroke();
    });
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropRect || cropRect.w < 4 || cropRect.h < 4) return;
    pushHistory();
    const next = document.createElement("canvas");
    next.width  = Math.round(cropRect.w);
    next.height = Math.round(cropRect.h);
    const ctx   = next.getContext("2d")!;
    ctx.drawImage(canvas, Math.round(cropRect.x), Math.round(cropRect.y), Math.round(cropRect.w), Math.round(cropRect.h), 0, 0, next.width, next.height);
    setSourceDataURL(next.toDataURL("image/png"));
    setCropRect(null);
    setIsCropping(false);
    overlayCanvasRef.current?.getContext("2d")?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    setTool("brush");
  };

  const cancelCrop = () => {
    setCropRect(null);
    setIsCropping(false);
    overlayCanvasRef.current?.getContext("2d")?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
  };

  // ── Cursor style ───────────────────────────────────────────────────────────
  const getCursor = () => {
    if (tool === "pan") return "grab";
    if (tool === "zoom") return "zoom-in";
    if (tool === "crop") return "crosshair";
    return "none"; // brush/eraser uses custom div cursor
  };

  const save = () => {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL("image/jpeg", 0.95));
    onClose();
  };

  // ── Tool definitions ───────────────────────────────────────────────────────
  const tools: { id: Tool; label: string; icon: React.ReactNode; panel?: ActivePanel }[] = [
    { id: "brush",  label: "Brush",  panel: "blur", icon: <IconBrush /> },
    { id: "eraser", label: "Eraser", panel: "blur", icon: <IconEraser /> },
    { id: "crop",   label: "Crop",   panel: "crop", icon: <IconCrop /> },
    { id: "zoom",   label: "Zoom",   panel: null,   icon: <IconZoom /> },
    { id: "pan",    label: "Pan",    panel: null,   icon: <IconPan /> },
  ];

  const handleToolClick = (t: typeof tools[number]) => {
    setTool(t.id);
    if (t.panel !== undefined) setActivePanel(t.panel);
    if (t.id === "zoom") { zoomIn(); }
    if (t.id !== "crop") { cancelCrop(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-[#0d1117]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      onClick={onClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .tool-btn { display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px;border-radius:8px;border:1px solid transparent;cursor:pointer;font-size:10px;font-weight:500;color:#64748b;background:transparent;transition:all 0.15s;min-width:52px; }
        .tool-btn:hover { background:#1e293b;color:#94a3b8;border-color:#334155; }
        .tool-btn.active { background:#1e3a5f;color:#38bdf8;border-color:#1d4ed8; }
        .panel-slider { width:100%;accent-color:#38bdf8;height:4px; }
        .panel-btn { padding:5px 12px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;font-size:12px;cursor:pointer;transition:all 0.15s; }
        .panel-btn:hover { border-color:#38bdf8;color:#e2e8f0; }
        .panel-btn.active { background:#1e3a5f;border-color:#38bdf8;color:#38bdf8; }
        .panel-btn:disabled { opacity:0.35;cursor:not-allowed; }
        .sep { width:1px;height:20px;background:#1e293b;margin:0 2px; }
        .badge { padding:1px 6px;border-radius:4px;background:#1e293b;color:#64748b;font-size:10px;font-weight:600;letter-spacing:0.04em; }
      `}</style>

      <div className="flex w-full h-full" onClick={(e) => e.stopPropagation()}>

        {/* ── Left toolbar ──────────────────────────────────────────────── */}
        <aside className="flex flex-col items-center gap-1 border-r border-[#1e293b] bg-[#0f172a] px-2 py-4 w-[72px] shrink-0">
          <span className="text-[10px] font-600 text-[#334155] uppercase tracking-widest mb-2">Tools</span>
          {tools.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? "active" : ""}`}
              onClick={() => handleToolClick(t)}
              title={t.label}
            >
              {t.icon}
              {t.label}
            </button>
          ))}

          <div className="mt-auto flex flex-col gap-1 w-full">
            <div className="sep w-full h-px mx-0 my-2" style={{ width: "100%", height: 1, background: "#1e293b" }} />
            <button className="tool-btn" onClick={undo} disabled={!history.length} title="Undo">
              <IconUndo /> Undo
            </button>
          </div>
        </aside>

        {/* ── Canvas area ───────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex items-center gap-2 border-b border-[#1e293b] bg-[#0f172a] px-4 py-2 shrink-0">
            <span className="text-xs font-500 text-[#475569] truncate max-w-[180px]">{file.name}</span>
            <div className="sep" />
            {/* Zoom controls */}
            <button className="panel-btn" onClick={zoomOut} title="Zoom out">−</button>
            <span className="badge">{Math.round(zoom * 100)}%</span>
            <button className="panel-btn" onClick={zoomIn} title="Zoom in">+</button>
            <button className="panel-btn" onClick={zoomFit} title="Fit to screen">Fit</button>

            <div className="sep" />
            <button className="panel-btn" onClick={() => rotate(false)} title="Rotate left">↺ Left</button>
            <button className="panel-btn" onClick={() => rotate(true)}  title="Rotate right">↻ Right</button>
            <button className="panel-btn" onClick={() => flip("h")}     title="Flip horizontal">⇌ H</button>
            <button className="panel-btn" onClick={() => flip("v")}     title="Flip vertical">⇅ V</button>

            <div className="ml-auto flex items-center gap-2">
              <button className="panel-btn" onClick={undo} disabled={!history.length}>↩ Undo</button>
              <button
                onClick={save}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-[#334155] text-[#64748b] hover:text-[#94a3b8] text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Canvas viewport */}
          <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden bg-[#080c10]"
            style={{
              backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              cursor: getCursor(),
            }}
            onWheel={handleWheel}
            onMouseMove={(e) => { doPan(e); updateCursor(e); if (isCropping) doCrop(e); paint(e as any); }}
            onMouseDown={(e) => { startPan(e); startCrop(e); }}
            onMouseUp={() => { stopPan(); if (isCropping) setIsCropping(false); stopPaint(); }}
            onMouseLeave={() => { setShowCursor(false); stopPaint(); stopPan(); }}
          >
            {/* Transform wrapper */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
            >
              <div
                className="relative shadow-2xl"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  transition: "transform 0.05s",
                }}
              >
                {/* Checkerboard for transparency */}
                <div className="absolute inset-0 rounded-sm" style={{
                  backgroundImage: "linear-gradient(45deg,#1e293b 25%,transparent 25%),linear-gradient(-45deg,#1e293b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1e293b 75%),linear-gradient(-45deg,transparent 75%,#1e293b 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                }} />
                <canvas ref={canvasRef} className="relative block max-w-none" />
                <canvas ref={maskCanvasRef} className="pointer-events-none absolute inset-0 opacity-0" />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0"
                  style={{ touchAction: "none" }}
                  onMouseDown={startPaint}
                  onMouseMove={paint as any}
                  onMouseUp={stopPaint}
                  onTouchStart={startPaint}
                  onTouchMove={paint as any}
                  onTouchEnd={stopPaint}
                />
              </div>
            </div>

            {/* Custom brush cursor */}
            {showCursor && (tool === "brush" || tool === "eraser") && (
              <div
                ref={brushCursorRef}
                className="pointer-events-none absolute border-2 rounded-full"
                style={{
                  left: cursorPos.x - (brushSize * zoom) / 2,
                  top:  cursorPos.y - (brushSize * zoom) / 2,
                  width:  brushSize * zoom,
                  height: brushSize * zoom,
                  borderColor: tool === "eraser" ? "#f87171" : "#38bdf8",
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.3)`,
                  transition: "width 0.05s, height 0.05s, border-color 0.15s",
                }}
              />
            )}

            {/* Crop confirm bar */}
            {cropRect && cropRect.w > 4 && !isCropping && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 shadow-xl">
                <button className="panel-btn active" onClick={applyCrop}>✓ Apply Crop</button>
                <button className="panel-btn" onClick={cancelCrop}>✕ Cancel</button>
              </div>
            )}

            {/* No-mask hint */}
            {!hasMask && (tool === "brush" || tool === "eraser") && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs text-[#94a3b8] whitespace-nowrap select-none">
                Paint over an area · then click Apply Blur
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ───────────────────────────────────────────────── */}
        <aside className="flex flex-col border-l border-[#1e293b] bg-[#0f172a] w-[220px] shrink-0 overflow-y-auto">

          {/* Panel tabs */}
          <div className="flex border-b border-[#1e293b]">
            {(["blur", "adjust"] as ActivePanel[]).map((p) => (
              <button
                key={p}
                onClick={() => setActivePanel(p)}
                className={`flex-1 py-2.5 text-[11px] font-500 transition-colors capitalize ${activePanel === p ? "text-sky-400 border-b-2 border-sky-400" : "text-[#475569] hover:text-[#64748b]"}`}
              >
                {p === "blur" ? "Blur" : "Adjust"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 p-4">

            {/* ── Blur panel ── */}
            {activePanel === "blur" && (
              <>
                <PanelSection label="Brush Size">
                  <SliderRow min={4} max={200} value={brushSize} onChange={setBrushSize} unit="px" />
                </PanelSection>

                <PanelSection label="Blur Strength">
                  <SliderRow min={1} max={40} value={blurStrength} onChange={setBlurStrength} unit="px" />
                </PanelSection>

                <div className="flex flex-col gap-2">
                  <button
                    className="panel-btn active w-full py-2 text-center"
                    onClick={applyBlur}
                    disabled={!hasMask}
                    style={{ opacity: hasMask ? 1 : 0.35 }}
                  >
                    Apply Gaussian Blur
                  </button>
                  <button className="panel-btn w-full py-1.5 text-center" onClick={clearMask} disabled={!hasMask}>
                    Clear Mask
                  </button>
                </div>

                <div className="rounded-lg border border-[#1e293b] p-3 text-[11px] text-[#475569] leading-relaxed">
                  <span className="block text-[#38bdf8] font-500 mb-1">How to use</span>
                  Select <em>Brush</em>, paint over the region you want to blur, adjust strength, then <em>Apply</em>.
                  Use <em>Eraser</em> to refine the selection.
                </div>
              </>
            )}

            {/* ── Adjust panel ── */}
            {activePanel === "adjust" && (
              <>
                <PanelSection label="Brightness">
                  <SliderRow min={0} max={200} value={adjustments.brightness} onChange={(v) => setAdjustments((a) => ({ ...a, brightness: v }))} unit="%" />
                </PanelSection>
                <PanelSection label="Contrast">
                  <SliderRow min={0} max={200} value={adjustments.contrast} onChange={(v) => setAdjustments((a) => ({ ...a, contrast: v }))} unit="%" />
                </PanelSection>
                <PanelSection label="Saturation">
                  <SliderRow min={0} max={200} value={adjustments.saturation} onChange={(v) => setAdjustments((a) => ({ ...a, saturation: v }))} unit="%" />
                </PanelSection>

                <div className="flex flex-col gap-2">
                  <button className="panel-btn active w-full py-2 text-center" onClick={applyAdjustments}>
                    Apply Adjustments
                  </button>
                  <button className="panel-btn w-full py-1.5 text-center" onClick={() => setAdjustments({ brightness: 100, contrast: 100, saturation: 100, sharpness: 0 })}>
                    Reset
                  </button>
                </div>
              </>
            )}

            {/* ── Crop panel (inline) ── */}
            {tool === "crop" && (
              <div className="mt-2 rounded-lg border border-[#334155] p-3 text-[11px] text-[#64748b] leading-relaxed">
                <span className="block text-sky-400 font-500 mb-1">Crop Mode</span>
                Drag on the canvas to select area. Rule-of-thirds grid shown.
                {cropRect && cropRect.w > 4 && !isCropping && (
                  <div className="mt-3 flex gap-2">
                    <button className="panel-btn active flex-1" onClick={applyCrop}>✓ Apply</button>
                    <button className="panel-btn flex-1" onClick={cancelCrop}>✕</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-500 text-[#475569] uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

function SliderRow({ min, max, value, onChange, unit }: { min: number; max: number; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="panel-slider flex-1"
      />
      <span className="text-[11px] tabular-nums text-[#64748b] w-10 text-right">{value}{unit}</span>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function IconBrush() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>;
}
function IconEraser() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-1.5 1.5"/><path d="M6.5 17.5l3-3"/></svg>;
}
function IconCrop() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14h14"/><path d="M2 6h14v14"/></svg>;
}
function IconZoom() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>;
}
function IconPan() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>;
}
function IconUndo() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.6 6.6L3 9"/></svg>;
}