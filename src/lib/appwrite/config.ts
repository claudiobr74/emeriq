export const SESSION_COOKIE = "emeriq_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
};
