import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");

  if (!code) {
    url.pathname = "/login";
    url.searchParams.set("error", "auth");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    url.pathname = "/login";
    url.searchParams.set("error", "auth");
    return NextResponse.redirect(url);
  }

  url.pathname = "/dashboard";
  url.searchParams.delete("code");
  return NextResponse.redirect(url);
}

