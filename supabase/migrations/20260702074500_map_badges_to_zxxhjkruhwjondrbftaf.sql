-- ============================================================
-- RUN THIS IN: https://supabase.com/dashboard/project/zxxhjkruhwjondrbftaf/sql/new
-- NOT the old oaentcucszmowbhgtqra project
-- ============================================================

-- 1. Update all achievements to use the NEW badge PNGs from the badges bucket
-- The URL pattern is: https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/{filename}

UPDATE achievements SET image_filename = 'Record Breaker.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Record%20Breaker.png',
  storage_path = 'badges/Record Breaker.png', is_custom_upload = true
WHERE name ILIKE '%record breaker%';

UPDATE achievements SET image_filename = '7 day streak.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/7%20day%20streak.png',
  storage_path = 'badges/7 day streak.png', is_custom_upload = true
WHERE name ILIKE '%7 day%' OR name ILIKE '%seven day%';

UPDATE achievements SET image_filename = '30 day legend.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/30%20day%20legend.png',
  storage_path = 'badges/30 day legend.png', is_custom_upload = true
WHERE name ILIKE '%30 day%' OR name ILIKE '%legend%';

UPDATE achievements SET image_filename = 'Bring your mate.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Bring%20your%20mate.png',
  storage_path = 'badges/Bring your mate.png', is_custom_upload = true
WHERE name ILIKE '%bring%mate%' OR name ILIKE '%bring your mate%';

UPDATE achievements SET image_filename = 'Challenge Accepted.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Challenge%20Accepted.png',
  storage_path = 'badges/Challenge Accepted.png', is_custom_upload = true
WHERE name ILIKE '%challenge accepted%';

UPDATE achievements SET image_filename = 'Comeback Kid.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Comeback%20Kid.png',
  storage_path = 'badges/Comeback Kid.png', is_custom_upload = true
WHERE name ILIKE '%comeback%';

UPDATE achievements SET image_filename = 'Connect with Nature.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Connect%20with%20Nature.png',
  storage_path = 'badges/Connect with Nature.png', is_custom_upload = true
WHERE name ILIKE '%connect%nature%';

UPDATE achievements SET image_filename = 'Consistency King.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Consistency%20King.png',
  storage_path = 'badges/Consistency King.png', is_custom_upload = true
WHERE name ILIKE '%consistency%';

UPDATE achievements SET image_filename = 'First 5 Hours.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/First%205%20Hours.png',
  storage_path = 'badges/First 5 Hours.png', is_custom_upload = true
WHERE name ILIKE '%first 5 hours%';

UPDATE achievements SET image_filename = 'First steps.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/First%20steps.png',
  storage_path = 'badges/First steps.png', is_custom_upload = true
WHERE name ILIKE '%first step%';

UPDATE achievements SET image_filename = 'Getting going.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Getting%20going.png',
  storage_path = 'badges/Getting going.png', is_custom_upload = true
WHERE name ILIKE '%getting going%';

UPDATE achievements SET image_filename = 'Hikitea Te Ha.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Hikitea%20Te%20Ha.png',
  storage_path = 'badges/Hikitea Te Ha.png', is_custom_upload = true
WHERE name ILIKE '%hikitea%';

UPDATE achievements SET image_filename = 'House Hero.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/House%20Hero.png',
  storage_path = 'badges/House Hero.png', is_custom_upload = true
WHERE name ILIKE '%house hero%';

UPDATE achievements SET image_filename = 'Ka Pai Half Century.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Ka%20Pai%20Half%20Century.png',
  storage_path = 'badges/Ka Pai Half Century.png', is_custom_upload = true
WHERE name ILIKE '%ka pai%';

UPDATE achievements SET image_filename = 'Momentum Builder.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Momentum%20Builder.png',
  storage_path = 'badges/Momentum Builder.png', is_custom_upload = true
WHERE name ILIKE '%momentum%';

UPDATE achievements SET image_filename = 'Movement Machine.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Movement%20Machine.png',
  storage_path = 'badges/Movement Machine.png', is_custom_upload = true
WHERE name ILIKE '%movement machine%';

