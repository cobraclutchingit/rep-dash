"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { UserRole, SalesPosition, AnnouncementPriority, ContestType, ContestStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define interfaces for the data types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category: string | null;
  visibleToRoles: UserRole[];
  visibleToPositions: SalesPosition[];
  publishDate: Date;
  expiryDate: Date | null;
  isPinned: boolean;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  visibleToRoles: UserRole[];
  visibleToPositions: SalesPosition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  contestType: ContestType;
  status: ContestStatus;
  startDate: Date;
  endDate: Date;
  visibleToRoles: UserRole[];
  visibleToPositions: SalesPosition[];
  prizes: any | null;
  rules: string | null;
  isDraft: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    position: SalesPosition | null;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "ANNOUNCEMENT" | "CONTEST" | "LINK" | "OTHER";
  resourceId: string | null;
  isRead: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

// Filter options
export interface CommunicationFilters {
  announcements: {
    category: string | null;
    priority: AnnouncementPriority | null;
    searchTerm: string;
  };
  links: {
    category: string | null;
    searchTerm: string;
  };
  contests: {
    type: ContestType | null;
    status: ContestStatus | null;
    searchTerm: string;
  };
}

// Context interface
interface CommunicationContextType {
  // Data
  announcements: Announcement[];
  links: ImportantLink[];
  contests: Contest[];
  notifications: Notification[];
  linkCategories: string[];
  announcementCategories: string[];
  unreadCount: number;
  
  // Filters
  filters: CommunicationFilters;
  setFilters: (filters: CommunicationFilters) => void;
  
  // Status
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCommunicationData: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  // Filtered data getters
  getFilteredAnnouncements: () => Announcement[];
  getFilteredLinks: () => ImportantLink[];
  getFilteredContests: () => Contest[];
}

// Create the context
const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

// Create a hook to use the context
export function useCommunication() {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error("useCommunication must be used within a CommunicationProvider");
  }
  return context;
}

// Provider component
export function CommunicationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State for data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // State for status
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [filters, setFilters] = useState<CommunicationFilters>({
    announcements: {
      category: null,
      priority: null,
      searchTerm: "",
    },
    links: {
      category: null,
      searchTerm: "",
    },
    contests: {
      type: null,
      status: null,
      searchTerm: "",
    },
  });
  
  // Computed properties
  const linkCategories = useMemo(() => {
    const categories = links
      .map(link => link.category)
      .filter((category, index, self) => 
        category !== null && self.indexOf(category) === index
      ) as string[];
    return categories;
  }, [links]);
  
  const announcementCategories = useMemo(() => {
    const categories = announcements
      .map(announcement => announcement.category)
      .filter((category, index, self) => 
        category !== null && self.indexOf(category) === index
      ) as string[];
    return categories;
  }, [announcements]);
  
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);
  
  // Filtered data getters
  const getFilteredAnnouncements = () => {
    const { category, priority, searchTerm } = filters.announcements;
    
    return announcements.filter(announcement => {
      // Filter by category
      if (category && announcement.category !== category) {
        return false;
      }
      
      // Filter by priority
      if (priority && announcement.priority !== priority) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !announcement.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  const getFilteredLinks = () => {
    const { category, searchTerm } = filters.links;
    
    return links.filter(link => {
      // Filter by category
      if (category && link.category !== category) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !link.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  };
  
  const getFilteredContests = () => {
    const { type, status, searchTerm } = filters.contests;
    
    return contests.filter(contest => {
      // Filter by type
      if (type && contest.contestType !== type) {
        return false;
      }
      
      // Filter by status
      if (status && contest.status !== status) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !contest.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contest.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  // Fetch all communication data
  const fetchCommunicationData = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch announcements
      const announcementsRes = await fetch("/api/communication/announcements");
      if (!announcementsRes.ok) throw new Error("Failed to fetch announcements");
      const announcementsData = await announcementsRes.json();
      
      // Fetch links
      const linksRes = await fetch("/api/communication/links");
      if (!linksRes.ok) throw new Error("Failed to fetch links");
      const linksData = await linksRes.json();
      
      // Fetch contests
      const contestsRes = await fetch("/api/communication/contests");
      if (!contestsRes.ok) throw new Error("Failed to fetch contests");
      const contestsData = await contestsRes.json();
      
      // Fetch notifications
      const notificationsRes = await fetch("/api/communication/notifications");
      if (!notificationsRes.ok) throw new Error("Failed to fetch notifications");
      const notificationsData = await notificationsRes.json();
      
      // Update state
      setAnnouncements(announcementsData);
      setLinks(linksData);
      setContests(contestsData);
      setNotifications(notificationsData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching communication data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark a notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/communication/notifications/${notificationId}/read`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/communication/notifications/read-all", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (session?.user) {
      fetchCommunicationData();
    }
  }, [session]);
  
  // Create the context value
  const contextValue: CommunicationContextType = {
    announcements,
    links,
    contests,
    notifications,
    linkCategories,
    announcementCategories,
    unreadCount,
    
    filters,
    setFilters,
    
    loading,
    error,
    
    fetchCommunicationData,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    getFilteredAnnouncements,
    getFilteredLinks,
    getFilteredContests,
  };
  
  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
}