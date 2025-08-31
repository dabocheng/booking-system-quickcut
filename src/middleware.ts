// src/middleware.ts
export { default } from "next-auth/middleware"

// 設定這個 middleware 要保護哪些路徑
export const config = { 
  matcher: ["/admin/:path*"] 
};