// ***********************************************************
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Hide fetch/XHR requests in console
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Cypress-specific types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login using UI
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<Element>;

      /**
       * Custom command to login bypassing UI
       * @example cy.loginByApi('test@example.com', 'password123')
       */
      loginByApi(email: string, password: string): Chainable<Element>;

      /**
       * Custom command to ensure the user is logged in, bypassing the UI
       * @example cy.ensureLoggedIn('test@example.com', 'password123')
       */
      ensureLoggedIn(email?: string, password?: string): Chainable<Element>;

      /**
       * Custom command to select a value from a dropdown
       * @example cy.selectDropdownOption('#my-dropdown', 'Option text')
       */
      selectDropdownOption(selector: string, optionText: string): Chainable<Element>;

      /**
       * Custom command to test responsiveness by switching to mobile viewport
       * @example cy.viewport('iphone-x')
       */
      waitForNetworkIdle(timeout?: number): Chainable<Element>;
    }
  }
}