/**
 * Client-side biodata export helpers.
 *
 * Note: html2canvas rasterizes the DOM, so exported PDF/image pages are
 * bitmaps — text is not selectable in the resulting file. The on-screen
 * DocumentRenderer keeps selectable text for preview/print.
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type PageSize = "a4" | "letter";

const PAGE_MM: Record<PageSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

function getPages(rootEl: HTMLElement): HTMLElement[] {
  const pages = Array.from(
    rootEl.querySelectorAll<HTMLElement>("[data-biodata-page]")
  );
  return pages.length > 0 ? pages : [rootEl];
}

function stripExtension(filename: string): string {
  return filename.replace(/\.(pdf|png|jpe?g)$/i, "");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function capturePage(
  pageEl: HTMLElement,
  scale = 2
): Promise<HTMLCanvasElement> {
  return html2canvas(pageEl, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
}

export async function exportDocumentPdf(
  rootEl: HTMLElement,
  filename: string,
  pageSize: PageSize = "a4"
): Promise<void> {
  const pages = getPages(rootEl);
  const { w, h } = PAGE_MM[pageSize];
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: pageSize === "a4" ? "a4" : "letter",
  });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await capturePage(pages[i], 2);
    const img = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();
    // Fit page canvas to full PDF page for crisp portrait output
    pdf.addImage(img, "PNG", 0, 0, w, h, undefined, "FAST");
  }

  const name = `${stripExtension(filename)}.pdf`;
  pdf.save(name);
}

export async function exportDocumentImage(
  rootEl: HTMLElement,
  format: "png" | "jpeg",
  filename: string
): Promise<void> {
  // jszip is not a dependency — download each page as a separate file.
  const pages = getPages(rootEl);
  const base = stripExtension(filename);
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = format === "jpeg" ? 0.92 : undefined;
  const ext = format === "jpeg" ? "jpg" : "png";

  for (let i = 0; i < pages.length; i++) {
    const canvas = await capturePage(pages[i], 2);
    const dataUrl = canvas.toDataURL(mime, quality);
    const blob = await (await fetch(dataUrl)).blob();
    const pageName =
      pages.length === 1 ? `${base}.${ext}` : `${base}-page-${i + 1}.${ext}`;
    triggerDownload(blob, pageName);
    // Small stagger so browsers don't coalesce sequential downloads
    if (i < pages.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

export function printDocument(rootEl: HTMLElement): void {
  const styleId = "biodata-print-styles";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      [data-biodata-print-root],
      [data-biodata-print-root] * {
        visibility: visible !important;
      }
      [data-biodata-print-root] {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      [data-biodata-page] {
        box-shadow: none !important;
        break-after: page;
        page-break-after: always;
        margin: 0 auto !important;
      }
      [data-biodata-page]:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  `;

  const prev = rootEl.getAttribute("data-biodata-print-root");
  rootEl.setAttribute("data-biodata-print-root", "true");

  const cleanup = () => {
    if (prev === null) rootEl.removeAttribute("data-biodata-print-root");
    else rootEl.setAttribute("data-biodata-print-root", prev);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  window.print();
}
