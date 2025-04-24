// Custom commands for Cypress

// Extend Cypress Chainable interface to include session
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginByApi(email: string, password: string): Chainable<void>;
      ensureLoggedIn(email?: string, password?: string): Chainable<void>;
      selectDropdownOption(selector: string, optionText: string): Chainable<void>;
      waitForNetworkIdle(timeout?: number): Chainable<void>;
      session(
        id: string | string[],
        setup: () => void,
        options?: Cypress.SessionOptions
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string): Cypress.Chainable<void> => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginByApi', (email: string, password: string): Cypress.Chainable<void> => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/signin/credentials',
      body: { email, password, redirect: false },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});

Cypress.Commands.add(
  'ensureLoggedIn',
  (
    email: string = 'admin@example.com',
    password: string = 'password123'
  ): Cypress.Chainable<void> => {
    cy.session([email, password], () => {
      cy.loginByApi(email, password);
    });
    cy.visit('/');
  }
);

Cypress.Commands.add(
  'selectDropdownOption',
  (selector: string, optionText: string): Cypress.Chainable<void> => {
    cy.get(selector).click();
    cy.contains(optionText).click();
  }
);

Cypress.Commands.add('waitForNetworkIdle', (timeout: number = 3000): Cypress.Chainable<void> => {
  let lastRequestTime = Date.now();
  cy.intercept('*', (req) => {
    lastRequestTime = Date.now();
    req.continue();
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  return cy.wait(100).then(() => {
    const checkIdle = (): Cypress.Chainable<void> => {
      const now = Date.now();
      const timeElapsed = now - lastRequestTime;

      if (timeElapsed < timeout) {
        return cy.wait(Math.min(200, timeout - timeElapsed)).then(checkIdle);
      }
      return cy.wrap(null);
    };

    return checkIdle();
  });
});
