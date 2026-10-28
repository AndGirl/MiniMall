import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 允许在 useEffect 中发起客户端数据获取（fetch 后 setState），该规则对数据获取模式存在误报
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 本地配置与技能目录，不属于项目代码
    ".claude/**",
    ".vscode/**",
  ]),
]);

export default eslintConfig;
