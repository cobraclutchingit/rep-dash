import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }
  
  // Redirect unauthenticated users to login page
  redirect("/auth/login");
}