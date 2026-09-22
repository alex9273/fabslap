import type { Env } from "./types";
import { HttpError } from "./db";
import {
  createSession,
  createSubmission,
  createUser,
  deleteSession,
  deleteSubmissionById,
  getChallenge,
  getSubmissionOwner,
  getUserByUsername,
  hasActiveSubmission,
  listChallenges,
  listLeaderboard,
  listRecentSubmissions,
  listSubmissionsForUser,
  setProfilePicture,
  updateSubmissionContent,
} from "./db";
import { json, errorResponse, readImageField, requireString } from "./http";
import { clearSessionCookieHeader, currentSessionToken, currentUser, sessionCookieHeader } from "./session";

function meJson(user: { id: number; username: string; profile_picture_type: string | null }) {
  return { id: user.id, username: user.username, has_avatar: !!user.profile_picture_type };
}

export async function handleSignup(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ username?: string; password?: string }>();
    const username = (body.username ?? "").trim();
    const password = body.password ?? "";
    if (!username || !password) throw new HttpError(400, "Username and password are required");
    const userId = await createUser(env.DB, username, password);
    const token = await createSession(env.DB, userId);
    return json({ id: userId, username }, 201, { "Set-Cookie": sessionCookieHeader(token) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ username?: string; password?: string }>();
    const username = (body.username ?? "").trim();
    const password = body.password ?? "";
    const user = await getUserByUsername(env.DB, username);
    if (!user || user.password !== password) throw new HttpError(401, "Invalid username or password");
    const token = await createSession(env.DB, user.id);
    return json(
      { id: user.id, username: user.username, has_avatar: !!user.profile_picture_type },
      200,
      { "Set-Cookie": sessionCookieHeader(token) }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const token = currentSessionToken(request);
  if (token) await deleteSession(env.DB, token);
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader() });
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not logged in" }, 401);
  return json(meJson(user));
}

export async function handleUpdateProfile(request: Request, env: Env): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (!user) throw new HttpError(401, "Not logged in");
    const form = await request.formData();
    const image = await readImageField(form, "picture");
    if (image) await setProfilePicture(env.DB, user.id, image.bytes, image.type);
    return json({ ok: true, has_avatar: !!image || !!user.profile_picture_type });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleListChallenges(request: Request, env: Env): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (!user) throw new HttpError(401, "Not logged in");
    const url = new URL(request.url);
    const sort = url.searchParams.get("sort") === "points" ? "points" : "date";
    const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
    const offset = Math.max(0, parseInt(url.searchParams.get("cursor") ?? "0", 10) || 0);
    const limit = 20;
    const rows = await listChallenges(env.DB, { userId: user.id, sort, dir, offset, limit });
    const nextCursor = rows.length === limit ? String(offset + limit) : null;
    return json({ challenges: rows, nextCursor });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleCreateSubmission(request: Request, env: Env, challengeId: number): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (!user) throw new HttpError(401, "Not logged in");
    const challenge = await getChallenge(env.DB, challengeId);
    if (!challenge) throw new HttpError(404, "Challenge not found");
    if (await hasActiveSubmission(env.DB, user.id, challengeId)) {
      throw new HttpError(409, "You already have a pending or accepted submission for this challenge");
    }
    const form = await request.formData();
    const image = await readImageField(form, "image");
    const note = requireString(form, "note");
    const id = await createSubmission(env.DB, {
      userId: user.id,
      challengeId,
      image: image?.bytes ?? null,
      imageType: image?.type ?? null,
      note,
    });
    return json({ id, status: "pending" }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleLeaderboard(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not logged in" }, 401);
  const rows = await listLeaderboard(env.DB);
  return json({ leaderboard: rows });
}

export async function handleRecentSubmissions(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not logged in" }, 401);
  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("cursor") ?? "0", 10) || 0);
  const limit = 30;
  const rows = await listRecentSubmissions(env.DB, { offset, limit });
  const nextCursor = rows.length === limit ? String(offset + limit) : null;
  return json({ submissions: rows, nextCursor });
}

export async function handleListMySubmissions(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not logged in" }, 401);
  const submissions = await listSubmissionsForUser(env.DB, user.id);
  return json({ submissions });
}

async function requireOwnSubmission(env: Env, userId: number, submissionId: number): Promise<void> {
  const owner = await getSubmissionOwner(env.DB, submissionId);
  if (!owner) throw new HttpError(404, "Submission not found");
  if (owner.user_id !== userId) throw new HttpError(403, "You can only manage your own submissions");
}

export async function handleUpdateSubmission(request: Request, env: Env, id: number): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (!user) throw new HttpError(401, "Not logged in");
    await requireOwnSubmission(env, user.id, id);
    const form = await request.formData();
    const image = await readImageField(form, "image");
    const note = requireString(form, "note");
    const removeImage = requireString(form, "removeImage") === "true";
    await updateSubmissionContent(env.DB, id, {
      image: image?.bytes ?? null,
      imageType: image?.type ?? null,
      note,
      removeImage,
    });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleDeleteSubmission(request: Request, env: Env, id: number): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (!user) throw new HttpError(401, "Not logged in");
    await requireOwnSubmission(env, user.id, id);
    await deleteSubmissionById(env.DB, id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
