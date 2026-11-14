// Remotion settings for the cafe app ad (8 workers on the 10-core Mac).
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("png");
Config.setConcurrency(8);
