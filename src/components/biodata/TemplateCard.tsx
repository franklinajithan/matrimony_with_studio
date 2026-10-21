"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataTemplateDef,
  BiodataVisibility,
} from "@/lib/biodata/types";
import { defaultDesignForTemplate, mergeDesign } from "@/lib/biodata/defaults";
import { DocumentRenderer } from "@/components/biodata/DocumentRenderer";

export type TemplateCardProps = {
  template: BiodataTemplateDef;
  content: BiodataContent;
  visibility: BiodataVisibility;
  sectionOrder: string[];
  design?: Partial<BiodataDesign>;
  isFavourite?: boolean;
  selected?: boolean;
  onSelect?: (templateId: string) => void;
  onToggleFavourite?: (templateId: string) => void;
  className?: string;
};

export function TemplateCard({
  template,
  content,
  visibility,
  sectionOrder,
  design,
  isFavourite = false,
  selected = false,
  onSelect,
  onToggleFavourite,
  className,
}: TemplateCardProps) {
  const previewDesign = React.useMemo(() => {
    const base = defaultDesignForTemplate(template.id);
    return mergeDesign(base, {
      fontSize: 0.85,
      spacing: 0.85,
      showBranding: false,
      ...(design ?? {}),
      templateId: template.id,
      templateVersion: template.version,
    });
  }, [template, design]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/15 bg-background transition-shadow hover:shadow-md",
        selected && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => onSelect?.(template.id)}
        aria-pressed={selected}
      >
        <div className="relative h-44 overflow-hidden bg-background">
          <div className="pointer-events-none absolute left-1/2 top-2 origin-top -translate-x-1/2 scale-[0.22]">
            <DocumentRenderer
              content={content}
              design={previewDesign}
              visibility={visibility}
              sectionOrder={sectionOrder}
              templateId={template.id}
              className="gap-0"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
        </div>
      </button>

      <CardHeader className="space-y-2 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base text-foreground">{template.name}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
            aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={isFavourite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite?.(template.id);
            }}
          >
            <Heart
              className={cn("h-4 w-4", isFavourite && "fill-gold text-gold-foreground")}
            />
          </Button>
        </div>
        {template.description ? (
          <CardDescription className="line-clamp-2 text-xs">
            {template.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="px-4 pb-2 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {template.categories.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className="border-primary/25 bg-card text-[10px] font-medium text-primary"
            >
              {cat}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <Button
          type="button"
          size="sm"
          className="w-full bg-primary text-white hover:bg-primary-dark"
          onClick={() => onSelect?.(template.id)}
        >
          Use template
        </Button>
      </CardFooter>
    </Card>
  );
}
