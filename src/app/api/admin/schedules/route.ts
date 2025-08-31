import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 新增一個班表 (設計師的可預約時段)
export async function POST(request: Request) {
  const { designerId, startTime, endTime } = await request.json();
  if (!designerId || !startTime || !endTime) {
    return NextResponse.json({ error: '缺少必要資訊' }, { status: 400 });
  }
  const newSchedule = await prisma.schedule.create({
    data: {
      designerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });
  return NextResponse.json(newSchedule, { status: 201 });
}