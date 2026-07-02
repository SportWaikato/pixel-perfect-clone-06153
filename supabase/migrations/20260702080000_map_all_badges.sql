-- ============================================================
-- RUN THIS in project: zxxhjkruhwjondrbftaf SQL Editor
-- Fixes ALL badge URLs to point to the correct Supabase project
-- ============================================================

-- Map achievement names to the new PNG filenames in the badges bucket
-- Pattern: https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/{filename}

-- === NEW BADGES (direct match to the 30 PNGs) ===

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Record%20Breaker.png',
  storage_path = 'badges/Record Breaker.png', is_custom_upload = true
WHERE name ILIKE '%record breaker%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/7%20day%20streak.png',
  storage_path = 'badges/7 day streak.png', is_custom_upload = true
WHERE name ILIKE '%7 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/30%20day%20legend.png',
  storage_path = 'badges/30 day legend.png', is_custom_upload = true
WHERE name ILIKE '%30 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Bring%20your%20mate.png',
  storage_path = 'badges/Bring your mate.png', is_custom_upload = true
WHERE name ILIKE '%bring%mate%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Challenge%20Accepted.png',
  storage_path = 'badges/Challenge Accepted.png', is_custom_upload = true
WHERE name ILIKE '%challenge accepted%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Comeback%20Kid.png',
  storage_path = 'badges/Comeback Kid.png', is_custom_upload = true
WHERE name ILIKE '%comeback%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Connect%20with%20Nature.png',
  storage_path = 'badges/Connect with Nature.png', is_custom_upload = true
WHERE name ILIKE '%connect%nature%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Consistency%20King.png',
  storage_path = 'badges/Consistency King.png', is_custom_upload = true
WHERE name ILIKE '%consistency%king%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/First%205%20Hours.png',
  storage_path = 'badges/First 5 Hours.png', is_custom_upload = true
WHERE name ILIKE '%first 5 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/First%20steps.png',
  storage_path = 'badges/First steps.png', is_custom_upload = true
WHERE name ILIKE '%first step%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Getting%20going.png',
  storage_path = 'badges/Getting going.png', is_custom_upload = true
WHERE name ILIKE '%getting going%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Hikitea%20Te%20Ha.png',
  storage_path = 'badges/Hikitea Te Ha.png', is_custom_upload = true
WHERE name ILIKE '%hikitea%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/House%20Hero.png',
  storage_path = 'badges/House Hero.png', is_custom_upload = true
WHERE name ILIKE '%house hero%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Ka%20Pai%20Half%20Century.png',
  storage_path = 'badges/Ka Pai Half Century.png', is_custom_upload = true
WHERE name ILIKE '%ka pai%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Momentum%20Builder.png',
  storage_path = 'badges/Momentum Builder.png', is_custom_upload = true
WHERE name ILIKE '%momentum builder%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Movement%20Machine.png',
  storage_path = 'badges/Movement Machine.png', is_custom_upload = true
WHERE name ILIKE '%movement machine%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Movement%20Master.png',
  storage_path = 'badges/Movement Master.png', is_custom_upload = true
WHERE name ILIKE '%movement master%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/On%20Your%20Bike.png',
  storage_path = 'badges/On Your Bike.png', is_custom_upload = true
WHERE name ILIKE '%on your bike%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/School%20Legend.png',
  storage_path = 'badges/School Legend.png', is_custom_upload = true
WHERE name ILIKE '%school legend%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Team%20player.png',
  storage_path = 'badges/Team player.png', is_custom_upload = true
WHERE name ILIKE '%team player%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Unstoppable.png',
  storage_path = 'badges/Unstoppable.png', is_custom_upload = true
WHERE name ILIKE '%unstoppable%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Variety%20Champion.png',
  storage_path = 'badges/Variety Champion.png', is_custom_upload = true
WHERE name ILIKE '%variety champion%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Walk%20%26%20Talk.png',
  storage_path = 'badges/Walk & Talk.png', is_custom_upload = true
WHERE name ILIKE '%walk%talk%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/3%20day%20starter.png',
  storage_path = 'badges/3 day starter.png', is_custom_upload = true
