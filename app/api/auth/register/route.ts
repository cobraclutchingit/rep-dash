import { PrismaClient, SalesPosition, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();

const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  position: z.enum([
    SalesPosition.JUNIOR_EC,
    SalesPosition.ENERGY_CONSULTANT,
    SalesPosition.ENERGY_SPECIALIST,
    SalesPosition.MANAGER,
  ]),
  phoneNumber: z.string().optional(),
  fullName: z.string().optional(),
  bio: z.string().optional(),
  territory: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password: rawPassword,
      position,
      phoneNumber,
      fullName,
      bio,
      territory,
    } = userSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const startDate = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        fullName: fullName || name,
        email,
        password: hashedPassword,
        phoneNumber,
        position,
        role: UserRole.USER,
        startDate,
        bio,
        territory,
        isActive: true,
      },
    });

    // Exclude password from the response
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
