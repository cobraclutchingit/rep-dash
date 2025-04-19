import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcrypt";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Schema for password change request
const passwordChangeSchema = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, currentPassword, newPassword } = passwordChangeSchema.parse(body);

    // Verify that the user is changing their own password or is an admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to change this password" },
        { status: 403 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Verify the current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Return success response
    return NextResponse.json(
      { message: "Password has been changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    
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