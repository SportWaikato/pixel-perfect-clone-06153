-- Movement Measures Survey — aligned with MWYS 2024 and Voice of Rangatahi 2023.
-- Captures movement volume, location, type, satisfaction, barriers, and improvement priorities.
-- Runs alongside existing app-experience surveys.

-- 1. New survey record
INSERT INTO surveys (id, name, description, survey_type, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Movement Measures Survey',
  'Help Sport Waikato understand how you move and what would help you move more.',
  'movement_measures',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. Survey questions

--- MOVEMENT VOLUME ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000001',
  'In the last 7 days, on how many days were you physically active for at least 60 minutes?',
  'single_select',
  '["0","1","2","3","4","5","6","7"]'::jsonb,
  1, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000020',
  'b0000000-0000-0000-0000-000000000001',
  'In a usual week, about how many total hours are you physically active?',
  'single_select',
  '["0 hours","1-3 hours","4-5 hours","6+ hours"]'::jsonb,
  2, true
) ON CONFLICT (id) DO NOTHING;

--- MOVEMENT LOCATION ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000030',
  'b0000000-0000-0000-0000-000000000001',
  'Where did your physical activity happen this term?',
  'single_select',
  '["At or for school/kura","Outside school/kura","Both"]'::jsonb,
  3, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000040',
  'b0000000-0000-0000-0000-000000000001',
  'If outside school, where did you do it?',
  'multi_select',
  '["Club","Representative sport","With whaanau/family","With friends","On my own","Other"]'::jsonb,
  4, false
) ON CONFLICT (id) DO NOTHING;

--- ACTIVITY TYPE ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000050',
  'b0000000-0000-0000-0000-000000000001',
  'Which activities have you done this term or this school year?',
  'multi_select',
  '["PE class","Competitive sport","Break/lunchtime activity","Other organised activity","Games/tag/dodgeball/four square","Walking","Running/jogging","Swimming","Cycling/biking","Workout/gym/fitness","Netball","Football/soccer","Basketball","Rugby/touch/tag","Volleyball","Dance","Kapa haka","Athletics/cross-country","Other","None"]'::jsonb,
  5, true
) ON CONFLICT (id) DO NOTHING;

--- SATISFACTION ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000060',
  'b0000000-0000-0000-0000-000000000001',
  'Overall, how satisfied are you with your physical activity experience at school/kura?',
  'single_select',
  '["Extremely dissatisfied","Dissatisfied","Satisfied","Very satisfied","Extremely satisfied"]'::jsonb,
  6, true
) ON CONFLICT (id) DO NOTHING;

--- BELONGING & INCLUSION ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000070',
  'b0000000-0000-0000-0000-000000000001',
  'I feel happy to go to school/kura.',
  'single_select',
  '["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"]'::jsonb,
  7, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000080',
  'b0000000-0000-0000-0000-000000000001',
  'I feel like I belong at school/kura.',
  'single_select',
  '["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"]'::jsonb,
  8, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000090',
  'b0000000-0000-0000-0000-000000000001',
  'I feel welcomed and included in physical activity/sport at school/kura.',
  'single_select',
  '["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"]'::jsonb,
  9, true
) ON CONFLICT (id) DO NOTHING;

--- WANTING TO DO MORE ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000100',
  'b0000000-0000-0000-0000-000000000001',
  'Would you like to do more physical activity at school/kura?',
  'single_select',
  '["Yes","No"]'::jsonb,
  10, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000110',
  'b0000000-0000-0000-0000-000000000001',
  'Would you like to do more physical activity outside school/kura?',
  'single_select',
  '["Yes","No"]'::jsonb,
  11, true
) ON CONFLICT (id) DO NOTHING;

--- BARRIERS ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000120',
  'b0000000-0000-0000-0000-000000000001',
  'What stops you from being more active? Select all that apply.',
  'multi_select',
  '["Too busy","Too tired / do not have the energy","I prefer to do other things","I already do enough physical activity","It is too hard to motivate myself","I am not confident enough","I have no one to do it with","My friends are not physically active","I am not fit enough","PE is not often enough","I do not like other people seeing me being physically active","I do not want to fail","I do not feel welcome or included","Cost","Transport","Lack of time after school","Other"]'::jsonb,
  12, true
) ON CONFLICT (id) DO NOTHING;

--- IMPROVEMENT PRIORITIES ---
INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000130',
  'b0000000-0000-0000-0000-000000000001',
  'What would you like improved at school/kura? Select all that apply.',
  'multi_select',
  '["Range of activities/sports on offer","Playing/training venues, fields or courts","Facilities such as changing rooms or toilets","PE or sports uniform","Timing of trials, competitions or training","School culture around physical activity","Development opportunities or programmes","Quality of coaches or instructors","Cost","Information about physical activity opportunities","Competitive and social options","Opportunity to learn new skills","I would not improve anything","Other"]'::jsonb,
  13, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
VALUES (
  'b0000000-0000-0000-0000-000000000140',
  'b0000000-0000-0000-0000-000000000001',
  'Which one is most important to improve?',
  'single_select',
  '["Range of activities/sports on offer","Playing/training venues, fields or courts","Facilities such as changing rooms or toilets","PE or sports uniform","Timing of trials, competitions or training","School culture around physical activity","Development opportunities or programmes","Quality of coaches or instructors","Cost","Information about physical activity opportunities","Competitive and social options","Opportunity to learn new skills","Nothing"]'::jsonb,
  14, true
) ON CONFLICT (id) DO NOTHING;
