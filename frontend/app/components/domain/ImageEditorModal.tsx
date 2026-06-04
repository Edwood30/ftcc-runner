import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "../ui/Button";
import { ControlGroup } from "../ui/ControlGroup";
import { RangeSlider } from "../ui/RangeSlider";

interface ImageEditorModalProps {
  file: File;
  initialDataURL?: string;
  onSave: (dataURL: string) => void;
  onClose: () => void;
}

type Tool = "brush" | "eraser" | "pan" | "crop";

const DEFAULT_BRUSH_SIZE = 40;
const DEFAULT_BLUR_STRENGTH = 10;
const CROP_OUTPUT = { width: 3750, height: 1969 };
const CROP_ASPECT = CROP_OUTPUT.width / CROP_OUTPUT.height;

export function ImageEditorModal({ file, initialDataURL, onSave, onClose }: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const templateOverlayRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const cropDragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [sourceDataURL, setSourceDataURL] = useState(initialDataURL ?? "");
  const [tool, setTool] = useState<Tool>("crop");
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [blurStrength, setBlurStrength] = useState(DEFAULT_BLUR_STRENGTH);
  const [cropBaseDataURL, setCropBaseDataURL] = useState(initialDataURL ?? "");
  const [cropZoom, setCropZoom] = useState(100);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isPainting, setIsPainting] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: -9999, y: -9999, visible: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialDataURL) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = String(reader.result ?? "");
      setSourceDataURL(dataURL);
      setCropBaseDataURL(dataURL);
    };
    reader.onerror = () => setError("Unable to load this image.");
    reader.readAsDataURL(file);
  }, [file, initialDataURL]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      templateOverlayRef.current = image;
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas && tool === "crop") {
        drawTemplateOverlay(overlayCanvas, image);
      }
    };
    image.src = "/FTCC Overlay.png";
  }, [tool]);

  const clearMaskLayers = useCallback(() => {
    [maskCanvasRef.current, overlayCanvasRef.current].forEach((canvas) => {
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    });
    setHasMask(false);
  }, []);

  const drawImage = useCallback((dataURL: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !dataURL) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d")?.drawImage(image, 0, 0);

      [maskCanvasRef.current, overlayCanvasRef.current].forEach((layer) => {
        if (!layer) {
          return;
        }
        layer.width = image.width;
        layer.height = image.height;
      });

      clearMaskLayers();
    };
    image.onerror = () => setError("Unable to render this image.");
    image.src = dataURL;
  }, [clearMaskLayers]);

  const renderSmartCrop = useCallback((dataURL: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !dataURL) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const outputWidth = CROP_OUTPUT.width;
      const outputHeight = Math.round(outputWidth / CROP_ASPECT);
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const baseScale = Math.max(outputWidth / image.width, outputHeight / image.height);
      const scale = baseScale * (cropZoom / 100);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const maxOffsetX = Math.max(0, (drawWidth - outputWidth) / 2);
      const maxOffsetY = Math.max(0, (drawHeight - outputHeight) / 2);
      const dx = (outputWidth - drawWidth) / 2 + (cropOffset.x / 100) * maxOffsetX;
      const dy = (outputHeight - drawHeight) / 2 + (cropOffset.y / 100) * maxOffsetY;

      ctx.drawImage(image, dx, dy, drawWidth, drawHeight);

      [maskCanvasRef.current, overlayCanvasRef.current].forEach((layer) => {
        if (!layer) {
          return;
        }
        layer.width = outputWidth;
        layer.height = outputHeight;
      });

      maskCanvasRef.current?.getContext("2d")?.clearRect(0, 0, outputWidth, outputHeight);
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const overlayImage = templateOverlayRef.current;
        if (overlayImage) {
          drawTemplateOverlay(overlayCanvas, overlayImage);
        } else {
          drawCropGuide(overlayCanvas);
        }
      }
      setHasMask(false);
    };
    image.onerror = () => setError("Unable to render this crop.");
    image.src = dataURL;
  }, [cropOffset.x, cropOffset.y, cropZoom]);

  useEffect(() => {
    if (cropBaseDataURL && tool === "crop") {
      renderSmartCrop(cropBaseDataURL);
      return;
    }

    drawImage(sourceDataURL);
  }, [cropBaseDataURL, drawImage, renderSmartCrop, sourceDataURL, tool]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const paintPoint = useCallback((point: { x: number; y: number }) => {
    if (tool !== "brush" && tool !== "eraser") {
      return;
    }

    const maskCanvas = maskCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!maskCanvas || !overlayCanvas) {
      return;
    }

    const radius = brushSize / 2;
    const maskCtx = maskCanvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!maskCtx || !overlayCtx) {
      return;
    }

    [maskCtx, overlayCtx].forEach((ctx) => {
      ctx.globalCompositeOperation = tool === "brush" ? "source-over" : "destination-out";
      ctx.fillStyle = ctx === maskCtx ? "white" : "rgba(56, 189, 248, 0.42)";
      drawStroke(ctx, lastPointRef.current, point, radius);
    });

    lastPointRef.current = point;
    setHasMask(tool === "brush" || maskHasPaint(maskCanvas));
  }, [brushSize, tool]);

  const updateBrushCursor = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "brush" && tool !== "eraser") {
      setCursor((current) => ({ ...current, visible: false }));
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    setCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      visible: true,
    });
  }, [tool]);

  const paintMask = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    updateBrushCursor(event);
    if (!isPainting) {
      return;
    }

    const point = getPoint(event);
    if (point) {
      paintPoint(point);
    }
  }, [isPainting, paintPoint, updateBrushCursor]);

  const startPainting = (event: PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "brush" && tool !== "eraser") {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPainting(true);
    lastPointRef.current = null;
    updateBrushCursor(event);
    const point = getPoint(event);
    if (point) {
      paintPoint(point);
    }
  };

  const stopPainting = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPainting(false);
    lastPointRef.current = null;
  };

  const applyGaussianBlur = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !hasMask) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) {
      return;
    }

    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = canvas.width;
    blurCanvas.height = canvas.height;
    const blurCtx = blurCanvas.getContext("2d");
    if (!blurCtx) {
      return;
    }

    blurCtx.filter = `blur(${blurStrength}px)`;
    blurCtx.drawImage(canvas, 0, 0);
    blurCtx.filter = "none";

    const original = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blurred = blurCtx.getImageData(0, 0, canvas.width, canvas.height);
    const mask = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
    const result = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < result.data.length; i += 4) {
      const alpha = mask.data[i + 3] / 255;
      result.data[i] = original.data[i] * (1 - alpha) + blurred.data[i] * alpha;
      result.data[i + 1] = original.data[i + 1] * (1 - alpha) + blurred.data[i + 1] * alpha;
      result.data[i + 2] = original.data[i + 2] * (1 - alpha) + blurred.data[i + 2] * alpha;
      result.data[i + 3] = original.data[i + 3];
    }

    ctx.putImageData(result, 0, 0);
    setSourceDataURL(canvas.toDataURL("image/png"));
  };

  const startSmartCrop = () => {
    setCropBaseDataURL(sourceDataURL);
    setCropZoom(100);
    setCropOffset({ x: 0, y: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTool("crop");
  };

  const applySmartCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropBaseDataURL) {
      return;
    }

    setSourceDataURL(canvas.toDataURL("image/jpeg", 0.95));
    setCropBaseDataURL("");
    setTool("pan");
  };

  const setCropZoomClamped = (nextZoom: number) => {
    setCropZoom(Math.min(250, Math.max(100, nextZoom)));
  };

  const startCropDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "crop" || !cropBaseDataURL) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    };
  };

  const moveCropDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "crop" || !cropBaseDataURL || !cropDragStartRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const start = cropDragStartRef.current;
    const x = start.offsetX + ((event.clientX - start.x) / rect.width) * 200;
    const y = start.offsetY + ((event.clientY - start.y) / rect.height) * 200;
    setCropOffset({
      x: Math.min(100, Math.max(-100, x)),
      y: Math.min(100, Math.max(-100, y)),
    });
  };

  const stopCropDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    cropDragStartRef.current = null;
  };

  const resetImage = () => {
    setBrushSize(DEFAULT_BRUSH_SIZE);
    setBlurStrength(DEFAULT_BLUR_STRENGTH);
    setCropBaseDataURL("");
    setCropZoom(100);
    setCropOffset({ x: 0, y: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    drawImage(sourceDataURL);
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Unable to save this image.");
      return;
    }

    onSave(canvas.toDataURL("image/jpeg", 0.95));
    onClose();
  };

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (tool !== "pan") {
      return;
    }
    panStartRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (tool !== "pan" || !panStartRef.current) {
      return;
    }
    setPan({
      x: panStartRef.current.panX + event.clientX - panStartRef.current.x,
      y: panStartRef.current.panY + event.clientY - panStartRef.current.y,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950" role="dialog" aria-modal="true" aria-label="Image editor">
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">Image Editor</h2>
            <p className="truncate text-xs text-slate-400">{file.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" disabled={tool !== "crop"} onClick={() => setCropZoomClamped(cropZoom - 10)}>-</Button>
            <Button type="button" variant="secondary" disabled={tool !== "crop"} onClick={() => setCropZoomClamped(cropZoom + 10)}>+</Button>
            <Button type="button" variant="secondary" disabled={!cropBaseDataURL || tool !== "crop"} onClick={applySmartCrop}>Apply Crop</Button>
            <Button type="button" variant="secondary" onClick={resetImage}>Reset</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="primary" onClick={saveImage}>Save</Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_280px]">
          <section
            ref={viewportRef}
            className={`relative min-h-[420px] overflow-hidden bg-slate-900 ${tool === "pan" || tool === "crop" ? "cursor-grab active:cursor-grabbing" : "cursor-none"}`}
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={() => { panStartRef.current = null; }}
            onWheel={(event) => {
              if (tool === "crop") {
                setCropZoomClamped(cropZoom - event.deltaY * 0.05);
                return;
              }
              setZoom((current) => Math.min(4, Math.max(0.25, current - event.deltaY * 0.001)));
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
              <div className="relative shadow-2xl" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                <canvas ref={canvasRef} className="relative block max-w-none" />
                <canvas ref={maskCanvasRef} className="pointer-events-none absolute inset-0 opacity-0" />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 touch-none"
                  onPointerDown={(event) => {
                    if (tool === "crop") {
                      startCropDrag(event);
                      return;
                    }
                    startPainting(event);
                  }}
                  onPointerMove={(event) => {
                    if (tool === "crop") {
                      moveCropDrag(event);
                      return;
                    }
                    paintMask(event);
                  }}
                  onPointerUp={(event) => {
                    if (tool === "crop") {
                      stopCropDrag(event);
                      return;
                    }
                    stopPainting(event);
                  }}
                  onPointerCancel={(event) => {
                    if (tool === "crop") {
                      stopCropDrag(event);
                      return;
                    }
                    stopPainting(event);
                  }}
                  onPointerEnter={updateBrushCursor}
                  onPointerLeave={() => {
                    setCursor((current) => ({ ...current, visible: false }));
                    setIsPainting(false);
                    lastPointRef.current = null;
                    cropDragStartRef.current = null;
                  }}
                />
              </div>
            </div>
            {cursor.visible && (tool === "brush" || tool === "eraser") && (
              <div
                className={`pointer-events-none absolute rounded-full border-2 ${
                  tool === "eraser" ? "border-rose-300 bg-rose-400/10" : "border-sky-300 bg-sky-400/10"
                }`}
                style={{
                  left: cursor.x - (brushSize * zoom) / 2,
                  top: cursor.y - (brushSize * zoom) / 2,
                  width: brushSize * zoom,
                  height: brushSize * zoom,
                  boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.8), 0 0 18px rgba(56, 189, 248, 0.22)",
                }}
              />
            )}
            {tool === "crop" && cropBaseDataURL && (
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 px-4">
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 shadow-2xl backdrop-blur">
                  <Button type="button" variant="secondary" onClick={() => setCropZoomClamped(cropZoom - 10)}>-</Button>
                  <span className="min-w-14 text-center text-xs font-semibold tabular-nums text-slate-200">{Math.round(cropZoom)}%</span>
                  <Button type="button" variant="secondary" onClick={() => setCropZoomClamped(cropZoom + 10)}>+</Button>
                  <Button type="button" variant="primary" onClick={applySmartCrop}>Apply Crop</Button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6 overflow-y-auto border-t border-slate-800 bg-slate-950 p-4 md:border-l md:border-t-0">
            {error && <p className="rounded-md border border-red-400/30 bg-red-950/50 px-3 py-2 text-sm text-red-100">{error}</p>}

            <ControlGroup title="Tool">
              <div className="grid grid-cols-2 gap-2">
                <ToolButton active={tool === "brush"} onClick={() => setTool("brush")}>Brush</ToolButton>
                <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")}>Eraser</ToolButton>
                <ToolButton active={tool === "pan"} onClick={() => setTool("pan")}>Pan</ToolButton>
                <ToolButton active={tool === "crop"} onClick={startSmartCrop}>Crop</ToolButton>
              </div>
            </ControlGroup>

            <ControlGroup title="Smart Crop">
              <Button type="button" variant="primary" className="w-full" onClick={startSmartCrop}>Smart Crop</Button>
              {cropBaseDataURL && tool === "crop" && (
                <>
                  <RangeSlider label="Zoom" value={cropZoom} min={100} max={250} unit="%" onChange={setCropZoomClamped} />
                  <RangeSlider label="Horizontal Align" value={cropOffset.x} min={-100} max={100} unit="" onChange={(value) => setCropOffset((current) => ({ ...current, x: value }))} />
                  <RangeSlider label="Vertical Align" value={cropOffset.y} min={-100} max={100} unit="" onChange={(value) => setCropOffset((current) => ({ ...current, y: value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="primary" onClick={applySmartCrop}>Apply Crop</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setCropBaseDataURL("");
                        setTool("pan");
                      }}
                    >
                      Cancel Crop
                    </Button>
                  </div>
                </>
              )}
            </ControlGroup>

            <ControlGroup title="Gaussian Blur">
              <RangeSlider label="Brush Size" value={brushSize} min={4} max={200} unit="px" onChange={setBrushSize} />
              <RangeSlider label="Blur Strength" value={blurStrength} min={1} max={40} unit="px" onChange={setBlurStrength} />
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="primary" disabled={!hasMask} onClick={applyGaussianBlur}>Apply Blur</Button>
                <Button type="button" variant="secondary" disabled={!hasMask} onClick={clearMaskLayers}>Clear Mask</Button>
              </div>
            </ControlGroup>

            <ControlGroup title="View">
              <RangeSlider label="Zoom" value={Math.round(zoom * 100)} min={25} max={400} unit="%" onChange={(value) => setZoom(value / 100)} />
            </ControlGroup>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-sky-400 bg-sky-500/15 text-sky-200"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-500/60"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number } | null,
  to: { x: number; y: number },
  radius: number,
) {
  ctx.beginPath();

  if (!from) {
    ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(distance / Math.max(1, radius / 4)));

  for (let i = 0; i <= steps; i += 1) {
    const progress = i / steps;
    ctx.moveTo(from.x + dx * progress + radius, from.y + dy * progress);
    ctx.arc(from.x + dx * progress, from.y + dy * progress, radius, 0, Math.PI * 2);
  }

  ctx.fill();
}

function maskHasPaint(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return false;
  }

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      return true;
    }
  }
  return false;
}

function drawTemplateOverlay(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  drawCropGuide(canvas);
}

function drawCropGuide(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
  ctx.lineWidth = Math.max(6, canvas.width * 0.002);
  ctx.setLineDash([Math.max(20, canvas.width * 0.012), Math.max(14, canvas.width * 0.008)]);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, canvas.width - ctx.lineWidth, canvas.height - ctx.lineWidth);
  ctx.restore();
}
