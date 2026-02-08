import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPaths = ["/dashboard", "/shipments", "/admin"]; 

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {}
      }
    }
  );

  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/shipments/:path*", "/admin/:path*"]
};
