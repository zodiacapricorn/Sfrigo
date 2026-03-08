import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"], // file da ignorare
  },
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: {
        ...globals.browser,  // frontend Next.js
        ...globals.node,     // aggiunta process, require, ecc.
        ...globals.jest,
      } 
    }, 
  },
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/react-in-jsx-scope": "off", //  Next.js non richiede import React
      "react/prop-types": "off",            // TypeScript/Next.js non usa PropTypes
      "react/no-unescaped-entities": "off", // permette ' e " nel JSX
    }
  }
]);