WHERE name ILIKE '%3 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/10%20Hour%20Hero.png',
  storage_path = 'badges/10 Hour Hero.png', is_custom_upload = true
WHERE name ILIKE '%10 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/14%20day%20warrior.png',
  storage_path = 'badges/14 day warrior.png', is_custom_upload = true
WHERE name ILIKE '%14 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/100%20Hour%20Club.png',
  storage_path = 'badges/100 Hour Club.png', is_custom_upload = true
WHERE name ILIKE '%100 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/100%20Logged%20Entries.png',
  storage_path = 'badges/100 Logged Entries.png', is_custom_upload = true
WHERE name ILIKE '%100 logged%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/200%20Double%20Century.png',
  storage_path = 'badges/200 Double Century.png', is_custom_upload = true
WHERE name ILIKE '%double century%' OR name ILIKE '%200 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Leaderboard%20Champ.png',
  storage_path = 'badges/Leaderboard Champ.png', is_custom_upload = true
WHERE name ILIKE '%leaderboard%' AND name NOT ILIKE '%champ%';

-- === LEGACY BADGES (map to closest new PNG) ===

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/30%20day%20legend.png',
  storage_path = 'badges/30 day legend.png', is_custom_upload = true
WHERE name ILIKE '%1 month%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/14%20day%20warrior.png',
  storage_path = 'badges/14 day warrior.png', is_custom_upload = true
WHERE name ILIKE '%10 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/14%20day%20warrior.png',
  storage_path = 'badges/14 day warrior.png', is_custom_upload = true
WHERE name ILIKE '%2 week%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/30%20day%20legend.png',
  storage_path = 'badges/30 day legend.png', is_custom_upload = true
WHERE name ILIKE '%20 day%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/10%20Hour%20Hero.png',
  storage_path = 'badges/10 Hour Hero.png', is_custom_upload = true
WHERE name ILIKE '%20 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Ka%20Pai%20Half%20Century.png',
  storage_path = 'badges/Ka Pai Half Century.png', is_custom_upload = true
WHERE name ILIKE '%30 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Ka%20Pai%20Half%20Century.png',
  storage_path = 'badges/Ka Pai Half Century.png', is_custom_upload = true
WHERE name ILIKE '%50 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/100%20Hour%20Club.png',
  storage_path = 'badges/100 Hour Club.png', is_custom_upload = true
WHERE name ILIKE '%80 hour%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Connect%20with%20Nature.png',
  storage_path = 'badges/Connect with Nature.png', is_custom_upload = true
WHERE name ILIKE '%big blue%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Movement%20Master.png',
  storage_path = 'badges/Movement Master.png', is_custom_upload = true
WHERE name ILIKE '%minute master%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Team%20player.png',
  storage_path = 'badges/Team player.png', is_custom_upload = true
WHERE name ILIKE '%team sports%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Getting%20going.png',
  storage_path = 'badges/Getting going.png', is_custom_upload = true
WHERE name ILIKE '%unlocked technology%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Momentum%20Builder.png',
  storage_path = 'badges/Momentum Builder.png', is_custom_upload = true
WHERE name ILIKE '%smashing%';

-- === HOUSE BADGES ===

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Challenge%20Champions.png',
  storage_path = 'badges/Challenge Champions.png', is_custom_upload = true
WHERE name ILIKE '%challenge champions%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Consistency%20House.png',
  storage_path = 'badges/Consistency House.png', is_custom_upload = true
WHERE name ILIKE '%consistency house%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Most%20Active%20House.png',
  storage_path = 'badges/Most Active House.png', is_custom_upload = true
WHERE name ILIKE '%most active%';

UPDATE achievements SET storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Participation%20Champions.png',
  storage_path = 'badges/Participation Champions.png', is_custom_upload = true
WHERE name ILIKE '%participation champions%';

-- Verify: no URLs should remain from oaentcucszmowbhgtqra
SELECT name, storage_url FROM achievements WHERE storage_url NOT ILIKE '%zxxhjkruhwjondrbftaf%' ORDER BY name;
