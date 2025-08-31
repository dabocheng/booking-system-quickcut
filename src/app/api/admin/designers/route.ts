import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  const designers = await prisma.designer.findMany();
  return NextResponse.json(designers);
}

// 新增一位設計師
export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: '必須提供姓名' }, { status: 400 });
  }
  const newDesigner = await prisma.designer.create({
    data: { name },
  });
  return NextResponse.json(newDesigner, { status: 201 });
}