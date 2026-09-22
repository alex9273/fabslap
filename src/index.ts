import type { Env } from "./types";
import { SHELL_HTML } from "./html";
import { handleImage } from "./images";
import {
  handleCreateSubmission,
  handleDeleteSubmission,
  handleLeaderboard,
  handleListChallenges,
  handleListMySubmissions,
  handleLogin,
  handleLogout,
  handleMe,
  handleRecentSubmissions,
  handleSignup,
  handleUpdateProfile,
  handleUpdateSubmission,
} from "./api";
import {
  handleAdminCreateChallenge,
  handleAdminDeleteChallenge,
  handleAdminDeleteSubmission,
  handleAdminListChallenges,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminMe,
  handleAdminPendingSubmissions,
  handleAdminReviewSubmission,
  handleAdminUpdateChallenge,
} from "./admin";

const SHELL_ROUTES = new Set(["/", "/challenges", "/leaderboard", "/submissions", "/profile", "/admin"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Static app shell (client-side router takes it from here).
    if (method === "GET" && SHELL_ROUTES.has(pathname)) {
      return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    // Blob-backed images: /images/:table/:id
    const imageMatch = pathname.match(/^\/images\/(users|challenges|submissions)\/(\d+)$/);
    if (method === "GET" && imageMatch) {
      return handleImage(env, imageMatch[1], imageMatch[2]);
    }

    // User-facing API
    if (pathname === "/api/signup" && method === "POST") return handleSignup(request, env);
    if (pathname === "/api/login" && method === "POST") return handleLogin(request, env);
    if (pathname === "/api/logout" && method === "POST") return handleLogout(request, env);
    if (pathname === "/api/me" && method === "GET") return handleMe(request, env);
    if (pathname === "/api/profile" && method === "PATCH") return handleUpdateProfile(request, env);
    if (pathname === "/api/challenges" && method === "GET") return handleListChallenges(request, env);
    if (pathname === "/api/leaderboard" && method === "GET") return handleLeaderboard(request, env);
    if (pathname === "/api/submissions/recent" && method === "GET") return handleRecentSubmissions(request, env);
    if (pathname === "/api/submissions/mine" && method === "GET") return handleListMySubmissions(request, env);

    const submissionMatch = pathname.match(/^\/api\/challenges\/(\d+)\/submissions$/);
    if (submissionMatch && method === "POST") {
      return handleCreateSubmission(request, env, parseInt(submissionMatch[1], 10));
    }

    const mySubmissionMatch = pathname.match(/^\/api\/submissions\/(\d+)$/);
    if (mySubmissionMatch && method === "PATCH") {
      return handleUpdateSubmission(request, env, parseInt(mySubmissionMatch[1], 10));
    }
    if (mySubmissionMatch && method === "DELETE") {
      return handleDeleteSubmission(request, env, parseInt(mySubmissionMatch[1], 10));
    }

    // Admin
    if (pathname === "/admin/login" && method === "POST") return handleAdminLogin(request, env);
    if (pathname === "/admin/logout" && method === "POST") return handleAdminLogout();
    if (pathname === "/admin/api/me" && method === "GET") return handleAdminMe(request, env);
    if (pathname === "/admin/api/submissions" && method === "GET") return handleAdminPendingSubmissions(request, env);
    if (pathname === "/admin/api/challenges" && method === "GET") return handleAdminListChallenges(request, env);
    if (pathname === "/admin/api/challenges" && method === "POST") return handleAdminCreateChallenge(request, env);

    const reviewMatch = pathname.match(/^\/admin\/api\/submissions\/(\d+)\/review$/);
    if (reviewMatch && method === "POST") {
      return handleAdminReviewSubmission(request, env, parseInt(reviewMatch[1], 10));
    }

    const adminSubmissionMatch = pathname.match(/^\/admin\/api\/submissions\/(\d+)$/);
    if (adminSubmissionMatch && method === "DELETE") {
      return handleAdminDeleteSubmission(request, env, parseInt(adminSubmissionMatch[1], 10));
    }

    const adminChallengeMatch = pathname.match(/^\/admin\/api\/challenges\/(\d+)$/);
    if (adminChallengeMatch && method === "PATCH") {
      return handleAdminUpdateChallenge(request, env, parseInt(adminChallengeMatch[1], 10));
    }
    if (adminChallengeMatch && method === "DELETE") {
      return handleAdminDeleteChallenge(request, env, parseInt(adminChallengeMatch[1], 10));
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
