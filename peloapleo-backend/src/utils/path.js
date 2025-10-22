import path from "node:path";
import { ROOT_DIR } from "../config.js";

export function toPublicPath(fullPath) {
  if (!fullPath) return null;
  const relative = path.relative(ROOT_DIR, fullPath);
  return `/${relative.split(path.sep).join("/")}`;
}
