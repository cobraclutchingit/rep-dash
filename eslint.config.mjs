import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import jestPlugin from "eslint-plugin-jest";
import testingLibraryPlugin from "eslint-plugin-testing-library";
import cypressPlugin from "eslint-plugin-cypress";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base Next.js configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Global rules
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "public/**",
    ],
  },
  
  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Typescript specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off", // Too strict for React components
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // Use TypeScript instead
      "react/display-name": "off", // Often not needed with function components
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // Import rules
      "import/no-cycle": "error",
      "import/no-unresolved": "off", // TypeScript handles this
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"]
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      
      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-unused-expressions": "warn",
      "no-duplicate-imports": "error",
    },
  },
  
  // Test files
  {
    files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
    },
    rules: {
      // Relax rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      
      // Jest rules
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
      
      // Testing Library rules
      "testing-library/await-async-queries": "error",
      "testing-library/no-await-sync-queries": "error",
      "testing-library/no-debugging-utils": "warn",
      "testing-library/prefer-screen-queries": "warn",
    },
  },
  
  // Cypress files
  {
    files: ["**/cypress/**/*.[jt]s?(x)"],
    plugins: {
      cypress: cypressPlugin,
    },
    extends: [
      "plugin:cypress/recommended",
    ],
    rules: {
      "cypress/no-assigning-return-values": "error",
      "cypress/no-unnecessary-waiting": "warn",
      "cypress/assertion-before-screenshot": "warn",
      "cypress/no-force": "warn",
      "cypress/no-async-tests": "error",
    },
  },
];

export default eslintConfig;