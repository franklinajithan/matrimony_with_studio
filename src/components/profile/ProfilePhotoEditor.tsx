"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const OUTPUT_SIZE = 512;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

/** Crop to a square JPEG suitable for circular avatars. */
export async function cropImageToBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the photo editor.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not crop that photo."));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

type ProfilePhotoEditorProps = {
  currentUrl?: string | null;
  previewUrl?: string | null;
  displayName?: string;
  disabled?: boolean;
  className?: string;
  onCropped: (file: File, previewUrl: string) => void;
  onClear?: () => void;
};

export function ProfilePhotoEditor({
  currentUrl,
  previewUrl,
  displayName,
  disabled,
  className,
  onCropped,
  onClear,
}: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownUrl = previewUrl || currentUrl || "";
  const initials = (displayName || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

  useEffect(() => {
    return () => {
      if (sourceUrl?.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max file size is 5MB.");
      return;
    }
    setError(null);
    if (sourceUrl?.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      if (sourceUrl?.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
      setSourceUrl(null);
      setApplying(false);
    }
  }

  async function handleApply() {
    if (!sourceUrl || !croppedAreaPixels) return;
    setApplying(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(sourceUrl, croppedAreaPixels);
      const file = new File([blob], `profile-${Date.now()}.jpg`, { type: "image/jpeg" });
      const preview = URL.createObjectURL(blob);
      onCropped(file, preview);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop that photo.");
      setApplying(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <Avatar className="h-36 w-36 border-4 border-background shadow-md ring-2 ring-border sm:h-40 sm:w-40">
          {shownUrl ? (
            <AvatarImage src={shownUrl} alt={displayName || "Profile photo"} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-secondary text-2xl font-semibold text-secondary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-1 right-1 h-10 w-10 rounded-full border shadow-sm"
          onClick={openPicker}
          disabled={disabled}
          aria-label="Change profile photo"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" onClick={openPicker} disabled={disabled}>
          {previewUrl || (currentUrl && !currentUrl.includes("placehold")) ? "Change photo" : "Upload photo"}
        </Button>
        {previewUrl && onClear ? (
          <Button type="button" variant="ghost" onClick={onClear} disabled={disabled}>
            Remove selection
          </Button>
        ) : null}
      </div>

      {previewUrl ? (
        <p className="text-center text-xs text-muted-foreground">New photo ready — save your profile to keep it.</p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Drag to reposition and use zoom after you choose a photo.
        </p>
      )}
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="space-y-1 border-b px-6 py-4 text-left">
            <DialogTitle>Adjust profile photo</DialogTitle>
            <DialogDescription>
              Drag to move. Use the slider to zoom. The circle shows how members will see you.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-72 w-full bg-black sm:h-80">
            {sourceUrl ? (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </div>

          <div className="space-y-3 border-t px-6 py-4">
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
                aria-label="Zoom"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-4 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={applying}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleApply()} disabled={applying || !croppedAreaPixels}>
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Use photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
