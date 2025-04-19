import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageOnboarding } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

// GET /api/onboarding/resources
// Get all resources
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to access resources" },
        { status: 403 }
      );
    }

    const resources = await prisma.resource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/resources
// Create a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create resources" },
        { status: 403 }
      );
    }

    const { title, description, type, url, isExternal } = await request.json();

    // Validate required fields
    if (!title || !type || !url) {
      return NextResponse.json(
        { error: "Title, type, and URL are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        url,
        isExternal: isExternal !== undefined ? isExternal : true,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}