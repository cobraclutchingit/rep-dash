'use client';

import { SalesPosition } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

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
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    territory: '',
    position: 'JUNIOR_EC' as SalesPosition,
    profileImageUrl: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Fetch user profile data
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setFormData({
          name: userData.name || '',
          fullName: userData.fullName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || '',
          territory: userData.territory || '',
          position: userData.position || 'JUNIOR_EC',
          profileImageUrl: userData.profileImageUrl || '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, router, status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the session with new values
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          image: formData.profileImageUrl,
        },
      });

      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.email) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-background mx-auto max-w-2xl rounded-lg p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold">Loading profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-background mx-auto max-w-2xl rounded-lg p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Username
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
              <p className="text-muted-foreground mt-1 text-xs">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
            </div>

            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium">
                Position
              </label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position?.replace(/_/g, ' ')}
                disabled
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Position can only be changed by administrators
              </p>
            </div>

            <div>
              <label htmlFor="territory" className="mb-1 block text-sm font-medium">
                Territory
              </label>
              <input
                id="territory"
                name="territory"
                type="text"
                value={formData.territory}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profileImageUrl" className="mb-1 block text-sm font-medium">
                Profile Image URL
              </label>
              <input
                id="profileImageUrl"
                name="profileImageUrl"
                type="text"
                value={formData.profileImageUrl || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
                placeholder="https://example.com/profile-image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="bio" className="mb-1 block text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-foreground bg-background ring-input focus:ring-primary w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset focus:z-10 focus:ring-2 disabled:opacity-70 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-lg font-bold">Security</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/change-password')}
              className="text-primary bg-background border-input hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
