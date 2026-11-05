// Remotion's settings for the AI productivity film. Concurrency 2 (PLAN.md:
// memory rule). Full renders only through ../remotion-lock.sh.
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("png");
Config.setConcurrency(2);
