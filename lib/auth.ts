import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, UserRole, SalesPosition } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Track the login date
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          position: user.position,
          image: user.profileImageUrl,
          isActive: user.isActive
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/onboarding"
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.position = token.position as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.position = user.position;
        token.isActive = user.isActive;
      }
      
      // Handle updates to the user session data
      if (trigger === "update" && session) {
        if (session.user?.role) token.role = session.user.role;
        if (session.user?.position) token.position = session.user.position;
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.email) token.email = session.user.email;
        if (session.user?.image) token.picture = session.user.image;
        if (session.user?.isActive !== undefined) token.isActive = session.user.isActive;
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async signIn({ user }) {
      // You could add any post sign-in logic here, like logging
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      // Any cleanup to do on sign out
      console.log(`User signed out: ${token.email}`);
    }
  }
};