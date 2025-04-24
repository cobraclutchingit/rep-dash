// '@auth/prisma-adapter' has compatibility issues with our version of next-auth
// For now, we'll use next-auth directly with Credentials auth strategy
import { PrismaClient, UserRole, SalesPosition } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Temporarly disable PrismaAdapter until version compatibility is resolved
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Return user with the exact type that next-auth User expects
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          // Use undefined instead of null for position to match User type
          position: user.position ?? undefined,
          image: user.profileImageUrl,
          isActive: user.isActive,
        } as User;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login',
    newUser: '/onboarding',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.user.position = token.position as SalesPosition | null;
        session.user.isActive = token.isActive;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.position = user.position;
        token.isActive = user.isActive;
      }

      if (trigger === 'update' && session?.user) {
        if (session.user.role) token.role = session.user.role as UserRole;
        if (session.user.position) token.position = session.user.position as SalesPosition | null;
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
        if (session.user.image) token.picture = session.user.image;
        if (session.user.isActive !== undefined) token.isActive = session.user.isActive;
      }

      return token;
    },
    async redirect({ url, baseUrl }) {
      // Handle string URLs
      if (typeof url === 'string' && url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Handle URL objects or external URLs
      const urlObj = typeof url === 'string' ? new URL(url, baseUrl) : url;
      if (urlObj.origin === baseUrl) {
        return urlObj.toString();
      }
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      console.warn(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.warn(`User signed out: ${token.email}`);
    },
  },
};
