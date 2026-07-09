const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
if (!TOKEN) { console.error("Set SUPABASE_ACCESS_TOKEN env var"); process.exit(1); }
const URL = "https://api.supabase.com/v1/projects/zxxhjkruhwjondrbftaf/database/query";

const questions = [
  { id: "b0000000-0000-0000-0000-000000000040", q: "If outside school, where did you do it?", type: "multi_select", opts: ["Club","Representative sport","With whaanau/family","With friends","On my own","Other"], order: 4, req: false },
  { id: "b0000000-0000-0000-0000-000000000050", q: "Which activities have you done this term or this school year?", type: "multi_select", opts: ["PE class","Competitive sport","Break/lunchtime activity","Other organised activity","Games/tag/dodgeball/four square","Walking","Running/jogging","Swimming","Cycling/biking","Workout/gym/fitness","Netball","Football/soccer","Basketball","Rugby/touch/tag","Volleyball","Dance","Kapa haka","Athletics/cross-country","Other","None"], order: 5, req: true },
  { id: "b0000000-0000-0000-0000-000000000060", q: "Overall, how satisfied are you with your physical activity experience at school/kura?", type: "single_select", opts: ["Extremely dissatisfied","Dissatisfied","Satisfied","Very satisfied","Extremely satisfied"], order: 6, req: true },
  { id: "b0000000-0000-0000-0000-000000000070", q: "I feel happy to go to school/kura.", type: "single_select", opts: ["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"], order: 7, req: true },
  { id: "b0000000-0000-0000-0000-000000000080", q: "I feel like I belong at school/kura.", type: "single_select", opts: ["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"], order: 8, req: true },
  { id: "b0000000-0000-0000-0000-000000000090", q: "I feel welcomed and included in physical activity/sport at school/kura.", type: "single_select", opts: ["Strongly disagree","Disagree","Neither agree nor disagree","Agree","Strongly agree"], order: 9, req: true },
  { id: "b0000000-0000-0000-0000-000000000100", q: "Would you like to do more physical activity at school/kura?", type: "single_select", opts: ["Yes","No"], order: 10, req: true },
  { id: "b0000000-0000-0000-0000-000000000110", q: "Would you like to do more physical activity outside school/kura?", type: "single_select", opts: ["Yes","No"], order: 11, req: true },
  { id: "b0000000-0000-0000-0000-000000000120", q: "What stops you from being more active? Select all that apply.", type: "multi_select", opts: ["Too busy","Too tired / do not have the energy","I prefer to do other things","I already do enough physical activity","It is too hard to motivate myself","I am not confident enough","I have no one to do it with","My friends are not physically active","I am not fit enough","PE is not often enough","I do not like other people seeing me being physically active","I do not want to fail","I do not feel welcome or included","Cost","Transport","Lack of time after school","Other"], order: 12, req: true },
  { id: "b0000000-0000-0000-0000-000000000130", q: "What would you like improved at school/kura? Select all that apply.", type: "multi_select", opts: ["Range of activities/sports on offer","Playing/training venues, fields or courts","Facilities such as changing rooms or toilets","PE or sports uniform","Timing of trials, competitions or training","School culture around physical activity","Development opportunities or programmes","Quality of coaches or instructors","Cost","Information about physical activity opportunities","Competitive and social options","Opportunity to learn new skills","I would not improve anything","Other"], order: 13, req: true },
  { id: "b0000000-0000-0000-0000-000000000140", q: "Which one is most important to improve?", type: "single_select", opts: ["Range of activities/sports on offer","Playing/training venues, fields or courts","Facilities such as changing rooms or toilets","PE or sports uniform","Timing of trials, competitions or training","School culture around physical activity","Development opportunities or programmes","Quality of coaches or instructors","Cost","Information about physical activity opportunities","Competitive and social options","Opportunity to learn new skills","Nothing"], order: 14, req: true },
];

async function seed() {
  for (const q of questions) {
    const sql = `INSERT INTO survey_questions (id, survey_id, question_text, question_type, answer_options, display_order, is_required)
      VALUES ('${q.id}', 'b0000000-0000-0000-0000-000000000001', '${q.q.replace(/'/g, "''")}', '${q.type}',
        '${JSON.stringify(q.opts).replace(/'/g, "''")}'::jsonb, ${q.order}, ${q.req})
      ON CONFLICT (id) DO NOTHING;`;

    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    const json = await res.json();
    if (Array.isArray(json) || json.length === 0) {
      console.log(`✓ ${q.id.slice(-3)}`);
    } else {
      console.error(`✗ ${q.id.slice(-3)}:`, JSON.stringify(json).slice(0, 100));
    }
  }
}

seed().then(() => console.log("Done")).catch(console.error);
