import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { ControlGroup } from "../ui/ControlGroup";
import { RangeSlider } from "../ui/RangeSlider";

interface ImageEditorModalProps {
  file: File;
  initialDataURL?: string;
  onSave: (dataURL: string) => void;
  onClose: () => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface TransformState {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

const DEFAULT_TRANSFORM: TransformState = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
};

export function ImageEditorModal({ file, initialDataURL, onSave, onClose }: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [sourceDataURL, setSourceDataURL] = useState(initialDataURL ?? "");
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialDataURL) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setSourceDataURL(String(reader.result ?? ""));
    reader.onerror = () => setError("Unable to load this image.");
    reader.readAsDataURL(file);
  }, [file, initialDataURL]);

  const filterStyle = useMemo(
    () =>
      `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`,
    [adjustments],
  );

  const imageTransform = useMemo(() => {
    const scaleX = transform.flipHorizontal ? -1 : 1;
    const scaleY = transform.flipVertical ? -1 : 1;
    return `rotate(${transform.rotation}deg) scale(${scaleX}, ${scaleY})`;
  }, [transform]);

  const drawToCanvas = useCallback((): string | null => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) {
      return null;
    }

    const normalizedRotation = ((transform.rotation % 360) + 360) % 360;
    const isSideways = normalizedRotation === 90 || normalizedRotation === 270;
    canvas.width = isSideways ? image.naturalHeight : image.naturalWidth;
    canvas.height = isSideways ? image.naturalWidth : image.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((normalizedRotation * Math.PI) / 180);
    ctx.scale(transform.flipHorizontal ? -1 : 1, transform.flipVertical ? -1 : 1);
    ctx.filter = filterStyle;
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [filterStyle, transform]);

  const updateAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
  };

  const rotate = (amount: number) => {
    setTransform((current) => ({ ...current, rotation: current.rotation + amount }));
  };

  const toggleFlip = (key: "flipHorizontal" | "flipVertical") => {
    setTransform((current) => ({ ...current, [key]: !current[key] }));
  };

  const resetEdits = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransform(DEFAULT_TRANSFORM);
  };

  const saveImage = () => {
    const dataURL = drawToCanvas();
    if (!dataURL) {
      setError("Unable to save this image.");
      return;
    }

    onSave(dataURL);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Image editor">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-slate-950 shadow-2xl ring-1 ring-white/10">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">Edit Image</h2>
            <p className="truncate text-xs text-slate-400">{file.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={resetEdits}>
              Reset
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={saveImage}>
              Save
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_280px]">
          <section className="flex min-h-[420px] items-center justify-center overflow-auto bg-slate-900 p-4">
            {sourceDataURL ? (
              <img
                ref={imageRef}
                src={sourceDataURL}
                alt="Editable preview"
                className="max-h-full max-w-full object-contain shadow-2xl"
                style={{ filter: filterStyle, transform: imageTransform }}
              />
            ) : (
              <p className="text-sm text-slate-400">Loading image...</p>
            )}
          </section>

          <aside className="space-y-6 overflow-y-auto border-t border-slate-800 bg-slate-950 p-4 md:border-l md:border-t-0">
            {error && (
              <div className="rounded-md border border-red-400/30 bg-red-950/50 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            <ControlGroup title="Transform">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={() => rotate(-90)}>
                  Rotate Left
                </Button>
                <Button type="button" variant="secondary" onClick={() => rotate(90)}>
                  Rotate Right
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleFlip("flipHorizontal")}>
                  Flip H
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleFlip("flipVertical")}>
                  Flip V
                </Button>
              </div>
            </ControlGroup>

            <ControlGroup title="Adjustments">
              <RangeSlider
                label="Brightness"
                value={adjustments.brightness}
                min={50}
                max={150}
                unit="%"
                onChange={(value) => updateAdjustment("brightness", value)}
              />
              <RangeSlider
                label="Contrast"
                value={adjustments.contrast}
                min={50}
                max={150}
                unit="%"
                onChange={(value) => updateAdjustment("contrast", value)}
              />
              <RangeSlider
                label="Saturation"
                value={adjustments.saturation}
                min={0}
                max={200}
                unit="%"
                onChange={(value) => updateAdjustment("saturation", value)}
              />
            </ControlGroup>
          </aside>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
