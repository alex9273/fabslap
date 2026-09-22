export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

export interface UserRow {
  id: number;
  username: string;
  password: string;
  profile_picture: ArrayBuffer | null;
  profile_picture_type: string | null;
  created_at: string;
}

export interface ChallengeRow {
  id: number;
  title: string;
  description: string | null;
  points: number;
  image: ArrayBuffer | null;
  image_type: string | null;
  published_at: string;
  created_at: string;
}

export type SubmissionStatus = "pending" | "accepted" | "refused";

export interface SubmissionRow {
  id: number;
  user_id: number;
  challenge_id: number;
  status: SubmissionStatus;
  image: ArrayBuffer | null;
  image_type: string | null;
  note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}
