import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';  // 用於時間計算


const prisma = new PrismaClient();

// 這個 GET 函式現在只用來查詢「已存在的預約」，不再計算可預約時段
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: '必須提供日期' }, { status: 400 });
  }

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('查詢預約時發生錯誤:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}

// 這是最終版的 POST 函式，可以處理指定或不指定設計師的情況
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { customerName, customerPhone, startTime, designerId } = data; // designerId 現在是可選的

    if (!customerName || !customerPhone || !startTime) {
      return NextResponse.json({ error: '缺少姓名、電話或時間' }, { status: 400 });
    }
    
    const appointmentTime = new Date(startTime);
    let assignedDesignerId: string;

    if (designerId) {
      // --- 情況 1：使用者指定了設計師 ---
      assignedDesignerId = designerId;
    } else {
      // --- 情況 2：使用者未指定設計師，系統需要自動分配 ---
      const dayStart = new Date(appointmentTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(appointmentTime);
      dayEnd.setHours(23, 59, 59, 999);

      // 1. 找到在該時段有排班的所有設計師
      const scheduledDesigners = await prisma.schedule.findMany({
        where: {
          startTime: { lte: appointmentTime },
          endTime: { gte: addMinutes(appointmentTime, 30) }, // 假設理髮時間為30分鐘
        },
        select: { designerId: true },
      });
      const scheduledDesignerIds = scheduledDesigners.map(s => s.designerId);

      if (scheduledDesignerIds.length === 0) {
        return NextResponse.json({ error: '該時段沒有任何設計師可提供服務' }, { status: 409 });
      }

      // 2. 找到在該時段已被預約的設計師
      const bookedAppointments = await prisma.appointment.findMany({
        where: { startTime: appointmentTime },
        select: { designerId: true },
      });
      const bookedDesignerIds = new Set(bookedAppointments.map(a => a.designerId));

      // 3. 從有排班的設計師中，找出未被預約的
      const availableDesignerIds = scheduledDesignerIds.filter(id => !bookedDesignerIds.has(id));

      if (availableDesignerIds.length === 0) {
        return NextResponse.json({ error: '抱歉，該時段所有設計師都已被預約' }, { status: 409 });
      }

      // 4. 從可用的設計師中隨機選擇一位 (這裡為簡單起見，選擇第一位)
      assignedDesignerId = availableDesignerIds[0];
    }
    
    // --- 建立預約 ---
    const newAppointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        startTime: appointmentTime,
        designerId: assignedDesignerId,
      },
    });

    return NextResponse.json(newAppointment, { status: 201 });

  } catch (error) {
    console.error('建立預約時發生錯誤:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}