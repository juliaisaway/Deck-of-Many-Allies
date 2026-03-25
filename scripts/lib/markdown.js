import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"));
}

export function loadMarkdownFiles(dir) {
  return listMarkdownFiles(dir).map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);

    return { file, data, content };
  });
}
