import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/training/resources/view?url=... - Proxy/view training resources
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const url = request.nextUrl.searchParams.get("url");
    
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }
    
    // In a production application, you would implement:
    // 1. Security checks to verify the resource is allowed
    // 2. Authentication token passing for secured resources
    // 3. Proxying content from storage like S3, GCS, etc.
    // 4. Tracking access for analytics
    
    // For this example, we'll verify the resource exists in our database
    const resource = await prisma.resource.findFirst({
      where: {
        url,
        OR: [
          {
            trainingSections: {
              some: {
                module: {
                  visibleToRoles: { has: session.user.role },
                  ...(session.user.position && {
                    visibleToPositions: { has: session.user.position },
                  }),
                },
              },
            },
          },
          {
            onboardingSteps: {
              some: {
                track: {
                  ...(session.user.position && {
                    forPositions: { has: session.user.position },
                  }),
                },
              },
            },
          },
        ],
      },
    });
    
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }
    
    // For simplicity in this example, we'll redirect to the actual resource
    // In production, you would stream the content or provide a time-limited secure URL
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error accessing resource:", error);
    return NextResponse.json(
      { error: "Failed to access resource" },
      { status: 500 }
    );
  }
}