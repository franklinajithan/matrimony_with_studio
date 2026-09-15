"use client";

import { useParams } from "next/navigation";
import { BiodataEditor } from "@/components/biodata/BiodataEditor";

export default function BiodataEditPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Missing document id
      </div>
    );
  }

  return <BiodataEditor documentId={id} />;
}
