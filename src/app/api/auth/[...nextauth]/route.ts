import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // 從我們新的共用檔案引入

const handler = NextAuth(authOptions);
secret:process.env.SECRET
export { handler as GET, handler as POST };