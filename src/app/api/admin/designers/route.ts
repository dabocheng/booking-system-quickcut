import { NextResponse } from 'next/server';

export async function GET() {
  // 這一步將會把伺服器所有的環境變數都打印到日誌中
  console.log("--- START: All Environment Variables ---");
  console.log(process.env);
  console.log("--- END: All Environment Variables ---");

  // 我們可以直接從這裡檢查 DATABASE_URL 和 NEXTAUTH_SECRET
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
  
  // 回傳一個簡單的訊息，告訴我們診斷已執行
  return NextResponse.json({ 
    message: "Diagnostics executed. Please check CloudWatch logs.",
    databaseUrlSet: !!process.env.DATABASE_URL,
    nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET
  });
}