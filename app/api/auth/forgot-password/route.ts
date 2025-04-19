import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const prisma = new PrismaClient();

// Define the request schema
const requestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If no user found, still return success (security)
    if (!user) {
      // For security, don't reveal which emails exist in our database
      return NextResponse.json(
        { message: "Password reset instructions sent if email exists" },
        { status: 200 }
      );
    }

    // Generate a reset token and expiry date (24 hours from now)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store the reset token and expiry in the database
    // Note: In a real application, you'd create a separate PasswordReset model
    // For this example, we're storing directly on the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Send email with reset link
    // In a real application, you would integrate with an email service here
    console.log(`Password reset link: ${resetUrl}`);

    // Return success response
    return NextResponse.json(
      { message: "Password reset instructions sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    
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