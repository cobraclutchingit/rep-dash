import { UserRole, SalesPosition } from '@prisma/client';
import { Session } from 'next-auth';

// Role and position checking
export function hasRole(session: Session | null | undefined, role: UserRole) {
  if (!session?.user) return false;
  return session.user.role === role;
}

export function hasOneOfRoles(session: Session | null | undefined, roles: UserRole[]) {
  if (!session?.user) return false;
  return roles.includes(session.user.role as UserRole);
}

export function isAdmin(session: Session | null | undefined) {
  return hasRole(session, 'ADMIN' as UserRole);
}

export function isActive(session: Session | null) {
  if (!session?.user) return false;
  return session.user.isActive !== false; // Default to true if not specified
}

export function hasSalesPosition(session: Session | null, position: SalesPosition) {
  if (!session?.user || !session.user.position) return false;
  return session.user.position === position;
}

export function hasOneOfPositions(session: Session | null, positions: SalesPosition[]) {
  if (!session?.user || !session.user.position) return false;
  return positions.includes(session.user.position as SalesPosition);
}

export function isManager(session: Session | null) {
  return hasSalesPosition(session, 'MANAGER' as SalesPosition);
}

export function isEnergyConsultant(session: Session | null) {
  return hasSalesPosition(session, 'ENERGY_CONSULTANT' as SalesPosition);
}

export function isEnergySpecialist(session: Session | null) {
  return hasSalesPosition(session, 'ENERGY_SPECIALIST' as SalesPosition);
}

export function isJuniorEC(session: Session | null) {
  return hasSalesPosition(session, 'JUNIOR_EC' as SalesPosition);
}

// Access control functions
export function canAccessAdminFeatures(session: Session | null) {
  if (!session?.user) return false;

  // Admin role always has access
  if (session.user.role === 'ADMIN') return true;

  // Sales managers can also access some admin features
  if (session.user.position === 'MANAGER') return true;

  return false;
}

export function canManageUsers(session: Session | null | undefined) {
  return isAdmin(session);
}

export function canManageRoles(session: Session | null) {
  return isAdmin(session);
}

export function canManagePositions(session: Session | null) {
  return isAdmin(session) || isManager(session);
}

export function canManageTeam(session: Session | null) {
  return isAdmin(session) || isManager(session);
}

export function canViewTrainingProgress(session: Session | null, userId: string) {
  if (!session?.user) return false;

  // Admins and managers can view all progress
  if (canAccessAdminFeatures(session)) return true;

  // Users can only view their own progress
  return session.user.id === userId;
}

export function canEditTrainingContent(session: Session | null) {
  return canAccessAdminFeatures(session);
}

export function canManageCommunications(session: Session | null) {
  return canAccessAdminFeatures(session);
}

export function canCreateAnnouncement(session: Session | null) {
  return canManageCommunications(session);
}

export function canManageLinks(session: Session | null) {
  return canManageCommunications(session);
}

export function canManageContests(session: Session | null) {
  return canManageCommunications(session);
}

export function canManageAnnouncements(session: Session | null) {
  return canManageCommunications(session);
}

export function canEditUserProfile(session: Session | null, userId: string) {
  if (!session?.user) return false;

  // Admins can edit any profile
  if (isAdmin(session)) return true;

  // Managers can edit team members' profiles
  if (isManager(session)) {
    // In a real implementation, you would check if the user is in the manager's team
    // For now, we'll simplify it
    return true;
  }

  // Users can only edit their own profile
  return session.user.id === userId;
}

export function canDeactivateUser(session: Session | null) {
  return isAdmin(session);
}

export function canResetPassword(session: Session | null, userId: string) {
  // Similar logic to editing profiles
  return canEditUserProfile(session, userId);
}

export function canAccessReports(session: Session | null) {
  return isAdmin(session) || isManager(session);
}

export function canManageLeaderboards(session: Session | null) {
  return isAdmin(session) || isManager(session);
}

export function canScheduleEvents(session: Session | null) {
  return (
    canAccessAdminFeatures(session) || isEnergySpecialist(session) || isEnergyConsultant(session)
  );
}

export function canManageEvents(session: Session | null) {
  return canAccessAdminFeatures(session);
}

export function canEditEvent(session: Session | null, createdById: string) {
  if (!session?.user) return false;

  // Admin role or managers can edit any event
  if (canAccessAdminFeatures(session)) return true;

  // Creator can edit their own events
  return session.user.id === createdById;
}

export function canManageOnboarding(session: Session | null) {
  return canAccessAdminFeatures(session);
}

export function canViewOnboardingProgress(session: Session | null, userId: string) {
  if (!session?.user) return false;

  // Admins and managers can view all progress
  if (canAccessAdminFeatures(session)) return true;

  // Users can only view their own progress
  return session.user.id === userId;
}

// Common position groups for easier permission checks
export const MANAGER_POSITIONS = ['MANAGER'] as SalesPosition[];
export const SALES_POSITIONS = [
  'ENERGY_CONSULTANT',
  'ENERGY_SPECIALIST',
  'JUNIOR_EC',
] as SalesPosition[];
export const SENIOR_SALES_POSITIONS = ['ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'] as SalesPosition[];
export const ALL_POSITIONS = [
  'MANAGER',
  'ENERGY_CONSULTANT',
  'ENERGY_SPECIALIST',
  'JUNIOR_EC',
] as SalesPosition[];
