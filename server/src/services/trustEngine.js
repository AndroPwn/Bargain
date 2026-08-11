// EcoLoop — Trust Engine (NVIDIA NIM)

export const KARMA = {
  DONATION: 15, HANDSHAKE: 10, NGO_DONATION: 25,
  FOOD_SURPLUS: 20, NO_SHOW: -50, MISREP: -30,
};

export function withinRadius(geohashA, geohashB, precision = 5) {
  if (!geohashA || !geohashB) return false;
  return geohashA.slice(0, precision) === geohashB.slice(0, precision);
}
export function karmaMultiplier(n) { return n > 2 ? 0.1 : 1.0; }
export function rankRequesters(r) { return [...r].sort((a, b) => b.karma - a.karma); }

function norm(s) {
  return (s || '').toLowerCase().replace(/[\s\-_.,!]+/g, '');
}

async function callNvidia(prompt) {
  if (!process.env.NVIDIA_API_KEY_MATCH) {
    throw new Error("NVIDIA_API_KEY_MATCH is not configured");
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY_MATCH}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      max_tokens: 5,
      temperature: 0.0,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim().toUpperCase() ?? "";
}

// Each user gives their listing and wants one specific item in return (paired).
// This checks: can giver's listing satisfy receiver's want?
async function aiCanGiveTo(giver, receiver) {
  const offeredTitle = (giver.listingTitle || '').trim();
  const wantedItem   = (receiver.wantItemName || '').trim();

  // Fast path: exact same item ("Desk Mat" == "deskmat", "Bottle" == "bottle")
  if (norm(offeredTitle) === norm(wantedItem)) {
    console.log(`[AI] "${offeredTitle}" -> "${wantedItem}": YES (exact)`);
    return true;
  }
  // Fast path: one contains the other ("Acoustic Guitar" contains "guitar")
  if (wantedItem.length > 2 && (
    norm(offeredTitle).includes(norm(wantedItem)) ||
    norm(wantedItem).includes(norm(offeredTitle))
  )) {
    console.log(`[AI] "${offeredTitle}" -> "${wantedItem}": YES (fuzzy)`);
    return true;
  }

  // Ask NVIDIA for semantic match
  const offeredText = [giver.listingTitle, giver.listingCategory, giver.listingDescription]
    .filter(Boolean).join(', ');

  const prompt = `Barter trade check. Does Item A satisfy what Person B wants?

Item A (offered): "${offeredText}"
Person B wants: "${wantedItem}"

Rules:
- YES if A is the same item, a synonym, or clearly belongs to the category B wants.
- YES examples: "Winter Jacket" satisfies "something warm". "Desk Lamp" satisfies "room lighting". "Acoustic Guitar" satisfies "musical instrument". "Fiction Novel" satisfies "something to read".
- NO examples: "Desk Mat" does NOT satisfy "Bottle". "Guitar" does NOT satisfy "room lighting". "Bottle" does NOT satisfy "deskmat".
- When in doubt: NO.

Reply with ONLY the single word YES or NO.`;

  try {
    const answer = await callNvidia(prompt);
    const result = answer.startsWith("YES");
    console.log(`[AI] "${offeredTitle}" -> "${wantedItem}": ${result ? "YES" : "NO"} (NVIDIA)`);
    return result;
  } catch (err) {
    // Fallback: exact name match only (never use category — causes false positives)
    const fallback = norm(offeredTitle) === norm(wantedItem);
    console.warn(`[AI] "${offeredTitle}" -> "${wantedItem}": ${fallback ? "YES" : "NO"} (AI down: ${err.message})`);
    return fallback;
  }
}

async function buildCompatibilityMatrix(users) {
  const capped = users.slice(0, 10);
  const pairs = [];
  for (let i = 0; i < capped.length; i++)
    for (let j = 0; j < capped.length; j++)
      if (i !== j) pairs.push([capped[i], capped[j]]);

  console.log(`[AI] Checking ${pairs.length} pairs for ${capped.length} candidates...`);

  // Key by listingId (NOT userId) so multi-listing users don't overwrite each other
  const matrix = new Map();
  const BATCH = 3;
  for (let b = 0; b < pairs.length; b += BATCH) {
    const batch = pairs.slice(b, b + BATCH);
    const results = await Promise.all(batch.map(([g, r]) => aiCanGiveTo(g, r)));
    batch.forEach(([giver, receiver], idx) => {
      matrix.set(`${giver.listingId}->${receiver.listingId}`, results[idx]);
    });
    if (b + BATCH < pairs.length) await new Promise(r => setTimeout(r, 300));
  }
  return matrix;
}

export async function findCircularMatches(users) {
  let compat;
  try {
    compat = await buildCompatibilityMatrix(users);
  } catch (err) {
    console.error("[AI] Matrix failed:", err.message);
    return [];
  }

  const capped = users.slice(0, 10);
  const seen = new Set();
  const matches = [];

  function canGiveTo(a, b) {
    return compat.get(`${a.listingId}->${b.listingId}`) === true;
  }

  function addMatch(chain) {
    // Sort listing IDs for canonical key — deduplicates same group in different rotations
    const key = chain.map(u => u.listingId).sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    matches.push([...chain]);
    console.log(`[AI] CIRCLE: ${chain.map(u => `${u.display_name}(${u.listingTitle})`).join(' -> ')} -> back to ${chain[0].display_name}`);
  }

  // DFS: finds circles of length 2-6.
  // Stops as soon as a circle closes — prevents one user appearing in every longer chain.
  function dfs(chain) {
    const first = chain[0];
    const last  = chain[chain.length - 1];

    if (chain.length >= 2 && canGiveTo(last, first)) {
      addMatch(chain);
      return;
    }
    if (chain.length >= 6) return;

    for (const next of capped) {
      if (chain.some(u => u.listingId === next.listingId)) continue;
      if (!canGiveTo(last, next)) continue;
      dfs([...chain, next]);
    }
  }

  for (const user of capped) {
    dfs([user]);
  }

  console.log(`[AI] Done. ${matches.length} circle(s) found.`);
  return matches;
}
