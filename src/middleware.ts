import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Force the cookie to live for 60 days (60 * 60 * 24 * 60 seconds)
          const persistentOptions = {
            ...options,
            maxAge: 60 * 60 * 24 * 60,
          };

          // Update the request cookie
          request.cookies.set({ name, value, ...persistentOptions });

          // Update the response cookie (so the browser saves it)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...persistentOptions });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // This single call forces Supabase to read the cookie, validate it,
  // and silently refresh it if it is close to expiring.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional Route Protection:
  // If the user isn't logged in and is trying to access a private route (like /dashboard),
  // redirect them to the login page.
  if (
    !user &&
    request.nextUrl.pathname !== "/login" &&
    request.nextUrl.pathname !== "/"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user IS logged in and tries to go to /login, redirect to dashboard
  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

// Tell Next.js exactly which routes to run this middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA public files)
     * - sw.js, workbox-*.js (PWA service workers)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};