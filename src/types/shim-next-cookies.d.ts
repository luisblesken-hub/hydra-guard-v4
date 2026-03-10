declare module "next/server" {
  interface ResponseCookies {
    // Broaden delete signature so existing calls with (name, options)
    // type-check, even if options are unused at runtime.
    delete(name: string, options?: any): void;
  }
}

