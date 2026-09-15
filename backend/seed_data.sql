-- Test/demo data for local development. Wipes existing members/taps/visits/badges first.
-- Run with: docker compose exec -T db psql -U makerspace -d makerspace_xp < backend/seed_data.sql

DELETE FROM member_badges;
DELETE FROM visits;
DELETE FROM taps;
DELETE FROM members;

-- xp/level/lifetime_xp mirror points_balance (tap-in earns both at the same rate);
-- level is precomputed from backend/app/xp_rules.py's thresholds.
INSERT INTO members (tag_id, name, points_balance, current_streak, longest_streak, xp, level, lifetime_xp, last_tap_date, created_at) VALUES
('tag-alice',   'Alice Nguyen',   890, 12, 22,  890, 3, 890, CURRENT_DATE,     now() - interval '140 days'),
('tag-bob',     'Bob Rivera',     150,  3,  9,  150, 2, 150, CURRENT_DATE,     now() - interval '60 days'),
('tag-carol',   'Carol Simmons', 1520, 34, 34, 1520, 4, 1520, CURRENT_DATE,     now() - interval '210 days'),
('tag-dana',    'Dana Whitfield',  60,  1,  4,   60, 1, 60, CURRENT_DATE - 1, now() - interval '10 days'),
('tag-eli',     'Eli Franks',     100,  0,  6,  100, 2, 100, CURRENT_DATE - 3, now() - interval '75 days'),
('tag-farah',   'Farah Idris',    980, 18, 18,  980, 4, 980, CURRENT_DATE,     now() - interval '95 days'),
('tag-grant',   'Grant Okafor',    15,  1,  1,   15, 1, 15, CURRENT_DATE,     now() - interval '2 days'),
('tag-hana',    'Hana Kobayashi', 505,  0, 11,  505, 3, 505, CURRENT_DATE - 5, now() - interval '130 days'),
('tag-sam',     'Sam Johnson',   1200, 20, 25, 1200, 4, 1200, CURRENT_DATE,     now() - interval '165 days'),
('tag-rachel',  'Rachel Emmons',  675,  9, 14,  675, 3, 675, CURRENT_DATE,     now() - interval '80 days'),
('tag-vince',   'Vince Maier',    180,  2,  3,  180, 2, 180, CURRENT_DATE,     now() - interval '15 days'),
('tag-jason',   'Jason Sandberg',1800, 40, 40, 1800, 5, 1800, CURRENT_DATE,     now() - interval '250 days'),
('tag-jesse',   'Jesse Blunt',    230,  5,  7,  230, 2, 230, CURRENT_DATE - 2, now() - interval '40 days'),
('tag-jon',     'Jon-Richard Little', 310, 6, 10, 310, 2, 310, CURRENT_DATE,  now() - interval '55 days');

-- A handful of tap rows so total_visits isn't zero for the busier members
INSERT INTO taps (member_id, reader_id, timestamp, points_awarded)
SELECT m.id, 'door-1', now() - (n || ' days')::interval, 10
FROM members m
CROSS JOIN generate_series(1, CASE m.tag_id
  WHEN 'tag-jason'  THEN 35
  WHEN 'tag-carol'  THEN 30
  WHEN 'tag-sam'    THEN 25
  WHEN 'tag-alice'  THEN 20
  WHEN 'tag-farah'  THEN 15
  WHEN 'tag-rachel' THEN 12
  WHEN 'tag-bob'    THEN 8
  WHEN 'tag-hana'   THEN 6
  WHEN 'tag-jon'    THEN 5
  WHEN 'tag-jesse'  THEN 5
  WHEN 'tag-eli'    THEN 4
  WHEN 'tag-vince'  THEN 3
  WHEN 'tag-dana'   THEN 2
  ELSE 1
END) AS n
WHERE m.tag_id IN (
  'tag-alice','tag-bob','tag-carol','tag-dana','tag-eli','tag-farah','tag-grant','tag-hana',
  'tag-sam','tag-rachel','tag-vince','tag-jason','tag-jesse','tag-jon'
);

-- A closed visit (check-in + check-out) per seeded tap, so total_visits has real data.
-- All seeded visits are closed (nobody "currently in") — use the Tap Simulator to test
-- live occupancy instead of faking an open session here.
INSERT INTO visits (member_id, check_in, check_in_reader_id, check_out, check_out_reader_id)
SELECT member_id, timestamp, reader_id, timestamp + interval '45 minutes', reader_id
FROM taps;

-- Backfill earned badges matching the above stats (mirrors backend/app/badges.py's
-- threshold tables — keep in sync if those change). earned_at is just "now" here since
-- this is fixture data, not a real earn moment.
INSERT INTO member_badges (member_id, badge_type, threshold, name, earned_at)
SELECT m.id, 'attendance', t.threshold, t.name, now()
FROM members m
JOIN (VALUES
  (1,'First Spark'), (5,'Getting Wired'), (10,'Tinkerer'), (30,'Workbench Regular'),
  (50,'Fabricator'), (100,'Machinist'), (200,'Master Craftsman'), (300,'Shop Foreman'),
  (365,'Full Circle'), (500,'Forge Legend'), (750,'Architect of the Space'), (1000,'Founding Spirit')
) AS t(threshold, name) ON t.threshold <= (SELECT COUNT(*) FROM visits v WHERE v.member_id = m.id);

INSERT INTO member_badges (member_id, badge_type, threshold, name, earned_at)
SELECT m.id, 'streak', t.threshold, t.name, now()
FROM members m
JOIN (VALUES
  (7,'Momentum'), (14,'Consistency'), (21,'Discipline'), (30,'Habit Formed'),
  (90,'Locked In'), (180,'Unstoppable'), (270,'Relentless'), (365,'Year One')
) AS t(threshold, name) ON t.threshold <= m.longest_streak;
