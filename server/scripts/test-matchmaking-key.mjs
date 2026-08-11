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

const key = process.env.NVIDIA_API_KEY_MATCH;
const keyName = "NVIDIA_API_KEY_MATCH";

function assertKeyFormat(value) {
  if (!value) throw new Error(`${keyName} is missing from .env`);
  if (!/^nvapi-[A-Za-z0-9_-]{20,}$/.test(value)) {
    throw new Error(`${keyName} is set, but does not look like an NVIDIA nvapi key`);
  }
}

assertKeyFormat(key);

const prompt = `Barter trade check. Does Item A satisfy what Person B wants?

Item A (offered): "LED desk lamp, adjustable bright study light"
Person B wants: "room lighting for studying"

Reply with ONLY the single word YES or NO.`;

const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
  method: "POST",
  signal: AbortSignal.timeout(30000),
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "meta/llama-3.1-8b-instruct",
    max_tokens: 5,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  }),
});

const body = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`${keyName} request failed with HTTP ${response.status}: ${body?.error?.message || response.statusText}`);
}

const answer = body?.choices?.[0]?.message?.content?.trim().toUpperCase();
if (!answer) throw new Error(`${keyName} request succeeded but returned no answer`);
if (!answer.startsWith("YES")) {
  throw new Error(`${keyName} request returned "${answer}", expected YES for the semantic lamp-lighting test`);
}

console.log(`${keyName}: format ok, NVIDIA request ok`);
console.log(`Matchmaking semantic answer: ${answer}`);
