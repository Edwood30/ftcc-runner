import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { processImage } from "../../utils/image";
import { loadOverlayImage } from "../../utils/overlay";
import { buildZip, dataURLToBytes, downloadZipBlob } from "../../utils/zip";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type RgMedPostType = "GAMOT Availability" | "Pharmacy Advisory" | "Health Tip" | "Promo Announcement";
type RgMedAudience = "Members" | "Seniors" | "Families" | "Community Partners";

interface RgMedPhoto {
  name: string;
  dataURL: string;
}

interface RgMedSavedPost {
  id: string;
  type: RgMedPostType;
  audience: RgMedAudience;
  location: string;
  date: string;
  caption: string;
  photos: RgMedPhoto[];
}

const postTypes: RgMedPostType[] = ["GAMOT Availability", "Pharmacy Advisory", "Health Tip", "Promo Announcement"];
const audiences: RgMedAudience[] = ["Members", "Seniors", "Families", "Community Partners"];
const commonMedicines = ["Amlodipine", "Losartan", "Metformin", "Atorvastatin", "Simvastatin", "Omeprazole"];
const RGMED_FRAME_CONFIG = {
  canvas: { width: 3750, height: 1969 },
  frame: { x: 0, y: 0, width: 3750, height: 1969 },
} as const;

function readImage(file: File): Promise<RgMedPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataURL: String(reader.result) });
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function loadSavedPosts(): RgMedSavedPost[] {
  try {
    return JSON.parse(window.localStorage.getItem("rgmed-post-history") || "[]") as RgMedSavedPost[];
  } catch {
    return [];
  }
}

