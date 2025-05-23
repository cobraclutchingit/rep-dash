import { Session } from 'next-auth';

import * as permissions from '@/lib/utils/permissions';
import '@testing-library/jest-dom';

describe('Permission Utilities', () => {
  const adminSession: Session = {
    user: {
      id: 'admin-id',
      role: 'ADMIN',
      position: 'MANAGER',
      isActive: true,
    },
    expires: '2025-01-01T00:00:00Z',
  };

  const managerSession: Session = {
    user: {
      id: 'manager-id',
      role: 'USER',
      position: 'MANAGER',
      isActive: true,
    },
    expires: '2025-01-01T00:00:00Z',
  };

  const userSession: Session = {
    user: {
      id: 'user-id',
      role: 'USER',
      position: 'ENERGY_CONSULTANT',
      isActive: true,
    },
    expires: '2025-01-01T00:00:00Z',
  };

  const inactiveUserSession: Session = {
    user: {
      id: 'inactive-id',
      role: 'USER',
      position: 'ENERGY_CONSULTANT',
      isActive: false,
    },
    expires: '2025-01-01T00:00:00Z',
  };

  const nullSession: Session | null = null;

  describe('Basic permission checks', () => {
    test('hasRole should return true when user has the specified role', () => {
      expect(permissions.hasRole(adminSession, 'ADMIN')).toBe(true);
      expect(permissions.hasRole(userSession, 'USER')).toBe(true);
      expect(permissions.hasRole(userSession, 'ADMIN')).toBe(false);
    });

    test('hasRole should return false for null session', () => {
      expect(permissions.hasRole(nullSession, 'ADMIN')).toBe(false);
    });

    test('hasOneOfRoles should return true when user has one of the roles', () => {
      expect(permissions.hasOneOfRoles(adminSession, ['ADMIN', 'USER'])).toBe(true);
      expect(permissions.hasOneOfRoles(userSession, ['ADMIN', 'USER'])).toBe(true);
      expect(permissions.hasOneOfRoles(userSession, ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });

    test('isAdmin should return true only for admin users', () => {
      expect(permissions.isAdmin(adminSession)).toBe(true);
      expect(permissions.isAdmin(userSession)).toBe(false);
      expect(permissions.isAdmin(nullSession)).toBe(false);
    });

    test('isActive should return true for active users', () => {
      expect(permissions.isActive(adminSession)).toBe(true);
      expect(permissions.isActive(userSession)).toBe(true);
      expect(permissions.isActive(inactiveUserSession)).toBe(false);
      expect(permissions.isActive(nullSession)).toBe(false);
    });
  });

  describe('Position based permission checks', () => {
    test('hasSalesPosition should validate correct positions', () => {
      expect(permissions.hasSalesPosition(managerSession, 'MANAGER')).toBe(true);
      expect(permissions.hasSalesPosition(userSession, 'ENERGY_CONSULTANT')).toBe(true);
      expect(permissions.hasSalesPosition(userSession, 'MANAGER')).toBe(false);
      expect(permissions.hasSalesPosition(nullSession, 'MANAGER')).toBe(false);
    });

    test('hasOneOfPositions should check for multiple positions', () => {
      expect(
        permissions.hasOneOfPositions(userSession, ['ENERGY_CONSULTANT', 'ENERGY_SPECIALIST'])
      ).toBe(true);
      expect(permissions.hasOneOfPositions(managerSession, ['MANAGER'])).toBe(true);
      expect(permissions.hasOneOfPositions(userSession, ['MANAGER', 'JUNIOR_EC'])).toBe(false);
    });

    test('position-specific helpers should work correctly', () => {
      expect(permissions.isManager(managerSession)).toBe(true);
      expect(permissions.isManager(userSession)).toBe(false);

      expect(permissions.isEnergyConsultant(userSession)).toBe(true);
      expect(permissions.isEnergyConsultant(managerSession)).toBe(false);
    });
  });

  describe('Feature access checks', () => {
    test('canAccessAdminFeatures allows admins and managers', () => {
      expect(permissions.canAccessAdminFeatures(adminSession)).toBe(true);
      expect(permissions.canAccessAdminFeatures(managerSession)).toBe(true);
      expect(permissions.canAccessAdminFeatures(userSession)).toBe(false);
      expect(permissions.canAccessAdminFeatures(nullSession)).toBe(false);
    });

    test('canManageUsers allows only admins', () => {
      expect(permissions.canManageUsers(adminSession)).toBe(true);
      expect(permissions.canManageUsers(managerSession)).toBe(false);
      expect(permissions.canManageUsers(userSession)).toBe(false);
    });

    test('canEditUserProfile checks correct permissions', () => {
      expect(permissions.canEditUserProfile(adminSession, 'some-other-id')).toBe(true);
      expect(permissions.canEditUserProfile(managerSession, 'some-team-member-id')).toBe(true);
      expect(permissions.canEditUserProfile(userSession, 'user-id')).toBe(true);
      expect(permissions.canEditUserProfile(userSession, 'some-other-id')).toBe(false);
      expect(permissions.canEditUserProfile(nullSession, 'any-id')).toBe(false);
    });
  });
});
