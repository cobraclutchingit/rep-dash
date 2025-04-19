import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/training/modules - Get all training modules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    
    // Build query filter
    const filters: any = {
      visibleToRoles: { has: session.user.role },
    };
    
    // Add position filter if user has a position
    if (session.user.position) {
      filters.visibleToPositions = { has: session.user.position };
    }
    
    // Add category filter if provided
    if (category) {
      filters.category = category;
    }
    
    // Add status filter if provided (published or draft)
    if (status === "published") {
      filters.isPublished = true;
    } else if (status === "draft") {
      filters.isPublished = false;
    }
    
    // Add search filter if provided
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Admin can see all modules, regular users only see published ones
    if (session.user.role !== "ADMIN") {
      filters.isPublished = true;
    }
    
    const modules = await prisma.trainingModule.findMany({
      where: filters,
      orderBy: [
        { category: "asc" },
        { order: "asc" },
      ],
      include: {
        sections: {
          select: {
            id: true,
            title: true,
            contentFormat: true,
            order: true,
            isOptional: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        progress: {
          where: { userId: session.user.id },
          select: {
            status: true,
            percentComplete: true,
            completedAt: true,
          },
        },
      },
    });
    
    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching training modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch training modules" },
      { status: 500 }
    );
  }
}

// POST /api/training/modules - Create a new training module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admins can create modules
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Requires admin privileges" },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Create the module
    const module = await prisma.trainingModule.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        order: data.order || 1,
        isRequired: data.isRequired || false,
        isPublished: data.isPublished || false,
        visibleToRoles: data.visibleToRoles || ["USER", "ADMIN"],
        visibleToPositions: data.visibleToPositions || [],
        estimatedDuration: data.estimatedDuration || null,
      },
    });
    
    // Create prerequisites if provided
    if (data.prerequisites && data.prerequisites.length > 0) {
      await Promise.all(
        data.prerequisites.map((prerequisiteId: string) =>
          prisma.trainingModulePrerequisite.create({
            data: {
              moduleId: module.id,
              prerequisiteId,
            },
          })
        )
      );
    }
    
    return NextResponse.json(module);
  } catch (error) {
    console.error("Error creating training module:", error);
    return NextResponse.json(
      { error: "Failed to create training module" },
      { status: 500 }
    );
  }
}