export function RgMedSystemPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [postType, setPostType] = useState<RgMedPostType>("GAMOT Availability");
  const [audience, setAudience] = useState<RgMedAudience>("Members");
  const [location, setLocation] = useState("RG-Med Pharmacy");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [medicines, setMedicines] = useState<string[]>(["Amlodipine", "Losartan", "Metformin"]);
  const [note, setNote] = useState("Bring your PhilHealth details and prescription for verification.");
  const [photos, setPhotos] = useState<RgMedPhoto[]>([]);
  const [brandedPhotos, setBrandedPhotos] = useState<RgMedPhoto[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [savedPosts, setSavedPosts] = useState<RgMedSavedPost[]>(() => loadSavedPosts());
  const [status, setStatus] = useState("");

  const caption = useMemo(() => {
    const medicineText = medicines.length ? medicines.join(", ") : "selected GAMOT medicines";
    const mainLine = postType === "GAMOT Availability"
      ? "Available today at " + location + ": " + medicineText + "."
      : postType === "Pharmacy Advisory"
        ? "Pharmacy advisory for " + audience.toLowerCase() + " at " + location + "."
        : postType === "Health Tip"
          ? "Health reminder for " + audience.toLowerCase() + ": follow your prescribed schedule and consult your healthcare provider for medicine guidance."
          : "RG-Med Pharmacy announcement for " + audience.toLowerCase() + " at " + location + ".";
    return [
      "RG-Med Pharmacy | PhilHealth GAMOT Partner",
      "",
      mainLine,
      "Date: " + new Date(date).toLocaleDateString(),
      note,
      "",
      "Message RG-Med Pharmacy for availability confirmation before visiting.",
      "#RGMedPharmacy #PhilHealthGAMOT #SerbisyongBotika",
    ].join("\n");
  }, [audience, date, location, medicines, note, postType]);

  const toggleMedicine = (medicine: string) => {
    setMedicines((current) => current.includes(medicine) ? current.filter((item) => item !== medicine) : [...current, medicine]);
  };

  const applyOverlay = async (sourcePhotos: RgMedPhoto[]) => {
    if (!sourcePhotos.length) {
      setBrandedPhotos([]);
      return;
    }
    setIsProcessingImages(true);
    setStatus("Applying RG-Med overlay...");
    try {
      const overlay = await loadOverlayImage("/RGMed Overlay.png");
      const processed = await Promise.all(
        sourcePhotos.map(async (photo) => ({
          name: photo.name.replace(/\.[^.]+$/, "") + "-rgmed.jpg",
          dataURL: await processImage(photo.dataURL, overlay, RGMED_FRAME_CONFIG),
        })),
      );
      setBrandedPhotos(processed);
      setStatus("RG-Med overlay applied.");
    } catch {
      setStatus("Could not apply the RG-Med overlay. Please try another image.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const selected = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    const next = await Promise.all(selected.slice(0, 12).map(readImage));
    const combined = [...photos, ...next].slice(0, 12);
    setPhotos(combined);
    await applyOverlay(combined);
  };

  const downloadBrandedZip = () => {
    const outputPhotos = brandedPhotos.length ? brandedPhotos : photos;
    if (!outputPhotos.length) return;
    const files = outputPhotos.map((photo) => ({
      name: photo.name.replace(/\.[^.]+$/, "") + ".jpg",
      data: dataURLToBytes(photo.dataURL),
    }));
    files.push({ name: "caption.txt", data: new TextEncoder().encode(caption) });
    const safeName = location.trim().replace(/[<>:\"/\\|?*]/g, "").replace(/\s+/g, "-").toLowerCase() || "rgmed-post";
    downloadZipBlob(buildZip(files), safeName + "-rgmed.zip");
  };

  const savePost = () => {
    const nextPost: RgMedSavedPost = {
      id: crypto.randomUUID(),
      type: postType,
      audience,
      location,
      date,
      caption,
      photos: brandedPhotos.length ? brandedPhotos : photos,
    };
    const next = [nextPost, ...savedPosts].slice(0, 20);
    setSavedPosts(next);
    window.localStorage.setItem("rgmed-post-history", JSON.stringify(next));
    setStatus("Saved to RG-Med history.");
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    setStatus("Caption copied.");
  };

  return (
    <div className="rgmed-system min-h-screen">
      <header className="rgmed-header">
        <div className="rgmed-header-inner">
          <Link to="/" className="rgmed-back">Back</Link>
          <div className="rgmed-brand">
            <img src="/rg-med-logo.png" alt="RG-Med Pharmacy logo" />
            <div>
              <p>PhilHealth GAMOT Partner</p>
              <h1>RG-Med Pharmacy Posting System</h1>
            </div>
          </div>
          <span className="rgmed-status">System online</span>
        </div>
      </header>

      <main className="rgmed-main">
        <section className="rgmed-panel rgmed-composer">
          <div className="rgmed-section-head">
            <p>Post setup</p>
            <h2>Create pharmacy post</h2>
          </div>

          <div className="rgmed-fieldset">
            <span>Post type</span>
            <div className="rgmed-segment-grid">
              {postTypes.map((type) => (
                <button key={type} className={type === postType ? "active" : ""} onClick={() => setPostType(type)} type="button">
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="rgmed-form-grid">
            <Input label="LOCATION" value={location} onChange={(event) => setLocation(event.target.value)} />
            <Input label="DATE" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div className="rgmed-fieldset">
            <span>Audience</span>
            <div className="rgmed-segment-grid compact">
              {audiences.map((item) => (
                <button key={item} className={item === audience ? "active" : ""} onClick={() => setAudience(item)} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rgmed-fieldset">
            <span>Medicine list</span>
            <div className="rgmed-chip-grid">
              {commonMedicines.map((medicine) => (
                <button key={medicine} className={medicines.includes(medicine) ? "active" : ""} onClick={() => toggleMedicine(medicine)} type="button">
                  {medicine}
                </button>
              ))}
            </div>
          </div>

          <label className="rgmed-note">
            NOTE
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
          </label>

          <div className="rgmed-upload" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
            <strong>Upload pharmacy photos</strong>
            <span>Medicine shelves, GAMOT signage, advisory graphics, or branch photos.</span>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={(event) => void handleFiles(event.target.files)} />
          </div>

          {(brandedPhotos.length > 0 || photos.length > 0) && (
            <div className="rgmed-photo-grid rgmed-output-grid">
              {(brandedPhotos.length ? brandedPhotos : photos).map((photo) => (
                <figure key={photo.name}>
                  <img src={photo.dataURL} alt={photo.name} />
                </figure>
              ))}
            </div>
          )}
        </section>

        <aside className="rgmed-panel rgmed-preview">
          <div className="rgmed-section-head">
            <p>Preview</p>
            <h2>Caption and outputs</h2>
          </div>
          <pre>{caption}</pre>
          {status && <p className="rgmed-message">{status}</p>}
          <div className="rgmed-actions">
            <Button variant="primary" onClick={() => void copyCaption()}>Copy Caption</Button>
            <Button onClick={() => void applyOverlay(photos)} disabled={!photos.length || isProcessingImages}>
              {isProcessingImages ? "Applying..." : "Apply Overlay"}
            </Button>
            <Button onClick={downloadBrandedZip} disabled={!photos.length}>Download ZIP</Button>
            <Button onClick={savePost}>Save History</Button>
          </div>
        </aside>

        <section className="rgmed-panel rgmed-history">
          <div className="rgmed-section-head">
            <p>History</p>
            <h2>Saved RG-Med posts</h2>
          </div>
          {savedPosts.length === 0 ? (
            <p className="rgmed-empty">No RG-Med posts saved yet.</p>
          ) : (
            <div className="rgmed-history-list">
              {savedPosts.map((post) => (
                <article key={post.id}>
                  <div>
                    <strong>{post.type}</strong>
                    <span>{post.location} - {new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <p>{post.caption}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
