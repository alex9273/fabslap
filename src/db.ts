import type { Env, SubmissionStatus } from "./types";

const MAX_IMAGE_BYTES = 900_000;

export function checkImageSize(bytes: ArrayBuffer): void {
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new HttpError(413, "Image too large (max ~900KB after compression)");
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getUserByUsername(db: D1Database, username: string) {
  return db
    .prepare("SELECT id, username, password, profile_picture_type FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number; username: string; password: string; profile_picture_type: string | null }>();
}

export async function getUserById(db: D1Database, id: number) {
  return db
    .prepare("SELECT id, username, profile_picture_type FROM users WHERE id = ?")
    .bind(id)
    .first<{ id: number; username: string; profile_picture_type: string | null }>();
}

export async function createUser(db: D1Database, username: string, password: string) {
  const existing = await getUserByUsername(db, username);
  if (existing) throw new HttpError(409, "Username already taken");
  const result = await db
    .prepare("INSERT INTO users (username, password) VALUES (?, ?) RETURNING id")
    .bind(username, password)
    .first<{ id: number }>();
  return result!.id;
}

export async function setProfilePicture(db: D1Database, userId: number, bytes: ArrayBuffer, type: string) {
  checkImageSize(bytes);
  await db
    .prepare("UPDATE users SET profile_picture = ?, profile_picture_type = ? WHERE id = ?")
    .bind(bytes, type, userId)
    .run();
}

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = randomToken();
  await db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").bind(token, userId).run();
  return token;
}

export async function getSessionUser(db: D1Database, token: string) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.profile_picture_type
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .bind(token)
    .first<{ id: number; username: string; profile_picture_type: string | null }>();
}

export async function deleteSession(db: D1Database, token: string) {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export interface ChallengeListItem {
  id: number;
  title: string;
  description: string | null;
  points: number;
  has_image: number;
  published_at: string;
  my_status: SubmissionStatus | null;
}

export async function listChallenges(
  db: D1Database,
  opts: { userId: number; sort: "date" | "points"; dir: "asc" | "desc"; offset: number; limit: number }
): Promise<ChallengeListItem[]> {
  const sortCol = opts.sort === "points" ? "c.points" : "c.published_at";
  const dir = opts.dir === "asc" ? "ASC" : "DESC";
  const { results } = await db
    .prepare(
      `SELECT c.id, c.title, c.description, c.points, (c.image IS NOT NULL) as has_image, c.published_at,
        (SELECT s.status FROM submissions s WHERE s.challenge_id = c.id AND s.user_id = ?
          ORDER BY s.submitted_at DESC, s.id DESC LIMIT 1) as my_status
       FROM challenges c
       ORDER BY ${sortCol} ${dir}, c.id ${dir}
       LIMIT ? OFFSET ?`
    )
    .bind(opts.userId, opts.limit, opts.offset)
    .all<ChallengeListItem>();
  return results;
}

export async function getChallenge(db: D1Database, id: number) {
  return db
    .prepare("SELECT id, title, description, points FROM challenges WHERE id = ?")
    .bind(id)
    .first<{ id: number; title: string; description: string | null; points: number }>();
}

export async function createChallenge(
  db: D1Database,
  data: { title: string; description: string | null; points: number; image: ArrayBuffer | null; imageType: string | null }
) {
  if (data.image) checkImageSize(data.image);
  const result = await db
    .prepare(
      "INSERT INTO challenges (title, description, points, image, image_type) VALUES (?, ?, ?, ?, ?) RETURNING id"
    )
    .bind(data.title, data.description, data.points, data.image, data.imageType)
    .first<{ id: number }>();
  return result!.id;
}

export interface AdminChallengeListItem {
  id: number;
  title: string;
  description: string | null;
  points: number;
  has_image: number;
  published_at: string;
}

export async function listAllChallenges(db: D1Database): Promise<AdminChallengeListItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, description, points, (image IS NOT NULL) as has_image, published_at
       FROM challenges
       ORDER BY published_at DESC, id DESC`
    )
    .all<AdminChallengeListItem>();
  return results;
}

export async function updateChallenge(
  db: D1Database,
  id: number,
  data: {
    title: string;
    description: string | null;
    points: number;
    image: ArrayBuffer | null;
    imageType: string | null;
    removeImage: boolean;
  }
) {
  if (data.image) checkImageSize(data.image);
  if (data.image) {
    await db
      .prepare("UPDATE challenges SET title = ?, description = ?, points = ?, image = ?, image_type = ? WHERE id = ?")
      .bind(data.title, data.description, data.points, data.image, data.imageType, id)
      .run();
  } else if (data.removeImage) {
    await db
      .prepare("UPDATE challenges SET title = ?, description = ?, points = ?, image = NULL, image_type = NULL WHERE id = ?")
      .bind(data.title, data.description, data.points, id)
      .run();
  } else {
    await db
      .prepare("UPDATE challenges SET title = ?, description = ?, points = ? WHERE id = ?")
      .bind(data.title, data.description, data.points, id)
      .run();
  }
}

export async function deleteChallenge(db: D1Database, id: number) {
  await db.prepare("DELETE FROM submissions WHERE challenge_id = ?").bind(id).run();
  await db.prepare("DELETE FROM challenges WHERE id = ?").bind(id).run();
}

export async function hasActiveSubmission(db: D1Database, userId: number, challengeId: number) {
  const row = await db
    .prepare(
      `SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ? AND status IN ('pending', 'accepted') LIMIT 1`
    )
    .bind(userId, challengeId)
    .first();
  return !!row;
}

export async function createSubmission(
  db: D1Database,
  data: { userId: number; challengeId: number; image: ArrayBuffer | null; imageType: string | null; note: string | null }
) {
  if (data.image) checkImageSize(data.image);
  const result = await db
    .prepare(
      "INSERT INTO submissions (user_id, challenge_id, image, image_type, note) VALUES (?, ?, ?, ?, ?) RETURNING id"
    )
    .bind(data.userId, data.challengeId, data.image, data.imageType, data.note)
    .first<{ id: number }>();
  return result!.id;
}

export interface LeaderboardRow {
  id: number;
  username: string;
  has_avatar: number;
  verified_points: number;
  pending_points: number;
}

export async function listLeaderboard(db: D1Database): Promise<LeaderboardRow[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.username, (u.profile_picture IS NOT NULL) as has_avatar,
        COALESCE(SUM(CASE WHEN s.status = 'accepted' THEN c.points ELSE 0 END), 0) as verified_points,
        COALESCE(SUM(CASE WHEN s.status = 'pending' THEN c.points ELSE 0 END), 0) as pending_points
       FROM users u
       LEFT JOIN submissions s ON s.user_id = u.id
       LEFT JOIN challenges c ON c.id = s.challenge_id
       GROUP BY u.id
       ORDER BY verified_points DESC, pending_points DESC, u.username ASC`
    )
    .all<LeaderboardRow>();
  return results;
}

