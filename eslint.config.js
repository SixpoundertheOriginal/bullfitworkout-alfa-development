import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const customPlugin = {
  rules: {
    "no-outside-setstate": {
      create(context) {
        function isInHook(node) {
          while (node) {
            if (
              node.type === "CallExpression" &&
              node.callee.type === "Identifier" &&
              /^use[A-Z0-9].*/.test(node.callee.name)
            ) {
              return true;
            }
            node = node.parent;
          }
          return false;
        }
        return {
          CallExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              /^set[A-Z0-9]/.test(node.callee.name) &&
              !isInHook(node)
            ) {
              context.report({
                node,
                message:
                  "setState-style function '{{name}}' called outside of hook",
                data: { name: node.callee.name },
              });
            }
          },
        };
      },
    },
  },
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      custom: customPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react/no-this-in-sfc": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "custom/no-outside-setstate": "warn",
    },
  }
);
