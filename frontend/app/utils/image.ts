export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function sourceToImage(source: File | string): Promise<HTMLImageElement> {
  if (typeof source === "string") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin for non-dataURL sources to avoid CORS issues with dataURLs
      if (!source.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source;
    });
  }
  return fileToImage(source);
}

export async function processImage(
  source: File | string,
  overlayImg: HTMLImageElement,
  frameConfig: { canvas: { width: number; height: number }; frame: { x: number; y: number; width: number; height: number } },
): Promise<string> {
  const userImg = await sourceToImage(source);
  const { width: canvasWidth, height: canvasHeight } = frameConfig.canvas;
  const { x, y, width, height } = frameConfig.frame;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const imgAspect = userImg.width / userImg.height;
  const frameAspect = width / height;
  let sx = 0;
  let sy = 0;
  let sw = userImg.width;
  let sh = userImg.height;
  if (imgAspect > frameAspect) {
    sw = userImg.height * frameAspect;
    sx = (userImg.width - sw) / 2;
  } else {
    sh = userImg.width / frameAspect;
    sy = (userImg.height - sh) / 2;
  }

  ctx.drawImage(userImg, sx, sy, sw, sh, x, y, width, height);
  
  // Scale overlay to match canvas dimensions
  if (overlayImg && overlayImg.width > 0 && overlayImg.height > 0) {
    ctx.drawImage(overlayImg, 0, 0, canvasWidth, canvasHeight);
  }
  
  return canvas.toDataURL("image/jpeg", 0.88);
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cannot read image dimensions."));
    };
    img.src = url;
  });
}
