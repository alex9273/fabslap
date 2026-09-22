import { HttpError } from "./db";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  console.error(err);
  return json({ error: "Internal error" }, 500);
}

export async function readImageField(
  form: FormData,
  field: string
): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const file = form.get(field);
  if (!file || !(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new HttpError(400, "Uploaded file must be an image");
  }
  return { bytes: await file.arrayBuffer(), type: file.type };
}

export function requireString(form: FormData, field: string, opts: { required?: boolean } = {}): string | null {
  const value = form.get(field);
  if (value === null || typeof value !== "string" || value.trim() === "") {
    if (opts.required) throw new HttpError(400, `Missing field: ${field}`);
    return null;
  }
  return value.trim();
}
