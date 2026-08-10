import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Mount-time data fetching (useEffect -> async load() -> setState)
      // is the standard pattern for these client pages; this rule fires
      // on the synchronous setLoading(true) at the top of every fetch.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**"]),
]);

export default eslintConfig;
