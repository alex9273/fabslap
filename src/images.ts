import type { Env } from "./types";
import { getBlob } from "./db";

export async function handleImage(env: Env, table: string, idStr: string): Promise<Response> {
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return new Response("Not found", { status: 404 });
  const blob = await getBlob(env.DB, table, id);
  if (!blob) return new Response("Not found", { status: 404 });
  // D1 hands back BLOB columns as an array-like of byte values rather than a
  // real ArrayBuffer/Uint8Array; normalize before using it as a response body.
  const bytes = new Uint8Array(blob.data as unknown as ArrayLike<number>);
  return new Response(bytes, {
    headers: {
      "content-type": blob.type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
