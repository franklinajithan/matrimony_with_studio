"use client";

import React, { useRef, useState } from "react";
import {
  Crop,
  GripVertical,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ImageCropDialog } from "@/components/profile/ImageCropDialog";
import { cn } from "@/lib/utils";

export type GalleryPhotoItem = {
  id: string;
  url: string;
  hint: string;
  storagePath?: string;
  grayscale?: boolean;
  pendingFile?: File;
};

type PhotoGalleryEditorProps = {
  photos: GalleryPhotoItem[];
  maxPhotos?: number;
  disabled?: boolean;
  onChange: (photos: GalleryPhotoItem[]) => void;
};

export function PhotoGalleryEditor({
  photos,
  maxPhotos = 5,
  disabled,
  onChange,
}: PhotoGalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const slotsLeft = Math.max(0, maxPhotos - photos.length);
  const cropItem = photos.find((photo) => photo.id === cropTargetId) || null;

  function updatePhoto(id: string, patch: Partial<GalleryPhotoItem>) {
    onChange(photos.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)));
  }

  function removePhoto(id: string) {
    const target = photos.find((photo) => photo.id === id);
    if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
    onChange(photos.filter((photo) => photo.id !== id));
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || slotsLeft <= 0) return;

    const accepted = files
      .filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024)
      .slice(0, slotsLeft);

    const additions: GalleryPhotoItem[] = accepted.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      hint: "gallery photo",
      grayscale: false,
      pendingFile: file,
    }));

    onChange([...photos, ...additions]);
  }

  function handleCropComplete(file: File, previewUrl: string) {
    if (!cropTargetId) return;
    const previous = photos.find((photo) => photo.id === cropTargetId);
    if (previous?.url.startsWith("blob:")) URL.revokeObjectURL(previous.url);
    updatePhoto(cropTargetId, {
      url: previewUrl,
      pendingFile: file,
      hint: previous?.hint || "gallery photo",
    });
    setCropTargetId(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex == null || dragIndex === index) return;
              movePhoto(dragIndex, index);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-muted shadow-sm",
              dragIndex === index && "opacity-60"
            )}
          >
            <div className="aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Gallery photo ${index + 1}`}
                className={cn(
                  "h-full w-full object-cover transition",
                  photo.grayscale && "grayscale"
                )}
              />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-1 text-white">
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[10px] font-medium">{index + 1}</span>
              </span>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-7 w-7"
                disabled={disabled}
                onClick={() => removePhoto(photo.id)}
                aria-label="Delete photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/75 to-transparent p-2 pt-8">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`bw-${photo.id}`}
                  checked={Boolean(photo.grayscale)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    updatePhoto(photo.id, { grayscale: checked === true })
                  }
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor={`bw-${photo.id}`} className="cursor-pointer text-xs text-white">
                  Black &amp; white
                </Label>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 flex-1 px-2 text-xs"
                  disabled={disabled}
                  onClick={() => setCropTargetId(photo.id)}
                >
                  <Crop className="mr-1 h-3 w-3" />
                  Crop
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  disabled={disabled || index === 0}
                  onClick={() => movePhoto(index, index - 1)}
                  aria-label="Move left"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  disabled={disabled || index === photos.length - 1}
                  onClick={() => movePhoto(index, index + 1)}
                  aria-label="Move right"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {slotsLeft > 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="px-2 text-center text-xs">
              Add photos
              <br />
              ({slotsLeft} left)
            </span>
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Select multiple images at once. Drag cards or use arrows to reorder. Crop adjusts framing.
        Black &amp; white is a preview toggle — uncheck anytime to restore colour before or after saving.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <ImageCropDialog
        open={Boolean(cropItem)}
        imageSrc={cropItem?.url || null}
        title="Crop gallery photo"
        description="Drag to reposition and zoom. Square crop works best in the gallery."
        cropShape="rect"
        onOpenChange={(open) => {
          if (!open) setCropTargetId(null);
        }}
        onComplete={handleCropComplete}
      />
    </div>
  );
}
