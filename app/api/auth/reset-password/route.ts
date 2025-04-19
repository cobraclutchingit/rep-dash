import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Define the request schema
const requestSchema = z.object({
  token: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = requestSchema.parse(body);

    // Find user with this token and check if it's valid (not expired)
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token expiry must be greater than current time
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        lastLoginAt: new Date(), // Update last login time
      },
    });

    // Return success response
    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    
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