export interface RecentSubmissionRow {
  id: number;
  status: SubmissionStatus;
  submitted_at: string;
  has_image: number;
  user_id: number;
  username: string;
  challenge_title: string;
  points: number;
}

export async function listRecentSubmissions(
  db: D1Database,
  opts: { offset: number; limit: number }
): Promise<RecentSubmissionRow[]> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.status, s.submitted_at, (s.image IS NOT NULL) as has_image,
        u.id as user_id, u.username, c.title as challenge_title, c.points
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       JOIN challenges c ON c.id = s.challenge_id
       ORDER BY s.submitted_at DESC, s.id DESC
       LIMIT ? OFFSET ?`
    )
    .bind(opts.limit, opts.offset)
    .all<RecentSubmissionRow>();
  return results;
}

export async function listPendingSubmissions(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.status, s.submitted_at, s.note, (s.image IS NOT NULL) as has_image,
        u.username, c.title as challenge_title, c.points
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       JOIN challenges c ON c.id = s.challenge_id
       WHERE s.status = 'pending'
       ORDER BY s.submitted_at ASC`
    )
    .all();
  return results;
}

export async function reviewSubmission(db: D1Database, id: number, status: "accepted" | "refused") {
  await db
    .prepare("UPDATE submissions SET status = ?, reviewed_at = datetime('now') WHERE id = ? AND status = 'pending'")
    .bind(status, id)
    .run();
}

export async function getSubmissionOwner(db: D1Database, id: number) {
  return db.prepare("SELECT id, user_id FROM submissions WHERE id = ?").bind(id).first<{ id: number; user_id: number }>();
}

export interface MySubmissionRow {
  id: number;
  status: SubmissionStatus;
  note: string | null;
  submitted_at: string;
  has_image: number;
  challenge_id: number;
  challenge_title: string;
  points: number;
}

export async function listSubmissionsForUser(db: D1Database, userId: number): Promise<MySubmissionRow[]> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.status, s.note, s.submitted_at, (s.image IS NOT NULL) as has_image,
        c.id as challenge_id, c.title as challenge_title, c.points
       FROM submissions s
       JOIN challenges c ON c.id = s.challenge_id
       WHERE s.user_id = ?
       ORDER BY s.submitted_at DESC, s.id DESC`
    )
    .bind(userId)
    .all<MySubmissionRow>();
  return results;
}

export async function updateSubmissionContent(
  db: D1Database,
  id: number,
  data: { image: ArrayBuffer | null; imageType: string | null; note: string | null; removeImage: boolean }
) {
  if (data.image) checkImageSize(data.image);
  if (data.image) {
    await db
      .prepare("UPDATE submissions SET image = ?, image_type = ?, note = ? WHERE id = ?")
      .bind(data.image, data.imageType, data.note, id)
      .run();
  } else if (data.removeImage) {
    await db
      .prepare("UPDATE submissions SET image = NULL, image_type = NULL, note = ? WHERE id = ?")
      .bind(data.note, id)
      .run();
  } else {
    await db.prepare("UPDATE submissions SET note = ? WHERE id = ?").bind(data.note, id).run();
  }
}

export async function deleteSubmissionById(db: D1Database, id: number) {
  await db.prepare("DELETE FROM submissions WHERE id = ?").bind(id).run();
}

const BLOB_TABLES: Record<string, { table: string; column: string; typeColumn: string }> = {
  users: { table: "users", column: "profile_picture", typeColumn: "profile_picture_type" },
  challenges: { table: "challenges", column: "image", typeColumn: "image_type" },
  submissions: { table: "submissions", column: "image", typeColumn: "image_type" },
};

export async function getBlob(db: D1Database, table: string, id: number) {
  const spec = BLOB_TABLES[table];
  if (!spec) return null;
  const row = await db
    .prepare(`SELECT ${spec.column} as data, ${spec.typeColumn} as type FROM ${spec.table} WHERE id = ?`)
    .bind(id)
    .first<{ data: ArrayBuffer | null; type: string | null }>();
  if (!row || !row.data) return null;
  return { data: row.data, type: row.type || "application/octet-stream" };
}
