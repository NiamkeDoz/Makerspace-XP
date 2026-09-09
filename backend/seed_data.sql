-- Test/demo data for local development. Wipes existing members/taps first.
-- Run with: docker compose exec -T db psql -U makerspace -d makerspace_xp < backend/seed_data.sql

DELETE FROM taps;
DELETE FROM members;

INSERT INTO members (tag_id, name, points_balance, current_streak, longest_streak, last_tap_date, created_at) VALUES
('tag-alice',   'Alice Nguyen',   890, 12, 22, CURRENT_DATE,     now() - interval '140 days'),
('tag-bob',     'Bob Rivera',     340,  3,  9, CURRENT_DATE,     now() - interval '60 days'),
('tag-carol',   'Carol Simmons', 1520, 34, 34, CURRENT_DATE,     now() - interval '210 days'),
('tag-dana',    'Dana Whitfield',  60,  1,  4, CURRENT_DATE - 1, now() - interval '10 days'),
('tag-eli',     'Eli Franks',     210,  0,  6, CURRENT_DATE - 3, now() - interval '75 days'),
('tag-farah',   'Farah Idris',    980, 18, 18, CURRENT_DATE,     now() - interval '95 days'),
('tag-grant',   'Grant Okafor',    15,  1,  1, CURRENT_DATE,     now() - interval '2 days'),
('tag-hana',    'Hana Kobayashi', 505,  0, 11, CURRENT_DATE - 5, now() - interval '130 days');

-- A handful of tap rows so total_visits isn't zero for the busier members
INSERT INTO taps (member_id, reader_id, timestamp, points_awarded)
SELECT m.id, 'door-1', now() - (n || ' days')::interval, 10
FROM members m
CROSS JOIN generate_series(1, CASE m.tag_id
  WHEN 'tag-carol' THEN 30
  WHEN 'tag-alice'  THEN 20
  WHEN 'tag-farah'  THEN 15
  WHEN 'tag-bob'    THEN 8
  WHEN 'tag-hana'   THEN 6
  WHEN 'tag-eli'    THEN 4
  WHEN 'tag-dana'   THEN 2
  ELSE 1
END) AS n
WHERE m.tag_id IN ('tag-alice','tag-bob','tag-carol','tag-dana','tag-eli','tag-farah','tag-grant','tag-hana');
