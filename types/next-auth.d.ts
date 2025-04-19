import { SalesPosition, UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    position?: SalesPosition;
    isActive: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      position?: string;
      isActive: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    position?: string;
    isActive: boolean;
  }
}