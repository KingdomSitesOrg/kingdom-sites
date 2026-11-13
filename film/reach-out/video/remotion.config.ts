// Remotion settings for the mural promo (same as the kinetic promo: 8 workers on the 10-core Mac).
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("png");
Config.setConcurrency(8);
