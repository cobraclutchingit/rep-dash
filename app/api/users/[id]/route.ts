import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canEditUserProfile } from "@/lib/utils/permissions";

const prisma = new PrismaClient();

// Schema for profile update
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phoneNumber: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  territory: z.string().optional().nullable(),
  profileImageUrl: z.string().url("Profile image URL must be a valid URL").optional().nullable(),
});

// Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Check if user has permission to view this profile
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      // For regular users, they can only see limited information about other users
      // For admins, they can see everything
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          profileImageUrl: true,
          bio: true,
          isActive: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    }

    // If it's the user's own profile or an admin, return full details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        bio: true,
        startDate: true,
        territory: true,
        role: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Check if user has permission to edit this profile
    if (!canEditUserProfile(session, userId)) {
      return NextResponse.json(
        { message: "You don't have permission to edit this profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate the input
    const validatedData = profileUpdateSchema.parse(body);

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        bio: true,
        territory: true,
        position: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    
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