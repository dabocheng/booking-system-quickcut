import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMinutes, format, eachMinuteOfInterval, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // YYYY-MM-DD
  const designerId = searchParams.get('designerId');

  if (!date) {
    return NextResponse.json({ error: '必須提供日期' }, { status: 400 });
  }

  try {
    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));

    // Case 1: A specific designer is selected
    if (designerId) {
      const schedules = await prisma.schedule.findMany({
        where: { designerId, startTime: { lte: dayEnd }, endTime: { gte: dayStart } },
      });
      const appointments = await prisma.appointment.findMany({
        where: { designerId, startTime: { gte: dayStart, lt: dayEnd } },
      });
      const bookedTimes = new Set(appointments.map(apt => format(apt.startTime, 'HH:mm')));
      
      const allPossibleSlots = new Set<string>();
      schedules.forEach(schedule => {
        let currentTime = schedule.startTime > dayStart ? schedule.startTime : dayStart;
        while (currentTime < schedule.endTime) {
          allPossibleSlots.add(format(currentTime, 'HH:mm'));
          currentTime = addMinutes(currentTime, 30);
        }
      });

      const availableSlots = Array.from(allPossibleSlots).filter(slot => !bookedTimes.has(slot));
      availableSlots.sort();
      return NextResponse.json(availableSlots);
    }

    // Case 2: No designer is specified (Refactored Logic)
    else {
      const allSchedules = await prisma.schedule.findMany({
        where: { startTime: { lte: dayEnd }, endTime: { gte: dayStart } },
      });
      const allAppointments = await prisma.appointment.findMany({
        where: { startTime: { gte: dayStart, lt: dayEnd } },
      });

      const slotCapacity = new Map<string, number>();
      allSchedules.forEach(schedule => {
        const intervals = eachMinuteOfInterval({
          start: schedule.startTime > dayStart ? schedule.startTime : dayStart,
          end: schedule.endTime,
        }, { step: 30 });
        
        intervals.forEach(slotTime => {
            if (slotTime < schedule.endTime) {
                const timeKey = format(slotTime, 'HH:mm');
                slotCapacity.set(timeKey, (slotCapacity.get(timeKey) || 0) + 1);
            }
        });
      });
      
      const slotBookedCount = new Map<string, number>();
      allAppointments.forEach(apt => {
        const timeKey = format(apt.startTime, 'HH:mm');
        slotBookedCount.set(timeKey, (slotBookedCount.get(timeKey) || 0) + 1);
      });
      
      const availableSlots: string[] = [];
      // === KEY CORRECTION: Use .forEach() instead of for...of ===
      slotCapacity.forEach((capacity, time) => {
        const bookedCount = slotBookedCount.get(time) || 0;
        if (capacity > bookedCount) {
          availableSlots.push(time);
        }
      });

      availableSlots.sort();
      return NextResponse.json(availableSlots);
    }

  } catch (error) {
    console.error('查詢可預約時段出錯:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}