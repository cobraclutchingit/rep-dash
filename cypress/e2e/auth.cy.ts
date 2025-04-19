describe('Authentication', () => {
  beforeEach(() => {
    // Reset any previous session
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Login Flow', () => {
    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Check for error message
      cy.contains('Invalid email or password').should('be.visible');
      
      // Should still be on login page
      cy.url().should('include', '/auth/login');
    });

    it('should redirect to dashboard on successful login', () => {
      // Intercept the login API call
      cy.intercept('POST', '/api/auth/callback/credentials').as('loginRequest');
      
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Wait for request to complete
      cy.wait('@loginRequest');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Should display user information
      cy.contains('Admin User').should('be.visible');
    });

    it('should toggle password visibility', () => {
      cy.visit('/auth/login');
      
      // Password input should start as password type (hidden)
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      
      // Click show password button and check type is now text
      cy.get('button[aria-label="Show password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      
      // Click hide password button and check type is back to password
      cy.get('button[aria-label="Hide password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login first
      cy.login('admin@example.com', 'password123');
    });
    
    it('should successfully log out', () => {
      // Open user dropdown
      cy.get('button')
        .contains('Admin User')
        .click();
      
      // Click logout button
      cy.contains('Log out').click();
      
      // Should redirect to login page
      cy.url().should('include', '/auth/login');
      
      // Try accessing a protected page
      cy.visit('/dashboard');
      
      // Should redirect back to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Password Reset Flow', () => {
    it('should show form to request password reset', () => {
      cy.visit('/auth/login');
      cy.contains('Forgot password?').click();
      
      // Check we're on the forgot password page
      cy.url().should('include', '/auth/forgot-password');
      
      // Enter email and submit
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show success message
      cy.contains('Password reset email sent').should('be.visible');
    });
  });

  describe('Registration Flow', () => {
    it('should validate the registration form', () => {
      cy.visit('/auth/register');
      
      // Submit without filling required fields
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.contains('Name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should complete registration process', () => {
      // Intercept the registration API call
      cy.intercept('POST', '/api/auth/register').as('registerRequest');
      
      cy.visit('/auth/register');
      
      // Fill out the form
      cy.get('input[name="name"]').type('New User');
      cy.get('input[name="email"]').type(`newuser-${Date.now()}@example.com`);
      cy.get('input[name="password"]').type('Password123!');
      cy.get('select[name="position"]').select('ENERGY_CONSULTANT');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for registration
      cy.wait('@registerRequest');
      
      // Should redirect to login or onboarding
      cy.url().should('match', /\/auth\/login|\/onboarding/);
    });
  });
});