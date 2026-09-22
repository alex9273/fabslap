import type { Env } from "./types";
import {
  HttpError,
  createChallenge,
  deleteChallenge,
  deleteSubmissionById,
  listAllChallenges,
  listPendingSubmissions,
  reviewSubmission,
  updateChallenge,
} from "./db";
import { json, errorResponse, readImageField, requireString } from "./http";
import { adminCookieHeader, clearAdminCookieHeader, isAdmin, makeAdminToken } from "./session";

function parseChallengeFields(form: FormData): { title: string; description: string | null; points: number } {
  const title = requireString(form, "title", { required: true })!;
  const description = requireString(form, "description");
  const pointsStr = requireString(form, "points", { required: true })!;
  const points = parseInt(pointsStr, 10);
  if (!Number.isFinite(points) || points < 0) throw new HttpError(400, "points must be a non-negative number");
  return { title, description, points };
}

export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ password?: string }>();
    if (body.password !== env.ADMIN_PASSWORD) throw new HttpError(401, "Wrong password");
    const token = await makeAdminToken(env);
    return json({ ok: true }, 200, { "Set-Cookie": adminCookieHeader(token) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminLogout(): Promise<Response> {
  return json({ ok: true }, 200, { "Set-Cookie": clearAdminCookieHeader() });
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  if (!(await isAdmin(request, env))) throw new HttpError(401, "Admin login required");
}

export async function handleAdminMe(request: Request, env: Env): Promise<Response> {
  return json({ isAdmin: await isAdmin(request, env) });
}

export async function handleAdminPendingSubmissions(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const submissions = await listPendingSubmissions(env.DB);
    return json({ submissions });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminReviewSubmission(request: Request, env: Env, id: number): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const body = await request.json<{ action?: string }>();
    if (body.action !== "accept" && body.action !== "refuse") throw new HttpError(400, "action must be accept or refuse");
    await reviewSubmission(env.DB, id, body.action === "accept" ? "accepted" : "refused");
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminDeleteSubmission(request: Request, env: Env, id: number): Promise<Response> {
  try {
    await requireAdmin(request, env);
    await deleteSubmissionById(env.DB, id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminCreateChallenge(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const form = await request.formData();
    const { title, description, points } = parseChallengeFields(form);
    const image = await readImageField(form, "image");
    const id = await createChallenge(env.DB, {
      title,
      description,
      points,
      image: image?.bytes ?? null,
      imageType: image?.type ?? null,
    });
    return json({ id }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminListChallenges(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const challenges = await listAllChallenges(env.DB);
    return json({ challenges });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminUpdateChallenge(request: Request, env: Env, id: number): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const form = await request.formData();
    const { title, description, points } = parseChallengeFields(form);
    const image = await readImageField(form, "image");
    const removeImage = requireString(form, "removeImage") === "true";
    await updateChallenge(env.DB, id, {
      title,
      description,
      points,
      image: image?.bytes ?? null,
      imageType: image?.type ?? null,
      removeImage,
    });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleAdminDeleteChallenge(request: Request, env: Env, id: number): Promise<Response> {
  try {
    await requireAdmin(request, env);
    await deleteChallenge(env.DB, id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
