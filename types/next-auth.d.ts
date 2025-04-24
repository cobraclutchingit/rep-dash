import { SalesPosition, UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
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
      role: UserRole;
      position?: SalesPosition | null;
      isActive: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    position?: SalesPosition | null;
    isActive: boolean;
  }
}
