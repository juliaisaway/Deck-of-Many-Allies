import fs from "fs";
import path from "path";

const LOCALE_PATTERN = /^[a-z]{2}_[a-z]{2}$/;
const DEFAULT_ALLIES_PATH = "data/allies";

export function getLocales(alliesPath = DEFAULT_ALLIES_PATH) {
  if (!fs.existsSync(alliesPath)) return [];

  return fs.readdirSync(alliesPath).filter((name) => {
    const fullPath = path.join(alliesPath, name);

    return (
      fs.statSync(fullPath).isDirectory() && LOCALE_PATTERN.test(name)
    );
  });
}
