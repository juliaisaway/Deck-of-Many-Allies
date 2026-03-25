import fs from "fs";
import { pathToFileURL } from "node:url";

const DIST_DIR = "dist";

export function run() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });

  console.log(`🧹 Removed ${DIST_DIR}/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
