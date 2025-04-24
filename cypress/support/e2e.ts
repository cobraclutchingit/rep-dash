/* eslint-disable @typescript-eslint/no-namespace */
// Hide fetch/XHR requests in console
const app: Window | null = typeof window !== 'undefined' ? window.top : null;
if (app && app.document && !app.document.head.querySelector('[data-hide-command-log-request]')) {
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
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login bypassing UI
       * @example cy.loginByApi('test@example.com', 'password123')
       */
      loginByApi(email: string, password: string): Chainable<void>;

      /**
       * Custom command to ensure the user is logged in, bypassing the UI
       * @example cy.ensureLoggedIn('test@example.com', 'password123')
       */
      ensureLoggedIn(email?: string, password?: string): Chainable<void>;

      /**
       * Custom command to select a value from a dropdown
       * @example cy.selectDropdownOption('#my-dropdown', 'Option text')
       */
      selectDropdownOption(selector: string, optionText: string): Chainable<void>;

      /**
       * Custom command to wait for network to be idle
       * @example cy.waitForNetworkIdle(3000)
       */
      waitForNetworkIdle(timeout?: number): Chainable<void>;
    }
  }
}
