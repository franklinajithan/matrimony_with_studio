import { NextResponse } from "next/server";
export function mutationError(error: { code?: string }) {
  const status =
    error.code === "42501"
      ? 403
      : error.code === "P0002"
        ? 404
        : error.code === "22023"
          ? 400
          : error.code === "40001"
            ? 409
            : 503;
  const messages: Record<number, string> = {
    403: "Forbidden",
    404: "Record not found",
    400: "Invalid input",
    409: "This record changed. Refresh before trying again.",
    503: "Unable to save changes. Please retry.",
  };
  return NextResponse.json({ error: messages[status] }, { status });
}
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
