describe('Leaderboard', () => {
  beforeEach(() => {
    // Login before each test
    cy.ensureLoggedIn();
    
    // Visit leaderboard page
    cy.visit('/leaderboard');
  });

  describe('Leaderboard Filtering', () => {
    it('should filter leaderboard by type', () => {
      // Start with all leaderboards visible
      cy.contains('h1', 'Leaderboard').should('be.visible');
      
      // Filter by appointment setters
      cy.selectDropdownOption('[data-testid="type-filter"]', 'Appointment Setters');
      
      // URL should update with filter param
      cy.url().should('include', 'type=APPOINTMENT_SETTERS');
      
      // Filter by closers
      cy.selectDropdownOption('[data-testid="type-filter"]', 'Closers');
      
      // URL should update with new filter param
      cy.url().should('include', 'type=CLOSERS');
      
      // Reset to all
      cy.selectDropdownOption('[data-testid="type-filter"]', 'All Types');
      
      // URL should update to remove type filter
      cy.url().should('include', 'type=ALL');
    });

    it('should filter leaderboard by time period', () => {
      // Filter by monthly
      cy.selectDropdownOption('[data-testid="period-filter"]', 'Monthly');
      
      // URL should update with filter param
      cy.url().should('include', 'period=MONTHLY');
      
      // Filter by quarterly
      cy.selectDropdownOption('[data-testid="period-filter"]', 'Quarterly');
      
      // URL should update with new filter param
      cy.url().should('include', 'period=QUARTERLY');
    });

    it('should filter leaderboard by position', () => {
      // Filter by Energy Consultant
      cy.selectDropdownOption('[data-testid="position-filter"]', 'Energy Consultant');
      
      // URL should update with filter param
      cy.url().should('include', 'position=ENERGY_CONSULTANT');
    });

    it('should search by participant name', () => {
      // Type in search box
      cy.get('input[placeholder*="Search"]').type('John');
      
      // Ensure search is reflected in URL
      cy.url().should('include', 'search=John');
      
      // Clear search
      cy.get('input[placeholder*="Search"]').clear();
    });
  });

  describe('Leaderboard Table', () => {
    it('should display leaderboard entries in a table', () => {
      // Select a leaderboard if needed
      cy.get('[data-testid="leaderboard-selector"]').first().click();
      
      // Check table headers
      cy.contains('th', 'Rank').should('be.visible');
      cy.contains('th', 'Name').should('be.visible');
      cy.contains('th', 'Score').should('be.visible');
      
      // Check that entries exist
      cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('should sort entries by clicking column headers', () => {
      // Select a leaderboard if needed
      cy.get('[data-testid="leaderboard-selector"]').first().click();
      
      // Get the initial order of entries
      cy.get('tbody tr td:nth-child(2)').then($cells => {
        const initialOrder = $cells.map((i, el) => el.textContent).get();
        
        // Click on Name column header to sort
        cy.contains('th', 'Name').click();
        
        // Get the new order after sorting
        cy.get('tbody tr td:nth-child(2)').then($newCells => {
          const newOrder = $newCells.map((i, el) => el.textContent).get();
          
          // Check if the order has changed
          expect(initialOrder).not.to.deep.equal(newOrder);
          
          // Click again to reverse sort
          cy.contains('th', 'Name').click();
        });
      });
    });

    it('should paginate when there are many entries', () => {
      // Select a leaderboard with many entries (if available)
      cy.get('[data-testid="leaderboard-selector"]').first().click();
      
      // Check if pagination exists
      cy.get('[data-testid="pagination"]').then($pagination => {
        if ($pagination.length > 0) {
          // Click next page
          cy.get('[data-testid="next-page"]').click();
          
          // URL should include page parameter
          cy.url().should('include', 'page=2');
          
          // Go back to first page
          cy.get('[data-testid="prev-page"]').click();
          
          // URL should show page 1
          cy.url().should('include', 'page=1');
        } else {
          // Skip if no pagination (not enough entries)
          cy.log('Not enough entries to test pagination');
        }
      });
    });
  });

  describe('Admin Features', () => {
    beforeEach(() => {
      // Use admin login
      cy.ensureLoggedIn('admin@example.com', 'password123');
      cy.visit('/leaderboard');
    });

    it('should show admin controls for managing leaderboards', () => {
      // Admin should see create button
      cy.contains('button', 'Create Leaderboard').should('be.visible');
      
      // Admin should see edit options
      cy.get('[data-testid="leaderboard-actions"]').should('be.visible');
    });

    it('should allow adding a new entry', () => {
      // Select a leaderboard
      cy.get('[data-testid="leaderboard-selector"]').first().click();
      
      // Click add entry button
      cy.contains('button', 'Add Entry').click();
      
      // Modal should appear
      cy.get('[role="dialog"]').should('be.visible');
      
      // Fill out form
      cy.get('select[name="userId"]').select(1); // Select first user
      cy.get('input[name="score"]').type('5000');
      
      // Submit form
      cy.contains('button', 'Add Entry').click();
      
      // Toast notification should appear
      cy.contains('Entry added successfully').should('be.visible');
    });
  });

  describe('Mobile View', () => {
    it('should adapt to mobile screen size', () => {
      // Switch to mobile viewport
      cy.viewport('iphone-x');
      
      // Check that the layout adapts
      cy.get('[data-testid="leaderboard-mobile-view"]').should('be.visible');
      
      // Mobile filters should be in a dropdown
      cy.get('[data-testid="mobile-filters-button"]').should('be.visible');
      
      // Open filters
      cy.get('[data-testid="mobile-filters-button"]').click();
      
      // Mobile filters should be visible
      cy.get('[data-testid="mobile-filters-panel"]').should('be.visible');
    });
  });
});