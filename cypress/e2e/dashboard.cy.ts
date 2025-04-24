describe('Dashboard', () => {
  beforeEach(() => {
    // Login before each test
    cy.ensureLoggedIn();

    // Visit dashboard
    cy.visit('/dashboard');
  });

  describe('Layout and Navigation', () => {
    it('should display sidebar navigation', () => {
      // Check that sidebar is visible on desktop
      cy.get('nav').should('be.visible');

      // Check that all navigation items are present
      cy.contains('nav a', 'Dashboard').should('be.visible');
      cy.contains('nav a', 'Calendar').should('be.visible');
      cy.contains('nav a', 'Training').should('be.visible');
      cy.contains('nav a', 'Onboarding').should('be.visible');
      cy.contains('nav a', 'Communications').should('be.visible');
      cy.contains('nav a', 'Leaderboard').should('be.visible');
    });

    it('should have a mobile responsive layout', () => {
      // Switch to mobile viewport
      cy.viewport('iphone-x');

      // Sidebar should be hidden on mobile
      cy.get('nav').should('not.be.visible');

      // Mobile menu button should be visible
      cy.get('button[aria-label="Open mobile menu"]').should('be.visible');

      // Click menu button to open mobile nav
      cy.get('button[aria-label="Open mobile menu"]').click();

      // Mobile nav should now be visible
      cy.contains('nav a', 'Dashboard').should('be.visible');

      // Should be able to close mobile menu
      cy.get('button[aria-label="Close mobile menu"]').click();
      cy.contains('nav a', 'Dashboard').should('not.be.visible');
    });

    it('should navigate between sections', () => {
      // Click on Calendar link
      cy.contains('nav a', 'Calendar').click();
      cy.url().should('include', '/calendar');

      // Click on Training link
      cy.contains('nav a', 'Training').click();
      cy.url().should('include', '/training');

      // Click on Leaderboard link
      cy.contains('nav a', 'Leaderboard').click();
      cy.url().should('include', '/leaderboard');

      // Return to dashboard
      cy.contains('nav a', 'Dashboard').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Dashboard Components', () => {
    it('should display dashboard stats cards', () => {
      // Check for stats cards
      cy.contains('Total Sales').should('be.visible');
      cy.contains('Sales This Month').should('be.visible');
      cy.contains('Target Completion').should('be.visible');
      cy.contains('Pending Deals').should('be.visible');
    });

    it('should display the recent activity section', () => {
      cy.contains('Recent Activity').should('be.visible');

      // Check for some recent activity items
      cy.get('div:contains("Recent Activity")')
        .parent()
        .find('div.space-y-2')
        .children()
        .should('have.length.greaterThan', 0);
    });

    it('should display upcoming tasks', () => {
      cy.contains('Upcoming Tasks').should('be.visible');

      // Check for some upcoming task items
      cy.get('div:contains("Upcoming Tasks")')
        .parent()
        .find('div.space-y-2')
        .children()
        .should('have.length.greaterThan', 0);
    });
  });

  describe('Theme Switching', () => {
    it('should toggle between light and dark mode', () => {
      // Open user menu to access theme toggle
      cy.get('button:has(.h-8.w-8.rounded-full)').click();

      // Check if we're in light mode
      cy.get('html').then(($html) => {
        if ($html.hasClass('dark')) {
          // Switch to light mode
          cy.get('button[aria-label="Light mode"]').click();
          cy.get('html').should('not.have.class', 'dark');
        } else {
          // Switch to dark mode
          cy.get('button[aria-label="Dark mode"]').click();
          cy.get('html').should('have.class', 'dark');
        }
      });
    });
  });

  describe('Refresh Dashboard', () => {
    it('should refresh dashboard data and show toast', () => {
      // Click refresh button
      cy.contains('button', 'Refresh Dashboard').click();

      // Toast notification should appear
      cy.contains('Dashboard Updated').should('be.visible');
    });
  });
});
