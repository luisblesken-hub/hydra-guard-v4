import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Supabase-Middleware für Session-Refresh und Basis-Auth-Gate.

const PUBLIC_PATHS = ["/", "/login", "/signup", "/invite", "/melden"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.startsWith("/api/melden/")) return true;
  if (pathname.startsWith("/melden/")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (isPublicPath(url.pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use modern getAll/setAll API so cookie options (httpOnly/secure/sameSite/maxAge) are preserved.
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options: any }[]) {
          cookies.forEach(({ name, value, options }) => {
            // Best-effort: also update request cookies so subsequent reads in the same execution see changes.
            (req.cookies as any)?.set?.(name, value, options);

            // Always set on the response (this is what persists to the browser).
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

