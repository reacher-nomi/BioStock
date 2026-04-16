import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        fetch: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];
