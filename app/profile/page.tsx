"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SalesPosition } from "@prisma/client";

type ProfileData = {
  name: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  bio: string;
  territory: string;
  position: SalesPosition;
  profileImageUrl?: string;
};

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    bio: "",
    territory: "",
    position: "JUNIOR_EC" as SalesPosition,
    profileImageUrl: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Fetch user profile data
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setFormData({
          name: userData.name || "",
          fullName: userData.fullName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          bio: userData.bio || "",
          territory: userData.territory || "",
          position: userData.position || "JUNIOR_EC",
          profileImageUrl: userData.profileImageUrl || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, router, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      
      // Update the session with new values
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          image: formData.profileImageUrl,
        },
      });

      setSuccessMessage("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.email) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto bg-background p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Loading profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-background p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium mb-1">
                Position
              </label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position?.replace(/_/g, " ")}
                disabled
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
              <p className="text-xs text-muted-foreground mt-1">Position can only be changed by administrators</p>
            </div>

            <div>
              <label htmlFor="territory" className="block text-sm font-medium mb-1">
                Territory
              </label>
              <input
                id="territory"
                name="territory"
                type="text"
                value={formData.territory}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profileImageUrl" className="block text-sm font-medium mb-1">
                Profile Image URL
              </label>
              <input
                id="profileImageUrl"
                name="profileImageUrl"
                type="text"
                value={formData.profileImageUrl || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
                placeholder="https://example.com/profile-image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-md border-0 py-2 px-3 text-foreground bg-background ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary focus:z-10 sm:text-sm sm:leading-6 disabled:opacity-70"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
        
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-bold mb-4">Security</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push("/auth/change-password")}
              className="px-4 py-2 text-sm font-medium text-primary bg-background border border-input rounded-md hover:bg-accent"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}