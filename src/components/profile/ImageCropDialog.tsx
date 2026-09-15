"use client";

import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
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
import { cropImageToBlob } from "@/lib/media/image-edit";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  title?: string;
  description?: string;
  cropShape?: "rect" | "round";
  onOpenChange: (open: boolean) => void;
  onComplete: (file: File, previewUrl: string) => void;
};

export function ImageCropDialog({
  open,
  imageSrc,
  title = "Adjust photo",
  description = "Drag to reposition and use the slider to zoom.",
  cropShape = "rect",
  onOpenChange,
  onComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setApplying(false);
      setError(null);
    }
  }

  async function handleApply() {
    if (!imageSrc || !croppedAreaPixels) return;
    setApplying(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, {
        size: cropShape === "round" ? 512 : 1024,
      });
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      onComplete(file, previewUrl);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop that photo.");
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="space-y-1 border-b px-6 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full bg-black sm:h-80">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
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
  );
}
