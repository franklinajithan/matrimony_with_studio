"use client";

import { useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PreviewPhoto = { url: string; grayscale?: boolean };

export function PhotoPreview({ photos, index, name, children }: {
  photos: PreviewPhoto[];
  index: number;
  name: string;
  children: ReactElement;
}) {
  const [selected, setSelected] = useState(index);
  const photo = photos[selected];

  function move(step: number) {
    setSelected(current => (current + step + photos.length) % photos.length);
  }

  return (
    <Dialog onOpenChange={open => { if (open) setSelected(index); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100%-1rem)] max-w-4xl rounded-lg px-2 pb-2 pt-10" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Photos of {name}</DialogTitle>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={`Photo ${selected + 1} of ${name}`} className={`max-h-[72dvh] w-full object-contain ${photo.grayscale ? "grayscale" : ""}`} />
        )}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button type="button" variant="outline" size="icon" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft /></Button>
            <span aria-live="polite">{selected + 1} / {photos.length}</span>
            <Button type="button" variant="outline" size="icon" aria-label="Next photo" onClick={() => move(1)}><ChevronRight /></Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
