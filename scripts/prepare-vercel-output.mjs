import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve("dist");
const files = [
  "index.html",
  "bridge.html",
  "docs.html",
  "privacy.html",
  "terms.html",
  "disclaimer.html",
  "styles.css",
  "script.js",
  "config.js",
  "vercel.json",
];
const directories = ["public"];

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

files.forEach((file) => {
  cpSync(resolve(file), resolve(dist, file));
});

directories.forEach((directory) => {
  cpSync(resolve(directory), resolve(dist, directory), { recursive: true });
});

console.log("Prepared dist/ for Vercel");
