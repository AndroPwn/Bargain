import pool from './src/db/pool.js';
import { findCircularMatches } from './src/services/trustEngine.js';

const { rows } = await pool.query(`
  SELECT u.id, u.display_name, u.karma, u.geohash,
         l.id AS listing_id, l.title AS listing_title, l.image_url AS listing_image_url,
         l.category AS listing_category, l.description AS listing_description,
         w.category AS want_category, w.item_name AS want_item_name, w.description AS want_description
  FROM users u
  JOIN listings l ON l.user_id = u.id AND l.status = 'active'
  JOIN wants w ON w.listing_id = l.id AND w.is_active = TRUE
`);

console.log('candidates:');
rows.forEach(c => console.log(' -', c.display_name + ':', c.listing_title, '->', c.want_item_name));

const candidates = rows.map(c => ({
  id: c.id, karma: c.karma, display_name: c.display_name,
  listingId: c.listing_id, listingTitle: c.listing_title,
  listingImageUrl: c.listing_image_url, listingCategory: c.listing_category,
  listingDescription: c.listing_description, wantCategory: c.want_category,
  wantItemName: c.want_item_name, wantDescription: c.want_description,
}));

const matches = await findCircularMatches(candidates);
console.log('matches found:', matches.length);
matches.forEach((chain, i) => console.log('match', i, ':', chain.map(u => u.display_name).join(' -> ')));
await pool.end();
