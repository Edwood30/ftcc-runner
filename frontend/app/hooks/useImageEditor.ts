import { useMemo, useState } from "react";

export function useImageEditor() {
  const [editedImages, setEditedImages] = useState<Record<string, string>>({});
  const [editingFile, setEditingFile] = useState<File | null>(null);

  const openEditor = (file: File) => setEditingFile(file);
  const closeEditor = () => setEditingFile(null);
  const saveEditedImage = (fileName: string, editedDataURL: string) => {
    setEditedImages((prev) => ({ ...prev, [fileName]: editedDataURL }));
  };
  const clearEditedImages = () => setEditedImages({});

  const editedCount = useMemo(() => Object.keys(editedImages).length, [editedImages]);
  return { editedImages, editingFile, editedCount, openEditor, closeEditor, saveEditedImage, clearEditedImages };
}
