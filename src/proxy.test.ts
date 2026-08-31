import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, "http://localhost"), { headers });
}

describe("auth proxy", () => {
  it("allows /login and /api/health without a session", () => {
    expect(proxy(request("/login")).status).toBe(200);
    expect(proxy(request("/api/health")).status).toBe(200);
  });

  it("redirects pages without a session to /login", () => {
    const res = proxy(request("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("returns 401 for protected APIs without a session", () => {
    const res = proxy(request("/api/consultations/active"));
    expect(res.status).toBe(401);
  });

  it("lets a request with a session cookie through", () => {
    const res = proxy(request("/", "emeriq_session=abc"));
    expect(res.status).toBe(200);
  });

  it("allows /recuperar without a session", () => {
    expect(proxy(request("/recuperar")).status).toBe(200);
  });

  it("does not redirect /login to / when a cookie is present", () => {
    const res = proxy(request("/login", "emeriq_session=abc"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
