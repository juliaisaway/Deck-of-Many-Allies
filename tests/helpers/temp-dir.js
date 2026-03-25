import fs from "fs";
import os from "os";
import path from "path";

export function createTempDir(prefix = "deck-of-many-allies-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
