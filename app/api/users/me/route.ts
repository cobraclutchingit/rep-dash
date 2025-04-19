import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api/utils/api-handler";
import { createSuccessResponse } from "@/lib/api/utils/api-response";
import prisma from "@/lib/prisma";

export const GET = createApiHandler({
  GET: {
    auth: true,
    handler: async (req: NextRequest, { session }) => {
      // Fetch the current user's data
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
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

      return createSuccessResponse(user);
    },
  },
});