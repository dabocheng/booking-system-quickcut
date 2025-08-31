// src/app/api/admin/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns'; // 關鍵修正：從 date-fns 引入

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: '必須提供日期' }, { status: 400 });
  }

  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        designer: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('查詢每日預約時發生錯誤:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}

// 注意：這個 POST 函式是給客戶預約頁面用的，我們在另一個檔案中修正了它。
// 為了避免混淆，我們暫時把它註解掉，因為這個檔案只應該處理 /api/admin/appointments 的 GET 請求。
/*
export async function POST(request: Request) {
  // ... 舊的 POST 邏輯 ...
}
*/