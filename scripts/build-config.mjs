import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env");
const examplePath = resolve(".env.example");

const parseEnv = (source) => {
  const values = {};

  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  });

  return values;
};

const sourcePath = existsSync(envPath) ? envPath : examplePath;
const env = parseEnv(readFileSync(sourcePath, "utf8"));

const config = {
  tokenSymbol: env.VEIL_PAY_TOKEN_SYMBOL || "$VEIL",
  contractAddress:
    env.VEIL_PAY_CONTRACT_ADDRESS ||
    "Ds28wMScEFn1ztgwKYM1m2d2Qse6p6jXJhW6KpZppump",
};

const output = `window.VEIL_PAY_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

writeFileSync(resolve("config.js"), output, "utf8");
console.log(`Wrote config.js from ${sourcePath}`);
