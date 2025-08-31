import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

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

    const schedules = await prisma.schedule.findMany({
      where: {
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        designer: { 
          include: { 
            appointments: {
              where: {
                startTime: {
                  gte: startDate,
                  lt: endDate,
                },
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('查詢排班時發生錯誤:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}