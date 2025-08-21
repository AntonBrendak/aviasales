import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // глобальные игноры
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "packages/contracts/types/**"    
    ],
  },
  // TS/TSX правила (без type-aware, чтобы не требовать tsconfig.project)
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest"
      }
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      // выбираем стиль под репо: одинарные кавычки
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" } // _next и т.п. не ругаем
      ]
    }
  }
];