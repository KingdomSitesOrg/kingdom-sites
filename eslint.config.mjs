import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The STRATA concept page (src/strata): three.js work mutates hook-owned objects (uniforms, refs' targets, fx)
  // inside frame callbacks, which the React Compiler's immutability rule cannot tell apart from render-time
  // mutation. Same override as the STRATA project it came from.
  {
    files: ["src/strata/chapters/**", "src/strata/story/canvas/**", "src/strata/part/**", "src/strata/saas/**"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/pdf.worker.min.mjs",
    // Pocket Thought (T-487): model-viewer and the Draco decoder, as their authors ship them.
    "public/pocket-thought/vendor/**",
    "public/pocket-thought/draco/**",
  ]),
]);

export default eslintConfig;
