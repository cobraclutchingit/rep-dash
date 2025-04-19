// ***********************************************
// Custom commands for Cypress
// ***********************************************

// -- This is a login command --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// -- This is a login by API command --
Cypress.Commands.add('loginByApi', (email, password) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/callback/credentials',
      body: { email, password },
    }).then((response) => {
      // Check that we got a successful response
      expect(response.status).to.eq(200);
    });
  });
});

// -- This ensures that we're logged in --
Cypress.Commands.add('ensureLoggedIn', (email = 'admin@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.loginByApi(email, password);
  });
  cy.visit('/');
});

// -- Select dropdown option --
Cypress.Commands.add('selectDropdownOption', (selector, optionText) => {
  cy.get(selector).click();
  cy.contains(optionText).click();
});

// -- Wait for network to be idle --
Cypress.Commands.add('waitForNetworkIdle', (timeout = 3000) => {
  let lastRequestTime = Date.now();
  
  cy.intercept('*', (req) => {
    lastRequestTime = Date.now();
    req.continue();
  });
  
  return cy.wait(100).then(() => {
    // Wait until no requests have been sent for X ms
    const checkIdle = () => {
      const now = Date.now();
      const timeElapsed = now - lastRequestTime;
      
      if (timeElapsed < timeout) {
        // More time needed
        return cy.wait(Math.min(200, timeout - timeElapsed)).then(checkIdle);
      }
      // Network is idle
      return;
    };
    
    return checkIdle();
  });
});