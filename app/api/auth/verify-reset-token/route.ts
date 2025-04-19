import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

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

    // Token is valid
    return NextResponse.json(
      { message: "Token is valid" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify reset token error:", error);
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}