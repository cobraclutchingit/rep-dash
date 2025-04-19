import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api/utils/api-handler";
import { createSuccessResponse } from "@/lib/api/utils/api-response";
import { filterSchema } from "@/lib/api/validators/common-validators";
import prisma from "@/lib/prisma";
import { canManageUsers } from "@/lib/utils/permissions";

export const GET = createApiHandler({
  GET: {
    auth: true,
    handler: async (req: NextRequest, { session }) => {
      // Parse query params
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
      const role = url.searchParams.get("role");
      const position = url.searchParams.get("position");
      const isActive = url.searchParams.has("isActive") 
        ? url.searchParams.get("isActive") === "true" 
        : undefined;
      const search = url.searchParams.get("search");
      
      // Base query
      const where: any = {};
      
      // Add filters
      if (role) where.role = role;
      if (position) where.position = position;
      if (isActive !== undefined) where.isActive = isActive;
      
      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
        ];
      }
      
      // Restrict visibility based on user role
      if (!canManageUsers(session)) {
        // Regular users can only see active users
        where.isActive = true;
      }
      
      // Get total count
      const totalCount = await prisma.user.count({ where });
      
      // Calculate pagination values
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Get users
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          fullName: true,
          phoneNumber: canManageUsers(session),
          profileImageUrl: true,
          bio: true,
          startDate: true,
          territory: true,
          role: true,
          position: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: canManageUsers(session),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });
      
      return createSuccessResponse(
        { users, totalCount, totalPages },
        200,
        { page, pageSize, totalCount, totalPages }
      );
    },
  },
});