import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const adminEmail = 'rusenj@gmail.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: '管理員帳號已存在' }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash('shzzDabo!', 10); // 請務必更換成一個更安全的密碼

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    return NextResponse.json({ message: '管理員帳號建立成功', user: adminUser }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '建立管理員失敗' }, { status: 500 });
  }
}