UPDATE achievements SET image_filename = 'Movement Master.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Movement%20Master.png',
  storage_path = 'badges/Movement Master.png', is_custom_upload = true
WHERE name ILIKE '%movement master%';

UPDATE achievements SET image_filename = 'On Your Bike.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/On%20Your%20Bike.png',
  storage_path = 'badges/On Your Bike.png', is_custom_upload = true
WHERE name ILIKE '%on your bike%';

UPDATE achievements SET image_filename = 'School Legend.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/School%20Legend.png',
  storage_path = 'badges/School Legend.png', is_custom_upload = true
WHERE name ILIKE '%school legend%';

UPDATE achievements SET image_filename = 'Team player.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Team%20player.png',
  storage_path = 'badges/Team player.png', is_custom_upload = true
WHERE name ILIKE '%team player%';

UPDATE achievements SET image_filename = 'Unstoppable.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Unstoppable.png',
  storage_path = 'badges/Unstoppable.png', is_custom_upload = true
WHERE name ILIKE '%unstoppable%';

UPDATE achievements SET image_filename = 'Variety Champion.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Variety%20Champion.png',
  storage_path = 'badges/Variety Champion.png', is_custom_upload = true
WHERE name ILIKE '%variety champion%';

UPDATE achievements SET image_filename = 'Walk & Talk.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Walk%20%26%20Talk.png',
  storage_path = 'badges/Walk & Talk.png', is_custom_upload = true
WHERE name ILIKE '%walk%talk%';

UPDATE achievements SET image_filename = '3 day starter.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/3%20day%20starter.png',
  storage_path = 'badges/3 day starter.png', is_custom_upload = true
WHERE name ILIKE '%3 day%starter%';

UPDATE achievements SET image_filename = '10 Hour Hero.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/10%20Hour%20Hero.png',
  storage_path = 'badges/10 Hour Hero.png', is_custom_upload = true
WHERE name ILIKE '%10 hour%';

UPDATE achievements SET image_filename = '14 day warrior.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/14%20day%20warrior.png',
  storage_path = 'badges/14 day warrior.png', is_custom_upload = true
WHERE name ILIKE '%14 day%warrior%';

UPDATE achievements SET image_filename = '100 Hour Club.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/100%20Hour%20Club.png',
  storage_path = 'badges/100 Hour Club.png', is_custom_upload = true
WHERE name ILIKE '%100 hour%';

UPDATE achievements SET image_filename = '100 Logged Entries.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/100%20Logged%20Entries.png',
  storage_path = 'badges/100 Logged Entries.png', is_custom_upload = true
WHERE name ILIKE '%100 logged%';

UPDATE achievements SET image_filename = '200 Double Century.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/200%20Double%20Century.png',
  storage_path = 'badges/200 Double Century.png', is_custom_upload = true
WHERE name ILIKE '%double century%' OR name ILIKE '%200%';

UPDATE achievements SET image_filename = 'Leaderboard Champ.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Leaderboard%20Champ.png',
  storage_path = 'badges/Leaderboard Champ.png', is_custom_upload = true
WHERE name ILIKE '%leaderboard champ%';

-- House-level badges
UPDATE achievements SET image_filename = 'Challenge Champions.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Challenge%20Champions.png',
  storage_path = 'badges/Challenge Champions.png', is_custom_upload = true
WHERE name ILIKE '%challenge champions%';

UPDATE achievements SET image_filename = 'Consistency House.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Consistency%20House.png',
  storage_path = 'badges/Consistency House.png', is_custom_upload = true
WHERE name ILIKE '%consistency house%';

UPDATE achievements SET image_filename = 'Most Active House.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Most%20Active%20House.png',
  storage_path = 'badges/Most Active House.png', is_custom_upload = true
WHERE name ILIKE '%most active%';

UPDATE achievements SET image_filename = 'Participation Champions.png',
  storage_url = 'https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/Participation%20Champions.png',
  storage_path = 'badges/Participation Champions.png', is_custom_upload = true
WHERE name ILIKE '%participation champions%';

-- Verify the results
SELECT name, storage_url FROM achievements ORDER BY name;
