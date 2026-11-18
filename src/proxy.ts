import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Bypass auth proxy completely for background Web Push API & Service Workers
  
  if (
    pathname.startsWith("/api/push") ||
    pathname.startsWith("/moonday-sw.js") ||
    pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const persistentMaxAge = 60 * 60 * 24 * 60; // 60 days in seconds

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Keep 60-day persistence unless Supabase is deleting the cookie (maxAge: 0)

              maxAge: options?.maxAge === 0 ? 0 : persistentMaxAge,
            }),
          );
        },
      },
    },
  );

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth");

  // 2. Only call getUser() if the browser actually sent sb-* cookies

  const sbCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-"));

  let user = null;

  if (sbCookies.length > 0) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;

      } else {

        // Auto-heal: wipe corrupted or expired sb-* cookie chunks from the browser

        sbCookies.forEach((cookie) => {
          request.cookies.delete(cookie.name);
          supabaseResponse.cookies.delete(cookie.name);
        });
      }
    } catch {
      sbCookies.forEach((cookie) => {
        request.cookies.delete(cookie.name);
        supabaseResponse.cookies.delete(cookie.name);
      });
    }
  }

  // 3. If user is NOT logged in and visits a protected route, redirect to /login AND attach cookie deletions

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);

    // Copy any cleared/deleted sb-* cookies onto the redirect response so the browser purges them

    sbCookies.forEach((cookie) => {
      redirectResponse.cookies.delete(cookie.name);
    });

    return redirectResponse;
  }

  // 4. If user IS logged in and visits /login or /signup, redirect to dashboard ("/")

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico, manifest.json
     * - moonday-sw.js, sw.js, workbox-*.js (Service Workers)
     * - api/push (Background Web Push daemon endpoint)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|moonday-sw\\.js|sw\\.js|api/push|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
