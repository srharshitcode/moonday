import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
          const persistentMaxAge = 60 * 60 * 24 * 60;

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
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

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    sbCookies.forEach((cookie) => {
      redirectResponse.cookies.delete(cookie.name);
    });
    return redirectResponse;
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
