import type { ProcessedImage } from "../../types/mission";
import { downloadDataUrl } from "../../utils/zip";
import { Button } from "../ui/Button";

interface PreviewModalProps {
  activePreview: ProcessedImage | null;
  setActivePreview: (image: ProcessedImage | null) => void;
  processedImages: ProcessedImage[];
}

export function PreviewModal({ activePreview, setActivePreview, processedImages }: PreviewModalProps) {
  if (!activePreview) return null;
  const index = processedImages.findIndex((item) => item.name === activePreview.name && item.dataURL === activePreview.dataURL);
  const currentIndex = index < 0 ? 0 : index;
  const downloadCurrent = () => {
    const safeName = `${activePreview.name.replace(/\.[^.]+$/, "")}_ftcc.jpg`;
    downloadDataUrl(activePreview.dataURL, safeName);
  };
  const move = (step: number) => {
    const next = (currentIndex + step + processedImages.length) % processedImages.length;
    setActivePreview(processedImages[next]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#103148]/45 p-4 backdrop-blur-sm" onClick={() => setActivePreview(null)}>
      <div className="ftcc-card flex w-[min(96vw,1200px)] flex-col items-center gap-4 rounded-[30px] p-5 dark:text-[#E2EDF5]" onClick={(event) => event.stopPropagation()}>
        <img src={activePreview.dataURL} alt={activePreview.name} className="max-h-[75vh] w-full rounded-[24px] border border-[#1F5F8B]/10 object-contain" />
        <div className="flex items-center gap-2">
          <Button aria-label="Previous image" onClick={() => move(-1)}>
            &larr;
          </Button>
          <Button aria-label="Next image" onClick={() => move(1)}>
            &rarr;
          </Button>
          <Button onClick={downloadCurrent}>
            Download
          </Button>
          <Button variant="danger" onClick={() => setActivePreview(null)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
