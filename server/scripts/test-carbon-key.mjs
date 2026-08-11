import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(scriptDir, "../../.env"));
loadEnvFile(resolve(scriptDir, "../.env"));

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (name && process.env[name] === undefined) process.env[name] = value;
  }
}

const key = process.env.NVIDIA_API_KEY;
const keyName = "NVIDIA_API_KEY";

function assertKeyFormat(value) {
  if (!value) throw new Error(`${keyName} is missing from .env`);
  if (!/^nvapi-[A-Za-z0-9_-]{20,}$/.test(value)) {
    throw new Error(`${keyName} is set, but does not look like an NVIDIA nvapi key`);
  }
}

assertKeyFormat(key);

const prompt = "In one short sentence, estimate CO2 kg and energy MJ saved by reusing a winter jacket and desk lamp instead of buying new.";

const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
  method: "POST",
  signal: AbortSignal.timeout(30000),
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "meta/llama-3.1-8b-instruct",
    max_tokens: 80,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  }),
});

const body = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`${keyName} request failed with HTTP ${response.status}: ${body?.error?.message || response.statusText}`);
}

const text = body?.choices?.[0]?.message?.content?.trim();
if (!text) throw new Error(`${keyName} request succeeded but returned no text`);

console.log(`${keyName}: format ok, NVIDIA request ok`);
console.log(`Carbon response preview: ${text.slice(0, 180)}`);
