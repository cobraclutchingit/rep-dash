"use client";

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery
} from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { toast } from "@/components/ui/toast";

// Type definitions for communication data
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string | null;
  visibleToRoles: string[];
  visibleToPositions: string[];
  publishDate: string;
  expiryDate: string | null;
  isPinned: boolean;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  categorySlug: string | null;
  icon: string | null;
  order: number;
  visibleToRoles: string[];
  visibleToPositions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  contestType: string;
  status: string;
  startDate: string;
  endDate: string;
  visibleToRoles: string[];
  visibleToPositions: string[];
  prizes: any | null;
  rules: string | null;
  isDraft: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: ContestParticipant[];
}

export interface ContestParticipant {
  id: string;
  contestId: string;
  userId: string;
  score: number;
  rank: number | null;
  isWinner: boolean;
  prize: string | null;
  user?: {
    id: string;
    name: string;
    position: string | null;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "ANNOUNCEMENT" | "CONTEST" | "LINK" | "OTHER";
  resourceId: string | null;
  isRead: boolean;
  createdAt: string;
  expiresAt: string | null;
}

// ===== Announcement Queries =====

/**
 * Get list of announcements
 */
export function useAnnouncements(params?: {
  category?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["announcements", params],
    queryFn: async () => {
      const response = await apiClient.get<Announcement[]>("/communication/announcements", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * Get a specific announcement
 */
export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ["announcements", id],
    queryFn: async () => {
      const response = await apiClient.get<Announcement>(`/communication/announcements/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiClient.post<Announcement>("/communication/announcements", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      toast({
        title: "Success",
        description: "Announcement created successfully",
        variant: "success",
      });
    },
  });
}

/**
 * Update an announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Announcement>;
    }) => {
      const response = await apiClient.patch<Announcement>(`/communication/announcements/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["announcements", data.id] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      
      toast({
        title: "Success",
        description: "Announcement updated successfully",
        variant: "success",
      });
    },
  });
}

/**
 * Delete an announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/communication/announcements/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["announcements", id] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
        variant: "success",
      });
    },
  });
}

// ===== Important Links Queries =====

/**
 * Get list of important links
 */
export function useLinks(params?: {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["links", params],
    queryFn: async () => {
      const response = await apiClient.get<ImportantLink[]>("/communication/links", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * Get a specific link
 */
export function useLink(id: string) {
  return useQuery({
    queryKey: ["links", id],
    queryFn: async () => {
      const response = await apiClient.get<ImportantLink>(`/communication/links/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new link
 */
export function useCreateLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ImportantLink, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiClient.post<ImportantLink>("/communication/links", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      
      toast({
        title: "Success",
        description: "Link created successfully",
        variant: "success",
      });
    },
  });
}

// ===== Notifications Queries =====

/**
 * Get user notifications with infinite query for lazy loading
 */
export function useNotifications(limit = 10) {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get<{
        notifications: Notification[];
        nextCursor: number | null;
      }>("/communication/notifications", {
        params: {
          cursor: pageParam,
          limit,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread", "count"],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>("/communication/notifications/unread/count");
      return response.data.count;
    },
  });
}

/**
 * Mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/communication/notifications/${id}/read`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", "count"] });
    },
    // Optimistic update
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["notifications"], (old: any) => {
        // Map through pages
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((notification: Notification) => 
              notification.id === id 
                ? { ...notification, isRead: true } 
                : notification
            ),
          })),
        };
      });
      
      // Also update the unread count
      const previousCount = queryClient.getQueryData(["notifications", "unread", "count"]);
      queryClient.setQueryData(["notifications", "unread", "count"], (old: number) => Math.max(0, (old || 0) - 1));
      
      // Return the snapshotted values
      return { previousNotifications, previousCount };
    },
    onError: (_, __, context) => {
      // If the mutation fails, roll back
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(["notifications", "unread", "count"], context.previousCount);
      }
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/communication/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.setQueryData(["notifications", "unread", "count"], 0);
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      });
    },
  });
}