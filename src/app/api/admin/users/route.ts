import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 為一個已存在的設計師建立一個新的使用者帳號
export async function POST(request: Request) {
  try {
    const { designerId, email, password } = await request.json();

    if (!designerId || !email || !password) {
      return NextResponse.json({ error: '缺少必要資訊' }, { status: 400 });
    }

    // 檢查 email 是否已被使用
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: '這個 Email 已經被註冊了' }, { status: 409 });
    }

    // 檢查設計師是否已綁定帳號
    const designer = await prisma.designer.findUnique({ where: { id: designerId }});
    if (designer?.userId) {
         return NextResponse.json({ error: '這位設計師已經有帳號了' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.DESIGNER,
        // 直接在建立使用者時，就與設計師連結
        designer: {
          connect: { id: designerId },
        },
      },
    });

    return NextResponse.json({ message: '帳號建立成功', userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '建立帳號失敗' }, { status: 500 });
  }
}