import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "bm_sid";

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(COOKIE)?.value;
  const sid = existing ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-bm-sid", sid);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  if (!existing) {
    response.cookies.set(COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:jpg|jpeg|png|webp|svg|ico|otf|txt|woff2)$).*)",
  ],
};
