export function buildOverlaySVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect x="0" y="0" width="1080" height="90" fill="#003366"/><rect x="0" y="84" width="1080" height="6" fill="#FFD700"/><rect x="0" y="990" width="1080" height="90" fill="#003366"/><rect x="0" y="990" width="1080" height="6" fill="#FFD700"/><rect x="85" y="85" width="910" height="820" rx="4" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.7"/></svg>`;
}

export function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function loadOverlayImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
