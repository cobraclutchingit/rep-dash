import { PrismaClient, SalesPosition, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();

const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  position: z.enum(["JUNIOR_EC", "ENERGY_CONSULTANT", "ENERGY_SPECIALIST", "MANAGER"]),
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
      password, 
      position, 
      phoneNumber, 
      fullName, 
      bio, 
      territory 
    } = userSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const startDate = new Date();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        fullName: fullName || name,
        email,
        password: hashedPassword,
        phoneNumber,
        position: position as SalesPosition,
        role: "USER" as UserRole, // Default role
        startDate,
        bio,
        territory,
        isActive: true,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { user: userWithoutPassword, message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      
      return NextResponse.json(
        { message: "Validation error", errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}