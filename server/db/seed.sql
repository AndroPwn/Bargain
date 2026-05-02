-- Dev users
INSERT INTO users (id, phone, display_name, neighborhood, geohash, karma, karma_tier, is_dev_user) VALUES
  ('a1000000-0000-0000-0000-000000000001', '+910000000001', 'Riya',  'Koramangala', 'tdr1u', 340, 'guardian', TRUE),
  ('a1000000-0000-0000-0000-000000000002', '+910000000002', 'Arjun', 'HSR Layout',  'tdr1g', 120, 'neighbor', TRUE),
  ('a1000000-0000-0000-0000-000000000003', '+910000000003', 'Kabir', 'Indiranagar', 'tdr1v', 45,  'seedling', TRUE),
  ('a1000000-0000-0000-0000-000000000004', '+910000000004', 'Priya', 'Bellandur',   'tdr1t', 0,   'seedling', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Listings with DIFFERENT categories from the want — only AI can see the semantic match
INSERT INTO listings (id, user_id, title, description, category, condition, neighborhood, geohash, status) VALUES
  -- Riya lists a winter coat (clothes) but wants something to study with
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'North Face Puffer Jacket', 'Warm winter puffer, size M, barely worn, navy blue.',
   'clothes', 'good', 'Koramangala', 'tdr1u', 'active'),

  -- Arjun lists a desk lamp (electronics) but wants something warm to wear
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
   'LED Desk Lamp', 'Adjustable brightness, USB powered, perfect for studying.',
   'electronics', 'good', 'HSR Layout', 'tdr1g', 'active'),

  -- Kabir lists a calculus textbook (books) but wants lighting for his room
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
   'Calculus by Thomas', '13th edition, good condition, some pencil marks.',
   'books', 'fair', 'Indiranagar', 'tdr1v', 'active'),

  -- Priya lists a yoga mat (other) but wants reading material
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
   'Yoga Mat', 'Purple, 6mm thick, non-slip, barely used.',
   'other', 'good', 'Bellandur', 'tdr1t', 'active')
ON CONFLICT (id) DO NOTHING;

-- Wants paired to listings — deliberately mismatched categories
-- Riya (clothes) wants something to help her study → books
-- Arjun (electronics) wants something warm → clothes
-- Kabir (books) wants better lighting → electronics
-- Circle: Riya→Arjun→Kabir→Riya (AI must match coat→study, lamp→warm, book→lighting)
INSERT INTO wants (user_id, category, item_name, description, listing_id, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'books',       'Study material',  'Anything for engineering or science, textbook or notes',  'c1000000-0000-0000-0000-000000000001', TRUE),
  ('a1000000-0000-0000-0000-000000000002', 'clothes',     'Something warm',  'A jacket or hoodie for winter, size M',                    'c1000000-0000-0000-0000-000000000002', TRUE),
  ('a1000000-0000-0000-0000-000000000003', 'electronics', 'Room lighting',   'A lamp or any light source for my desk or room',           'c1000000-0000-0000-0000-000000000003', TRUE),
  ('a1000000-0000-0000-0000-000000000004', 'books',       'Any good book',   'Fiction, self-help, anything interesting',                 'c1000000-0000-0000-0000-000000000004', TRUE)
ON CONFLICT DO NOTHING;

-- NGOs
INSERT INTO ngos (id, name, description, area, verified) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Goonj Bangalore',  'Cloth for work — dignified resource distribution', 'Bangalore', TRUE),
  ('b1000000-0000-0000-0000-000000000002', 'Akshaya Patra',    'Mid-day meals for school children',                'Bangalore', TRUE),
  ('b1000000-0000-0000-0000-000000000003', 'iCall Foundation', 'Books and stationery for underprivileged kids',    'Bangalore', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ngo_wants (ngo_id, category, description, quantity) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'clothes',     'Winter jackets any size',         20),
  ('b1000000-0000-0000-0000-000000000001', 'clothes',     'School uniforms size 8-12 years', 15),
  ('b1000000-0000-0000-0000-000000000002', 'food',        'Rice / Dal / dry groceries',      50),
  ('b1000000-0000-0000-0000-000000000003', 'books',       'Textbooks class 6-10',            30),
  ('b1000000-0000-0000-0000-000000000003', 'electronics', 'Working calculators',             10)
ON CONFLICT DO NOTHING;

INSERT INTO food_listings (user_id, title, quantity, available_until, neighborhood, geohash, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Leftover Biryani',    'Serves 3', NOW() + INTERVAL '3 hours', 'Koramangala', 'tdr1u', 'available'),
  ('a1000000-0000-0000-0000-000000000002', 'Dal + Rice (packed)', 'Serves 2', NOW() + INTERVAL '2 hours', 'HSR Layout',  'tdr1g', 'available')
ON CONFLICT DO NOTHING;

INSERT INTO karma_events (user_id, delta, reason) VALUES
  ('a1000000-0000-0000-0000-000000000001', 25, 'ngo_donation'),
  ('a1000000-0000-0000-0000-000000000001', 25, 'ngo_donation'),
  ('a1000000-0000-0000-0000-000000000001', 15, 'donation'),
  ('a1000000-0000-0000-0000-000000000001', 10, 'handshake'),
  ('a1000000-0000-0000-0000-000000000001', 15, 'donation'),
  ('a1000000-0000-0000-0000-000000000001', 10, 'handshake'),
  ('a1000000-0000-0000-0000-000000000001', 20, 'food_donation'),
  ('a1000000-0000-0000-0000-000000000001', 15, 'donation'),
  ('a1000000-0000-0000-0000-000000000001', 10, 'handshake')
ON CONFLICT DO NOTHING;
