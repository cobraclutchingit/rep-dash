import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canManageLeaderboards } from "@/lib/utils/permissions";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Leaderboard Management | Sales Rep Dashboard",
  description: "Manage sales leaderboards and rankings",
};

export default async function LeaderboardAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has permission to manage leaderboards
  if (!canManageLeaderboards(session)) {
    redirect("/leaderboard");
  }
  
  // Get all leaderboards
  const leaderboards = await prisma.leaderboard.findMany({
    include: {
      _count: {
        select: {
          entries: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  
  // Format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leaderboard Management</h1>
        <Link 
          href="/leaderboard/admin/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create Leaderboard
        </Link>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
        {leaderboards.length === 0 ? (
          <div className="text-center p-12">
            <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center text-2xl mb-4">
              🏆
            </div>
            <h3 className="text-lg font-medium mb-2">No Leaderboards</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first leaderboard
            </p>
            <Link 
              href="/leaderboard/admin/new"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create Leaderboard
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Period</th>
                  <th className="text-center py-3 px-4">Entries</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboards.map((leaderboard) => (
                  <tr key={leaderboard.id} className="hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{leaderboard.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {leaderboard.description || "No description"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {formatEnumValue(leaderboard.type)}
                    </td>
                    <td className="py-3 px-4">
                      {formatEnumValue(leaderboard.period)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {leaderboard._count.entries}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          leaderboard.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {leaderboard.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/leaderboard/admin/board/${leaderboard.id}`}
                          className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/leaderboard/admin/edit/${leaderboard.id}`}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}