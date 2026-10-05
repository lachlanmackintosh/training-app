/* Baki Program (Lockie Training Program) — data taken from the training plan (1 Oct 2026).
   Still images (offline fallback): free-exercise-db (github.com/yuhonas/free-exercise-db), public domain (Unlicense).
   match: 'exact' = same movement; 'closest' = nearest real image available; null = link-only. */

// Movement library. Key = movement name used for logging/history.
const MOV = {
  // ---------- Day A ----------
  'Med-ball slam': { img: 'Overhead_Slam', match: 'exact', src: 'Overhead Slam', cue: 'Reach tall with the ball overhead, then slam it through the floor using hips and abs. Every rep fast.' },
  'Kettlebell swing': { img: 'One-Arm_Kettlebell_Swings', match: 'closest', src: 'One-Arm Kettlebell Swing (use two hands)', cue: 'Hinge, don\u2019t squat. Snap the hips forward so the bell floats to chest height; arms just guide it.', lower: true },
  'Broad jump': { img: 'Standing_Long_Jump', match: 'exact', src: 'Standing Long Jump', cue: 'Big arm swing, jump out as far as you can and stick a soft landing. Reset between reps.', lower: true, bw: true },
  'Box jump': { img: 'Front_Box_Jump', match: 'exact', src: 'Front Box Jump', cue: 'Swing the arms, jump up and land soft in a half squat. Step down, don\u2019t jump down.', lower: true, bw: true },
  'Trap bar deadlift': { img: 'Trap_Bar_Deadlift', match: 'exact', src: 'Trap Bar Deadlift', cue: 'Stand centred, hips down, chest up. Push the floor away and stand tall. Keep your back flat.', lower: true },
  'Conventional deadlift': { img: 'Barbell_Deadlift', match: 'exact', src: 'Barbell Deadlift', cue: 'Bar over mid-foot, brace hard, pull the slack out, then push the floor away. Bar stays close to your legs.', lower: true },
  'Weighted pull-up': { added: true, img: 'Pullups', match: 'closest', src: 'Pull-up (add a belt or DB)', cue: 'Start from a dead hang, drive elbows to your ribs until your chin clears the bar. Lower for about 2 s.' },
  'Wide-grip lat pulldown': { img: 'Wide-Grip_Lat_Pulldown', match: 'exact', src: 'Wide-Grip Lat Pulldown', cue: 'Chest up, pull the bar to your upper chest by driving the elbows down. Control it back up.' },
  'Incline DB press': { img: 'Incline_Dumbbell_Press', match: 'exact', src: 'Incline Dumbbell Press', cue: 'Bench at 30\u201345\u00b0. Shoulder blades pinned, lower to the upper chest, press up and slightly in.' },
  'Incline barbell or machine press': { img: 'Barbell_Incline_Bench_Press_-_Medium_Grip', match: 'exact', src: 'Barbell Incline Bench Press', cue: 'Feet planted, shoulder blades squeezed. Lower to the upper chest, press back over the shoulders.' },
  'DB lateral raise': { img: 'Side_Lateral_Raise', match: 'exact', src: 'Side Lateral Raise', cue: 'Slight bend in the elbows, raise out to shoulder height leading with the elbows. No swinging.' },
  'Cable lateral raise': { img: 'Cable_Seated_Lateral_Raise', match: 'closest', src: 'Cable Seated Lateral Raise', cue: 'Cable from the low pulley across your body. Raise out to shoulder height, lower slowly.' },
  'Hammer curl': { img: 'Hammer_Curls', match: 'exact', src: 'Hammer Curls', cue: 'Palms facing in, elbows pinned to your sides. Squeeze at the top, lower slowly.' },
  'Skull-crusher': { img: 'EZ-Bar_Skullcrusher', match: 'exact', src: 'EZ-Bar Skullcrusher', cue: 'Elbows point at the ceiling and stay put. Lower the bar to your forehead, then extend fully.' },
  'Rope hammer curl': { img: 'Cable_Hammer_Curls_-_Rope_Attachment', match: 'exact', src: 'Cable Hammer Curls (rope)', cue: 'Rope on the low pulley, thumbs up, elbows by your sides. Curl up, squeeze, lower slowly.' },
  'Overhead DB extension': { img: 'Standing_Dumbbell_Triceps_Extension', match: 'exact', src: 'Standing Dumbbell Triceps Extension', cue: 'One DB in both hands overhead. Lower behind your head with elbows pointing up, then extend fully.' },
  'Neck curl': { img: 'Lying_Face_Up_Plate_Neck_Resistance', match: 'exact', src: 'Lying Face Up Plate Neck Resistance', cue: 'Lie face up, head off the bench, light plate on a towel on your forehead. Slow, full range. Never jerk.' },
  'Neck extension': { img: 'Lying_Face_Down_Plate_Neck_Resistance', match: 'exact', src: 'Lying Face Down Plate Neck Resistance', cue: 'Lie face down, head off the bench, light plate on the back of your head. Slow, full range.' },
  'Plate-loaded neck harness': { img: 'Seated_Head_Harness_Neck_Resistance', match: 'exact', src: 'Seated Head Harness Neck Resistance', cue: 'Light weight on the harness. Nod slowly through a full range, pause, control the way back.' },
  'Dead hang': { img: 'One_Handed_Hang', match: 'closest', src: 'One Handed Hang (use both hands)', cue: 'Hang from the bar with both hands, shoulders lightly engaged, breathe. Hold as long as you can.', metric: 'sec', bw: true },
  'Farmer hold': { img: 'Farmers_Walk', match: 'closest', src: 'Farmer\u2019s Walk (stand still)', cue: 'Pick up heavy DBs, stand tall, shoulders down. Hold as long as you can.', metric: 'sec' },

  // ---------- Day B ----------
  'Squat jump': { img: 'Freehand_Jump_Squat', match: 'exact', src: 'Freehand Jump Squat', cue: 'Quick dip to half squat, jump as high as you can, land soft and reset.', lower: true, bw: true },
  'Med-ball chest pass': { img: 'Medicine_Ball_Chest_Pass', match: 'exact', src: 'Medicine Ball Chest Pass', cue: 'Ball at your chest, step and punch it into the wall as hard as you can. Catch and reset.' },
  'Explosive push-up': { img: 'Plyo_Push-up', match: 'exact', src: 'Plyo Push-up', cue: 'Lower under control, then push so hard your hands leave the floor. Land soft with bent elbows.', bw: true },
  'Back squat': { img: 'Barbell_Squat', match: 'exact', src: 'Barbell Squat', cue: 'Bar on the upper back, brace hard. Sit down between your heels to at least parallel, drive up.', lower: true },
  'Leg press or hack squat': { img: 'Leg_Press', match: 'exact', src: 'Leg Press', cue: 'Feet shoulder width, lower until knees are near 90\u00b0 without the lower back lifting off the pad. Push through the heels.', lower: true },
  'Incline barbell bench': { img: 'Barbell_Incline_Bench_Press_-_Medium_Grip', match: 'exact', src: 'Barbell Incline Bench Press', cue: 'Feet planted, shoulder blades squeezed. Touch the upper chest, press back over the shoulders.' },
  'Flat DB bench': { img: 'Dumbbell_Bench_Press', match: 'exact', src: 'Dumbbell Bench Press', cue: 'Shoulder blades pinned, lower the DBs to chest level, elbows about 45\u00b0, press up.' },
  'Barbell row': { img: 'Bent_Over_Barbell_Row', match: 'exact', src: 'Bent Over Barbell Row', cue: 'Hinge to about 45\u00b0 with a flat back. Pull the bar to your belly button, squeeze the shoulder blades.' },
  'Chest-supported DB row': { img: 'Dumbbell_Incline_Row', match: 'exact', src: 'Dumbbell Incline Row', cue: 'Chest on an incline bench. Row the DBs to your hips, squeeze, lower slowly.' },
  'Walking lunge': { img: 'Bodyweight_Walking_Lunge', match: 'exact', src: 'Bodyweight Walking Lunge (hold DBs)', cue: 'Long step, drop the back knee close to the floor, torso upright. Push through the front heel.', lower: true },
  'Bulgarian split squat': { img: 'Split_Squat_with_Dumbbells', match: 'exact', src: 'Split Squat with Dumbbells (rear foot up)', cue: 'Rear foot on a bench, drop straight down until the front thigh is about parallel. Drive through the front foot.', lower: true },
  'Dips': { added: true, img: 'Dips_-_Chest_Version', match: 'exact', src: 'Dips (chest version)', cue: 'Lean slightly forward, lower until shoulders are just below elbows, press up. Add weight once 12 is easy.' },
  'Close-grip bench': { img: 'Close-Grip_Barbell_Bench_Press', match: 'exact', src: 'Close-Grip Barbell Bench Press', cue: 'Hands about shoulder width, elbows tucked. Lower to the lower chest, press up.' },
  'Standing calf raise': { img: 'Standing_Calf_Raises', match: 'exact', src: 'Standing Calf Raises', cue: 'Full stretch at the bottom, pause, rise all the way onto your toes. No bouncing.', lower: true },
  'Seated calf raise': { img: 'Seated_Calf_Raise', match: 'exact', src: 'Seated Calf Raise', cue: 'Full stretch at the bottom, pause, push up high and squeeze. No bouncing.', lower: true },
  'Hanging knee raise': { added: true, img: 'Hanging_Leg_Raise', match: 'closest', src: 'Hanging Leg Raise (bend your knees)', cue: 'Hang still, curl the knees up to your chest by tilting the pelvis. Lower slowly, no swinging.' },
  'Cable crunch': { img: 'Cable_Crunch', match: 'exact', src: 'Cable Crunch', cue: 'Kneel, rope by your head. Crunch your ribs down to your hips; hips stay still.' },

  // ---------- Day C ----------
  'Med-ball rotational throw': { img: 'Medicine_Ball_Full_Twist', match: 'closest', src: 'Medicine Ball Full Twist (rotation only)', cue: 'Side-on to a wall, load the back hip, then rotate hips first and throw the ball hard into the wall.' },
  'Cable woodchop (fast)': { img: 'Standing_Cable_Wood_Chop', match: 'exact', src: 'Standing Cable Wood Chop', cue: 'Arms long, pivot the back foot and rotate fast through the hips. Control the return.' },
  'Lateral bound': { img: 'Lateral_Bound', match: 'exact', src: 'Lateral Bound', cue: 'Push off the outside leg, bound sideways as far as you can, stick a soft one-leg landing.', lower: true, bw: true },
  'Skater hop': { img: 'Single-Leg_Lateral_Hop', match: 'closest', src: 'Single-Leg Lateral Hop', cue: 'Hop side to side from one leg to the other, land soft and balanced each time.', lower: true, bw: true },
  'Military press': { img: 'Standing_Military_Press', match: 'exact', src: 'Standing Military Press', cue: 'Standing, glutes and abs tight. Press straight up, head through at the top. Don\u2019t lean back.' },
  'Seated DB shoulder press': { img: 'Dumbbell_Shoulder_Press', match: 'exact', src: 'Dumbbell Shoulder Press', cue: 'Back on the pad, DBs at ear height. Press up until arms are straight, lower under control.' },
  'Romanian deadlift': { img: 'Romanian_Deadlift', match: 'exact', src: 'Romanian Deadlift', cue: 'Soft knees, push the hips back and slide the bar down your thighs until the hamstrings stretch. Squeeze glutes to stand.', lower: true },
  'DB RDL or lying leg curl': { img: 'Stiff-Legged_Dumbbell_Deadlift', match: 'closest', src: 'Stiff-Legged Dumbbell Deadlift', cue: 'Same hinge as the RDL with DBs: hips back, flat back, feel the hamstrings, stand tall.', lower: true },
  'Close-grip cable row': { img: 'Seated_Cable_Rows', match: 'exact', src: 'Seated Cable Rows', cue: 'Chest up, pull the handle to your stomach, squeeze the shoulder blades, let it stretch forward under control.' },
  'Seated machine row': { img: 'Leverage_Iso_Row', match: 'exact', src: 'Leverage Iso Row', cue: 'Chest on the pad, pull the handles back, squeeze the shoulder blades, control the return.' },
  'Rear delt fly': { img: 'Seated_Bent-Over_Rear_Delt_Raise', match: 'exact', src: 'Seated Bent-Over Rear Delt Raise', cue: 'Bent over, flat back. Lead with the elbows out wide; light weight, feel the back of the shoulders.' },
  'Shrug': { img: 'Barbell_Shrug', match: 'exact', src: 'Barbell Shrug', cue: 'Shoulders straight up to your ears, pause 1 s, lower slowly. No rolling.' },
  'Face pull': { img: 'Face_Pull', match: 'exact', src: 'Face Pull', cue: 'Rope at face height, pull to your eyes with elbows high and thumbs back. Squeeze.' },
  'DB shrug': { img: 'Dumbbell_Shrug', match: 'exact', src: 'Dumbbell Shrug', cue: 'DBs at your sides, shoulders straight up to your ears, pause, lower slowly.' },
  'Incline DB curl': { img: 'Incline_Dumbbell_Curl', match: 'exact', src: 'Incline Dumbbell Curl', cue: 'Lie back on an incline, arms hanging straight. Curl without moving the elbows forward.' },
  'Rope pushdown': { img: 'Triceps_Pushdown_-_Rope_Attachment', match: 'exact', src: 'Triceps Pushdown (rope)', cue: 'Elbows pinned to your sides, push down and spread the rope at the bottom. Control it up.' },
  'EZ bar curl': { img: 'EZ-Bar_Curl', match: 'exact', src: 'EZ-Bar Curl', cue: 'Elbows by your sides, curl up without swinging, lower for about 2 s.' },
  'Overhead cable extension': { img: 'Cable_Rope_Overhead_Triceps_Extension', match: 'exact', src: 'Cable Rope Overhead Triceps Extension', cue: 'Face away from the cable, rope behind your head. Extend forward and up, elbows stay high.' },
  'Reverse curl': { img: 'Reverse_Barbell_Curl', match: 'exact', src: 'Reverse Barbell Curl', cue: 'Overhand grip, elbows by your sides. Curl up slowly, feel the forearms.' },
  'Wrist roller': { img: 'Wrist_Roller', match: 'exact', src: 'Wrist Roller', cue: 'Arms out straight, roll the weight all the way up with your wrists, then slowly back down.' },
  'Farmer carry': { img: 'Farmers_Walk', match: 'exact', src: 'Farmer\u2019s Walk', cue: 'Heavy DBs, stand tall, shoulders down, short quick steps. Don\u2019t let the weights swing.', lower: true, metric: 'm' },
  'Trap bar hold': { img: 'Trap_Bar_Deadlift', match: 'closest', src: 'Trap Bar Deadlift (hold at the top)', cue: 'Deadlift the trap bar, then hold it at the top: stand tall, shoulders down, grip hard.', metric: 'sec' }
};

/* Exercises per day. sets/min/max = plan targets. each = 'each' text. rest in seconds.
   main = bold main lift (heavy week applies). group: explosive | main | muscle | finisher */
const PROGRAM = {
  A: { key: 'A', day: 'Monday', title: 'Session 1', focus: 'Power + Back', exercises: [
    { id: 'A1', group: 'explosive', parts: ['Med-ball slam'], sets: 3, min: 5, max: 5, rest: 60, swap: { label: 'Kettlebell swing 3 \u00d7 8', parts: ['Kettlebell swing'], sets: 3, min: 8, max: 8 } },
    { id: 'A2', group: 'explosive', parts: ['Broad jump'], sets: 3, min: 3, max: 3, rest: 60, swap: { label: 'Box jump 3 \u00d7 3', parts: ['Box jump'] } },
    { id: 'A3', group: 'main', main: true, parts: ['Trap bar deadlift'], sets: 3, min: 6, max: 8, rest: 120, swap: { label: 'Conventional deadlift', parts: ['Conventional deadlift'] } },
    { id: 'A4', group: 'main', main: true, parts: ['Weighted pull-up'], sets: 3, min: 6, max: 10, rest: 120, swap: { label: 'Wide-grip lat pulldown', parts: ['Wide-grip lat pulldown'] } },
    { id: 'A5', group: 'muscle', parts: ['Incline DB press'], sets: 3, min: 8, max: 10, rest: 90, swap: { label: 'Incline barbell or machine press', parts: ['Incline barbell or machine press'] } },
    { id: 'A6', group: 'muscle', parts: ['DB lateral raise'], sets: 4, min: 12, max: 15, rest: 60, swap: { label: 'Cable lateral raise', parts: ['Cable lateral raise'] } },
    { id: 'A7', group: 'muscle', superset: true, parts: ['Hammer curl', 'Skull-crusher'], sets: 3, min: 8, max: 10, rest: 60, swap: { label: 'Rope hammer curl + overhead DB extension', parts: ['Rope hammer curl', 'Overhead DB extension'] } },
    { id: 'A8', group: 'finisher', superset: true, parts: ['Neck curl', 'Neck extension'], sets: 2, min: 15, max: 15, each: 'each', rest: 45, swap: { label: 'Plate-loaded neck harness', parts: ['Plate-loaded neck harness'] } },
    { id: 'A9', group: 'finisher', parts: ['Dead hang'], sets: 1, maxTime: true, rest: 0, swap: { label: 'Farmer hold', parts: ['Farmer hold'] } }
  ]},
  B: { key: 'B', day: 'Wednesday', title: 'Session 2', focus: 'Legs + Chest', exercises: [
    { id: 'B1', group: 'explosive', parts: ['Box jump'], sets: 3, min: 3, max: 3, rest: 60, swap: { label: 'Squat jump', parts: ['Squat jump'] } },
    { id: 'B2', group: 'explosive', parts: ['Med-ball chest pass'], sets: 3, min: 5, max: 5, rest: 60, swap: { label: 'Explosive push-up', parts: ['Explosive push-up'] } },
    { id: 'B3', group: 'main', main: true, parts: ['Back squat'], sets: 3, min: 6, max: 8, rest: 120, swap: { label: 'Leg press or hack squat', parts: ['Leg press or hack squat'] } },
    { id: 'B4', group: 'main', main: true, parts: ['Incline barbell bench'], sets: 3, min: 6, max: 8, rest: 120, swap: { label: 'Flat DB bench', parts: ['Flat DB bench'] } },
    { id: 'B5', group: 'muscle', parts: ['Barbell row'], sets: 3, min: 8, max: 10, rest: 90, swap: { label: 'Chest-supported DB row', parts: ['Chest-supported DB row'] } },
    { id: 'B6', group: 'muscle', parts: ['Walking lunge'], sets: 3, min: 10, max: 10, each: 'each leg', rest: 90, swap: { label: 'Bulgarian split squat', parts: ['Bulgarian split squat'] } },
    { id: 'B7', group: 'muscle', parts: ['Dips'], sets: 3, min: 8, max: 12, rest: 90, swap: { label: 'Close-grip bench', parts: ['Close-grip bench'] } },
    { id: 'B8', group: 'muscle', parts: ['Standing calf raise'], sets: 3, min: 15, max: 20, rest: 60, swap: { label: 'Seated calf raise', parts: ['Seated calf raise'] } },
    { id: 'B9', group: 'muscle', parts: ['Hanging knee raise'], sets: 3, min: 10, max: 12, rest: 60, swap: { label: 'Cable crunch', parts: ['Cable crunch'] } }
  ]},
  C: { key: 'C', day: 'Friday', title: 'Session 3', focus: 'Shoulders + Arms', exercises: [
    { id: 'C1', group: 'explosive', parts: ['Med-ball rotational throw'], sets: 3, min: 5, max: 5, each: 'each side', rest: 60, swap: { label: 'Cable woodchop (fast)', parts: ['Cable woodchop (fast)'] } },
    { id: 'C2', group: 'explosive', parts: ['Lateral bound'], sets: 3, min: 3, max: 3, each: 'each side', rest: 60, swap: { label: 'Skater hop', parts: ['Skater hop'] } },
    { id: 'C3', group: 'main', main: true, parts: ['Military press'], sets: 3, min: 6, max: 8, rest: 120, swap: { label: 'Seated DB shoulder press', parts: ['Seated DB shoulder press'] } },
    { id: 'C4', group: 'main', main: true, parts: ['Romanian deadlift'], sets: 3, min: 8, max: 10, rest: 120, swap: { label: 'DB RDL or lying leg curl', parts: ['DB RDL or lying leg curl'] } },
    { id: 'C5', group: 'muscle', parts: ['Close-grip cable row'], sets: 3, min: 8, max: 10, rest: 90, swap: { label: 'Seated machine row', parts: ['Seated machine row'] } },
    { id: 'C6', group: 'muscle', superset: true, parts: ['Rear delt fly', 'Shrug'], sets: 3, min: 12, max: 12, rest: 60, swap: { label: 'Face pull + DB shrug', parts: ['Face pull', 'DB shrug'] } },
    { id: 'C7', group: 'muscle', superset: true, parts: ['Incline DB curl', 'Rope pushdown'], sets: 3, min: 10, max: 12, rest: 60, swap: { label: 'EZ bar curl + overhead cable extension', parts: ['EZ bar curl', 'Overhead cable extension'] } },
    { id: 'C8', group: 'finisher', parts: ['Reverse curl'], sets: 2, min: 12, max: 12, rest: 45, swap: { label: 'Wrist roller', parts: ['Wrist roller'] } },
    { id: 'C9', group: 'finisher', parts: ['Farmer carry'], sets: 3, min: 30, max: 30, rest: 60, swap: { label: 'Trap bar hold', parts: ['Trap bar hold'], holdTime: true } },
    { id: 'C10', group: 'finisher', superset: true, parts: ['Neck curl', 'Neck extension'], sets: 2, min: 15, max: 15, each: 'each', rest: 45, swap: { label: 'Plate-loaded neck harness', parts: ['Plate-loaded neck harness'] } }
  ]}
};

// Weekday (0 = Sun) -> session
const WEEK = { 0: 'R', 1: 'A', 2: 'R', 3: 'B', 4: 'R', 5: 'C', 6: 'H' };
const WEEK_TABLE = [
  ['Monday', 'Session 1 · Power + Back'], ['Tuesday', 'Recovery (walk, sun, surf)'], ['Wednesday', 'Session 2 · Legs + Chest'],
  ['Thursday', 'Recovery'], ['Friday', 'Session 3 · Shoulders + Arms'], ['Saturday', 'HIIT · this week\u2019s pick'], ['Sunday', 'Recovery']
];

/* HIIT menu. Every session has a built-in interval timer. No jogging or distance running.
   Effort: RPE out of 10 + the talk test. Sources in /workspace/health/hiit-and-mobility-notes.md. */
const GOALS = {
  vo2: { label: 'VO2 max', cls: 'g-vo2' },
  anaerobic: { label: 'Anaerobic power', cls: 'g-ana' },
  fight: { label: 'Fight conditioning', cls: 'g-fight' },
  aero: { label: 'Aerobic base / HRV', cls: 'g-aero' }
};
// Build a timer: warm-up, rounds of [work, rest] (no rest after the last round), cool-down.
function intervals({ warm, warmLabel = 'Warm-up (easy, RPE 3)', rounds, work, workLabel, rest, restLabel, cool, coolLabel = 'Cool-down (easy)' }) {
  const p = [];
  if (warm) p.push({ label: warmLabel, kind: 'easy', secs: warm });
  for (let i = 1; i <= rounds; i++) {
    p.push({ label: workLabel, kind: 'hard', secs: work, round: i, of: rounds });
    if (i < rounds && rest) p.push({ label: restLabel, kind: 'rest', secs: rest, round: i, of: rounds });
  }
  if (cool) p.push({ label: coolLabel, kind: 'easy', secs: cool });
  return p;
}
const HIIT = {
  n44: { name: 'Norwegian 4×4', goal: 'vo2', equip: 'Bike, rower, or a long steep hill (power-walk up, never jog)',
    desc: '4 × 4 min hard, 3 min easy between',
    how: ['Warm up 8 min easy.', '4 min HARD: RPE 8–9. You can only say a few words.', '3 min easy: keep moving, RPE 3.', 'Repeat 4 times, then cool down.', 'Pace it: round 4 should be as hard as round 1, not slower.'],
    demos: ['Rower technique', 'Air bike technique'],
    phases: intervals({ warm: 480, rounds: 4, work: 240, workLabel: 'HARD (RPE 8–9)', rest: 180, restLabel: 'Easy (RPE 3)', cool: 300 }) },
  hill: { name: 'Hill sprints', goal: 'anaerobic', equip: 'A short, steep hill (or flat grass)',
    desc: '10 × 10 s sprint, walk back down',
    how: ['Warm up 8 min: brisk walk, leg swings, 3 easy build-up sprints.', 'Sprint 10 s up the hill, all-out (RPE 10).', 'Walk slowly back down. Never jog.', 'Stop early if your speed drops a lot.', 'No hill? Use flat grass, or do Bike sprints.'],
    phases: intervals({ warm: 480, warmLabel: 'Warm-up: walk, leg swings, 3 build-ups', rounds: 10, work: 10, workLabel: 'SPRINT (all-out)', rest: 80, restLabel: 'Walk back down', cool: 300, coolLabel: 'Cool-down walk' }) },
  bike: { name: 'Bike sprints', goal: 'anaerobic', equip: 'Air bike or spin bike (rower works too)',
    desc: '8 × 30 s all-out, 90 s easy',
    how: ['5 min easy.', '30 s ALL-OUT (RPE 9–10), 90 s slow pedal (RPE 2–3).', '8 rounds, then 5 min easy.', 'Legs cooked from Friday? Do Bag rounds instead.'],
    demos: ['Air bike technique'],
    phases: intervals({ warm: 300, warmLabel: 'Warm-up (easy)', rounds: 8, work: 30, workLabel: 'ALL-OUT', rest: 90, restLabel: 'Easy', cool: 300, coolLabel: 'Cool-down (easy)' }) },
  wingate: { name: 'Wingate sprints', goal: 'vo2', equip: 'Air bike or spin bike with high resistance',
    desc: '5 × 30 s all-out, 4 min easy',
    how: ['5 min easy.', '30 s truly ALL-OUT (RPE 10) against heavy resistance.', '4 min very easy pedalling. The long rest lets every sprint be maximal.', 'Do 4 sprints if you are new to this, up to 5–6 later.'],
    demos: ['Air bike technique'],
    phases: intervals({ warm: 300, warmLabel: 'Warm-up (easy)', rounds: 5, work: 30, workLabel: 'ALL-OUT', rest: 240, restLabel: 'Very easy', cool: 300, coolLabel: 'Cool-down (easy)' }) },
  emom: { name: 'Air bike or rower EMOM', goal: 'anaerobic', equip: 'Air bike or rower',
    desc: '12 min: 15 s sprint at the start of every minute',
    how: ['5 min easy.', 'Every minute on the minute: 15 s SPRINT (RPE 10), then 45 s easy.', '12 rounds. This trains repeated-sprint ability: recover fast, go again.', 'Aim to keep sprint 12 close to sprint 1.'],
    demos: ['Air bike technique', 'Rower technique'],
    phases: intervals({ warm: 300, warmLabel: 'Warm-up (easy)', rounds: 12, work: 15, workLabel: 'SPRINT', rest: 45, restLabel: 'Easy', cool: 300, coolLabel: 'Cool-down (easy)' }) },
  bag: { name: 'Bag rounds', goal: 'fight', equip: 'Heavy bag + gloves (or shadow-box)',
    desc: '5 × 3 min rounds, 1 min rest (like a fight)',
    how: ['3 min easy shadow-boxing to warm up.', '3 min round HARD (RPE 8–9): combos, footwork, last 10 s all-out.', '1 min rest: breathe slow, nose if you can.', '5 rounds.'],
    phases: intervals({ warm: 180, warmLabel: 'Warm-up: easy shadow-boxing', rounds: 5, work: 180, workLabel: 'HARD', rest: 60, restLabel: 'Rest', cool: 120, coolLabel: 'Cool-down: walk + breathe' }) },
  circuit: { name: 'Combat circuit', goal: 'fight', equip: 'Kettlebell (16–24 kg), floor, bag (or shadow-box)',
    desc: '4 rounds: burpees, KB swings, sprawls, bag flurry',
    how: ['4 min easy warm-up.', 'Each move 40 s hard, 20 s to switch.', 'Burpees → KB swings → sprawls → bag flurry (fast straight punches).', '1 min rest after each round. 4 rounds.'],
    demos: ['Burpee', 'Kettlebell swing', 'Sprawl'],
    phases: (() => {
      const p = [{ label: 'Warm-up (easy)', kind: 'easy', secs: 240 }], mv = ['Burpees', 'KB swings', 'Sprawls', 'Bag flurry'];
      for (let r = 1; r <= 4; r++) {
        mv.forEach((m, i) => { p.push({ label: m.toUpperCase(), kind: 'hard', secs: 40, round: r, of: 4 }); if (i < 3) p.push({ label: 'Switch: ' + mv[i + 1], kind: 'rest', secs: 20, round: r, of: 4 }); });
        if (r < 4) p.push({ label: 'Rest', kind: 'rest', secs: 60, round: r, of: 4 });
      }
      p.push({ label: 'Cool-down: walk + breathe', kind: 'easy', secs: 180 }); return p; })() },
  z2: { name: 'Zone 2', goal: 'aero', equip: 'Bike or rower (or a brisk incline walk). No jogging.',
    desc: '30–45 min steady and easy',
    how: ['Talk test: you can talk in full sentences, but you could not sing. RPE 3–4.', 'Breathe through your nose if you can.', 'If you are puffing, slow down. Easy is the point.', 'Good on recovery days (Tue, Thu, Sun) and in deload weeks.'],
    demos: ['Rower technique'], lengths: { z2: 30, z2_45: 45 },
    phases: [{ label: 'Warm-up (very easy)', kind: 'easy', secs: 300 }, { label: 'Zone 2 steady (talk test)', kind: 'rest', secs: 1200 }, { label: 'Cool-down (very easy)', kind: 'easy', secs: 300 }] },
  z2_45: { name: 'Zone 2', goal: 'aero', hidden: true, variantOf: 'z2', equip: 'Bike or rower (or a brisk incline walk). No jogging.',
    desc: '45 min steady and easy', how: null, demos: ['Rower technique'],
    phases: [{ label: 'Warm-up (very easy)', kind: 'easy', secs: 300 }, { label: 'Zone 2 steady (talk test)', kind: 'rest', secs: 2100 }, { label: 'Cool-down (very easy)', kind: 'easy', secs: 300 }] }
};
HIIT.z2_45.how = HIIT.z2.how;
// One HIIT day a week (Saturday): rotate every week. Deload week: Zone 2 instead.
const HIIT_ROTATION = ['n44', 'hill', 'circuit'];
const HIIT_ALT = { n44: 'Bike sprints or Wingate sprints', hill: 'Bike sprints or the EMOM', circuit: 'Bag rounds' };
const EFFORT = [
  ['2–3', 'Easy', 'Chat in full sentences. Warm-ups and recoveries.'],
  ['3–4', 'Zone 2', 'Full sentences, but you couldn\u2019t sing.'],
  ['8–9', 'Hard', 'Only a few words at a time. 4×4, bag rounds, circuit.'],
  ['10', 'All-out', 'Can\u2019t talk. Sprints only.']
];

const NUTRITION = { kcal: 2500, protein: 175, carbs: 220, fat: 100 };

/* Locked meals, 6 Oct 2026. Portions and macros from the meal plan.
   Micronutrient figures are estimates vs the Sillz guide (handover table), not lab results.
   Meal lines are rounded on their own, so they may not add exactly to the day totals. */
const FOOD = {
  locked: '6 Oct 2026',
  board: 'Locked macro board is still about 2,500 kcal until body measurements are set.',
  meals: [
    { name: 'Yoghurt bowl', kcal: 640, p: 52, c: 41, f: 29, items: [
      { text: '300 g Jalna organic full-fat Greek-style yoghurt' },
      { text: '50 g Chief unflavoured whey' },
      { text: '200 g organic berries (100 g strawberries, 50 g blueberries, 50 g raspberries)' },
      { text: '15 g maple syrup' },
      { text: 'Ceylon cinnamon, bee pollen', optional: true }
    ]},
    { name: 'Egg meal', kcal: 930, p: 62, c: 71, f: 42, items: [
      { text: '4 eggs (~200 g edible before cooking)' },
      { text: '100 g full-fat cottage cheese' },
      { text: '125 g organic sourdough (before toasting)' },
      { text: '60 g avocado flesh' },
      { text: '250 mL full-fat pasteurised / A2 cow milk' }
    ]}
  ],
  bowl: {
    name: 'Protein bowl',
    note: 'Twice a week: swap the mince for salmon and recalculate that day.',
    rice: { kcal: 930, p: 61, c: 109, f: 25, carb: '300 g cooked white rice' },
    sweet: { kcal: 735, p: 58, c: 61, f: 25, carb: '350 g cooked orange sweet potato' },
    items: [
      { text: '180 g lean grass-fed mince (raw, ~5% fat)' },
      { text: '150 g cooked drained broccoli' },
      { text: '30 g rocket (wilt)' },
      { text: '50 g red onion' },
      { text: '20 g cheddar' },
      { text: '10 g extra virgin olive oil' },
      { text: 'Garlic, herbs', optional: true }
    ]
  },
  extras: { name: 'Daily extras', kcal: 160, p: 3, c: 33, f: 1, items: [
    { text: '100 g raw carrot' },
    { text: '100 g fruit in season (gold kiwi used in the numbers)' },
    { text: '150 mL orange juice' }
  ]},
  totals: {
    rice: { kcal: 2660, p: 178, c: 253, f: 96 },
    sweet: { kcal: 2465, p: 175, c: 205, f: 97 }
  },
  optionalRice: 'Optional: add 150 g cooked rice on a sweet-potato day for about 2,700 kcal and 180 g protein.',
  rules: [
    'Same three meals every day. Rice vs sweet potato is the day switch.',
    'Salmon in the protein bowl about twice a week.',
    'No seed oils, vegetable oils, artificials, or undisclosed labels.',
    'Prefer certified organic berries and grass-finished beef where practical.',
    'Food first for vitamin E and magnesium. Magnesium glycinate at night only if rice days stay short.',
    'Not lectin-free, pesticide-free, or toxin-free. Minimise exposure; don\u2019t chase purity.'
  ],
  micros: {
    covered: ['A', 'B2', 'B3', 'B5', 'B9', 'B12', 'C', 'Calcium', 'Iron', 'Manganese', 'Phosphorus', 'Potassium', 'Selenium', 'Zinc', 'Copper (partial)'],
    // Full comparison from the handover table. Do not fill blanks.
    rows: [
      ['Vitamin A', '900 µg', '2,510 µg', '4,940 µg', 'Likely covered'],
      ['B1', '0.8 mg', '0.84 mg', '0.92 mg', 'Before bread B1'],
      ['B2', '1.3 mg', '3.0 mg', '3.2 mg', 'Likely covered'],
      ['B3', '16 mg', '40 mg NE', '42 mg NE', 'Likely covered'],
      ['B5', '5 mg', '6.7 mg', '8.1 mg', 'Likely covered'],
      ['B6', '1.3 mg', 'Unresolved', 'Unresolved', 'Verify full B6'],
      ['B9 folate', '400 µg', '825 µg', '955 µg', 'Natural folate'],
      ['B12', '2.4 µg', '11.5 µg', '11.5 µg', 'Likely covered'],
      ['Vitamin C', '90 mg', '370 mg', '420 mg', 'Likely covered'],
      ['Vitamin D', '15 µg', 'Unresolved', 'Unresolved', 'Assess separately'],
      ['Vitamin E', '15 mg', '10–11 mg', '10–11 mg', 'Gap 4–5 mg'],
      ['Vitamin K1', '120 µg', 'Likely covered', 'Likely covered', 'Not quantified'],
      ['Vitamin K2', '200 µg', 'Unresolved', 'Unresolved', 'Not an established RDI'],
      ['Calcium', '1,000 mg', '1,215 mg', '1,325 mg', 'Likely covered'],
      ['Copper', '0.9 mg', 'At least 1.2 mg', 'At least 1.4 mg', 'Partial totals'],
      ['Iron', '8 mg', '11.8 mg', '13.3 mg', 'Likely covered'],
      ['Magnesium', '400 mg', '335 mg', '393 mg', 'Gap 65 / 7 mg'],
      ['Manganese', '2.3 mg', '3.6 mg', '4.4 mg', 'Likely covered'],
      ['Phosphorus', '700 mg', '2,070 mg', '2,085 mg', 'Likely covered'],
      ['Potassium', '3,400 mg', '4,280 mg', '5,250 mg', 'Likely covered'],
      ['Selenium', '55 µg', '119 µg', '114 µg', 'Likely covered'],
      ['Zinc', '11 mg', '14.1 mg', '14.5 mg', 'Likely covered']
    ],
    footnotes: [
      'Vitamin A figures are Australian retinol equivalents, including plant carotenoids. Not the same as preformed retinol.',
      'Vitamin E is a range: alpha-tocopherol and total activity are counted differently. About 4–5 mg short of 15 mg on both days.',
      'Magnesium is about 65 mg short on rice days (335 mg) and about 7 mg short on sweet-potato days (393 mg), before unreported whey minerals.',
      'Vitamin D, B6 and K2 are unresolved. Unresolved is not zero. K2\u2019s 200 µg is a guide comparison, not an established separate requirement.',
      'B1 leaves out bread thiamin until the brand is confirmed. Copper totals are partial. K1 is likely covered and was not quantified.',
      'Iodine about 275 µg on rice days and 270 µg on sweet-potato days (dairy-dependent). Fibre about 28 g rice / 37 g sweet potato.',
      'Omega-3 needs salmon in the protein bowl about twice a week. No daily sardines in this plan.',
      'Working estimates against the Sillz guide, not a lab export. Missing values are not zero.'
    ]
  }
};

/* Weekly shopping checklist. ids are stable for localStorage. */
const SHOP = [
  { title: 'Dairy and protein', items: [
    ['yoghurt', 'Jalna organic Farm to Pot Greek yoghurt — 2.1 kg (or other full-fat Greek / Skyr; recalculate whey)'],
    ['whey', 'Chief unflavoured whey — 350 g'],
    ['eggs', 'Pasture-raised eggs — 28 (2+ dozen)'],
    ['cottage', 'Full-fat cottage cheese — 700 g'],
    ['milk', 'Full-fat milk — 1.75 L (pasteurised organic / A2; goat or kefir = recalculate)'],
    ['mince', 'Lean grass-fed grass-finished beef mince — 1.26 kg raw (steak day ok as swap)'],
    ['salmon', 'Salmon — for about 2 protein bowls this week'],
    ['cheddar', 'Cheddar — 140 g (Parmesan / gorgonzola ok)']
  ]},
  { title: 'Carbs and produce', items: [
    ['bread', 'Organic sourdough — 875 g (~7 × 125 g)'],
    ['rice', 'Organic white rice — enough for rice days (~100 g dry each)'],
    ['sweet', 'Orange sweet potato — enough for sweet-potato days (~350 g cooked each + peel)'],
    ['berries', 'Organic berries — 1.4 kg total (strawberries / blueberries / raspberries mix)'],
    ['avocado', 'Avocados — ~420 g flesh (~4–5 fruit)'],
    ['broccoli', 'Broccoli — ~1.05 kg cooked drained (+ trim)'],
    ['rocket', 'Rocket — 210 g'],
    ['onion', 'Red onion — 350 g'],
    ['carrot', 'Carrots — 700 g'],
    ['fruit', 'Seasonal fruit — 700 g'],
    ['juice', 'Organic orange juice — 1.05 L (only 150 mL/day counted)']
  ]},
  { title: 'Fats, sweeteners, extras', items: [
    ['evoo', 'Extra virgin olive oil — 70 g (~5 Tbsp) for the model; extra cooking fat must be counted'],
    ['maple', 'Pure Canadian maple syrup — 105 g (or raw honey — recalculate)'],
    ['herbs', 'Optional: Ceylon cinnamon, garlic, rosemary, thyme, bee pollen'],
    ['ferment', 'Optional ferment: sauerkraut / kimchi / pickles (salt; not a veg swap)'],
    ['salt', 'Salt with batch metal testing if you can find it']
  ]},
  { title: 'Stretch / rotation', note: 'Not the daily base.', items: [
    ['proteins', 'Optional protein: cod, venison, bison, chicken thighs'],
    ['pom', 'Organic pomegranates / pomegranate juice / tart-cherry juice'],
    ['ghee', 'Ghee or beef tallow for cooking (count the fat)'],
    ['drinks', 'Bone broth, coffee / green tea / yerba mate as tolerated']
  ]}
];

const GROUP_LABEL = { explosive: 'Explosive: fast and fresh', main: 'Main lifts', muscle: 'Muscle work', finisher: 'Finisher: neck and grip' };

/* Demo videos (YouTube, embedded via youtube-nocookie on tap). Every ID was checked on 1 Oct 2026:
   oEmbed returned 200 with the title/channel below, and the watch page reported playable + embeddable. */
const VIDEO = {
  "Med-ball slam": { id: "QxYhFwMd1Ks", title: "How to Perform the Med Ball Slam", ch: "CORE Strong Fitness", secs: 43 },
  "Kettlebell swing": { id: "YSxHifyI6s8", title: "Kettlebell Swing", ch: "Men's Health", secs: 118 },
  "Broad jump": { id: "XqpN9AbLMe4", title: "Broad Jump Technique", ch: "VelocityMTP", secs: 75 },
  "Box jump": { id: "hxldG9FX4j4", title: "How To: Box Jump", ch: "ScottHermanFitness", secs: 163 },
  "Trap bar deadlift": { id: "WzvsIU9FW60", title: "Trap Bar Deadlifts (How to)", ch: "Trainer Hub", secs: 158 },
  "Conventional deadlift": { id: "r4MzxtBKyNE", title: "How To Perfect Your Deadlift | Form Check | Men's Health", ch: "Men's Health", secs: 184 },
  "Weighted pull-up": { id: "HuuyDNGrCI8", title: "How To: Weighted Pull-Up", ch: "ScottHermanFitness", secs: 112 },
  "Wide-grip lat pulldown": { id: "lueEJGjTuPQ", title: "Wide-Grip Lat Pulldown | Back Exercise Guide", ch: "Bodybuilding.com", secs: 64 },
  "Incline DB press": { id: "8iPEnn-ltC8", title: "How To: Dumbbell Incline Chest Press", ch: "ScottHermanFitness", secs: 162 },
  "Incline barbell or machine press": { id: "11gY7Q5D5wo", title: "How to Do an Incline Barbell Bench Press", ch: "LIVESTRONG", secs: 94 },
  "DB lateral raise": { id: "3VcKaXpzqRo", title: "How To: Dumbbell Side Lateral Raise", ch: "ScottHermanFitness", secs: 115 },
  "Cable lateral raise": { id: "Z5FA9aq3L6A", title: "How To Do Cable Lateral Raises", ch: "PureGym", secs: 15 },
  "Hammer curl": { id: "zC3nLlEvin4", title: "How To: Dumbbell Hammer Curl", ch: "ScottHermanFitness", secs: 122 },
  "Skull-crusher": { id: "d_KZxkY_0cM", title: "How To: Skull Crushers", ch: "ScottHermanFitness", secs: 154 },
  "Rope hammer curl": { id: "1Quc_tOv97I", title: "How To: Rope Hammer Curl", ch: "ScottHermanFitness", secs: 88 },
  "Overhead DB extension": { id: "-Vyt2QdsR7E", title: "How To: Standing Overhead Dumbbell Tricep Extension", ch: "ScottHermanFitness", secs: 102 },
  "Neck curl": { id: "o78kjeBJUBQ", title: "How To: Weight Plate Neck Curl", ch: "Live Lean TV Daily Exercises", secs: 74 },
  "Neck extension": { id: "hYqVUHC-GhE", title: "How To: Weight Plate Neck Extension", ch: "Live Lean TV Daily Exercises", secs: 51 },
  "Plate-loaded neck harness": { id: "VLdIkr2Gfdc", title: "How To: Seated Head Harness Neck Extension", ch: "Live Lean TV Daily Exercises", secs: 72 },
  "Dead hang": { id: "PlAE67ovNEo", title: "How To Dead Hang (4 Variations Covered)", ch: "Gymless Fitness", secs: 312 },
  "Farmer hold": { id: "Xt7ocQZ0VrA", title: "Farmer's Hold (kettlebells)", ch: "Weightlifting 101", secs: 9 },
  "Squat jump": { id: "DeTBwEL4m7s", title: "How To: Squat Jump", ch: "ScottHermanFitness", secs: 81 },
  "Med-ball chest pass": { id: "e-zHTwXA8mE", title: "Standing Medicine Ball Chest Pass - Viking Strength Systems", ch: "Viking Strength Systems", secs: 43 },
  "Explosive push-up": { id: "3wcAlTa6CIs", title: "How To: Explosive Plyo Push-Up", ch: "ScottHermanFitness", secs: 145 },
  "Back squat": { id: "SW_C1A-rejs", title: "How To: Deep Barbell Back Squat", ch: "ScottHermanFitness", secs: 155 },
  "Leg press or hack squat": { id: "IZxyjW7MPJQ", title: "How To: Seated Leg Press (Cybex)", ch: "ScottHermanFitness", secs: 155 },
  "Incline barbell bench": { id: "11gY7Q5D5wo", title: "How to Do an Incline Barbell Bench Press", ch: "LIVESTRONG", secs: 94 },
  "Flat DB bench": { id: "VmB1G1K7v94", title: "How To: Dumbbell Chest Press", ch: "ScottHermanFitness", secs: 130 },
  "Barbell row": { id: "9efgcAjQe7E", title: "How To: Barbell Bent-Over Row", ch: "ScottHermanFitness", secs: 185 },
  "Chest-supported DB row": { id: "H75im9fAUMc", title: "Chest-Supported Row", ch: "Men's Health", secs: 128 },
  "Walking lunge": { id: "eFWCn5iEbTU", title: "Dumbbell Walking Lunge", ch: "Renaissance Periodization", secs: 10 },
  "Bulgarian split squat": { id: "2C-uNgKwPLE", title: "How To: Bulgarian Split Squat", ch: "ScottHermanFitness", secs: 175 },
  "Dips": { id: "4la6BkUBLgo", title: "Dips   Chest Version - Chest Exercise - Bodybuilding.com", ch: "Bodybuilding.com", secs: 37 },
  "Close-grip bench": { id: "nEF0bv2FW94", title: "How To: Close-Grip Barbell Bench Press", ch: "ScottHermanFitness", secs: 95 },
  "Standing calf raise": { id: "-M4-G8p8fmc", title: "How to Do a Calf Raise | Sexy Legs Workout", ch: "Howcast", secs: 110 },
  "Seated calf raise": { id: "JbyjNymZOt0", title: "How to Do Seated Calf Raises", ch: "LIVESTRONG", secs: 119 },
  "Hanging knee raise": { id: "RD_A-Z15ER4", title: "Hanging Knee Raise", ch: "Renaissance Periodization", secs: 9 },
  "Cable crunch": { id: "3qjoXDTuyOE", title: "Cable Crunch - Abs / Core Exercise - Bodybuilding.com", ch: "Bodybuilding.com", secs: 49 },
  "Med-ball rotational throw": { id: "o9BC7lgN1bo", title: "How To Do A STANDING MEDICINE BALL ROTATIONAL THROW AGAINST A WALL | Exercise Demonstration Video", ch: "Live Lean TV Daily Exercises", secs: 45 },
  "Cable woodchop (fast)": { id: "pAplQXk3dkU", title: "How To: Oblique Twist \"Wood Chopper\" (LF CAble)", ch: "ScottHermanFitness", secs: 193 },
  "Lateral bound": { id: "Hc9_FQgIeeg", title: "Lateral Bound", ch: "Nick Brattain", secs: 75 },
  "Skater hop": { id: "9_jLW6VkU8A", title: "Speed Skaters Exercise (Skater Hops): Proper Form", ch: "BuiltLean\u00ae", secs: 68 },
  "Military press": { id: "2yjwXTZQDDI", title: "How To: Standing Straight-Bar Military / Overhead Press", ch: "ScottHermanFitness", secs: 168 },
  "Seated DB shoulder press": { id: "qEwKCR5JCog", title: "How To: Dumbbell Shoulder Press", ch: "ScottHermanFitness", secs: 144 },
  "Romanian deadlift": { id: "3VXmecChYYM", title: "How to do the ROMANIAN DEADLIFT! | 2 Minute Tutorial", ch: "Max Euceda", secs: 119 },
  "DB RDL or lying leg curl": { id: "FQKfr1YDhEk", title: "How To: Dumbbell Romanian Deadlift", ch: "ScottHermanFitness", secs: 118 },
  "Close-grip cable row": { id: "vwHG9Jfu4sw", title: "How to do the SEATED CABLE ROW! | 2 Minute Tutorial", ch: "Max Euceda", secs: 120 },
  "Seated machine row": { id: "TeFo51Q_Nsc", title: "How To Use The Seated Row Machine", ch: "PureGym", secs: 60 },
  "Rear delt fly": { id: "EA7u4Q_8HQ0", title: "Dumbbell Rear Delt Flye - The Proper Lift - BPI Sports", ch: "BPI Sports", secs: 96 },
  "Shrug": { id: "NAqCVe2mwzM", title: "How to Do a Standing Barbell Shrug | Back Workout", ch: "Howcast", secs: 130 },
  "Face pull": { id: "rep-qVOkqgk", title: "How To: Face Pull", ch: "ScottHermanFitness", secs: 162 },
  "DB shrug": { id: "cJRVVxmytaM", title: "How To: Dumbbell Shrugs", ch: "ScottHermanFitness", secs: 101 },
  "Incline DB curl": { id: "soxrZlIl35U", title: "How To: Seated Incline Dumbbell Bicep Curl", ch: "ScottHermanFitness", secs: 105 },
  "Rope pushdown": { id: "vB5OHsJ3EME", title: "How To: Rope Push-Down", ch: "ScottHermanFitness", secs: 93 },
  "EZ bar curl": { id: "6LrOTcr595A", title: "EZ Bar Curls How To Perform Them Correctly", ch: "KAGED ", secs: 102 },
  "Overhead cable extension": { id: "1u18yJELsh0", title: "Cable Overhead Triceps Extension", ch: "Renaissance Periodization", secs: 12 },
  "Reverse curl": { id: "nRgxYX2Ve9w", title: "How to Do a Reverse Curl | Arm Workout", ch: "Howcast", secs: 108 },
  "Wrist roller": { id: "-lOFG0U_rlY", title: "Wrist Roller - Forearm Exercise - Bodybuilding.com", ch: "Bodybuilding.com", secs: 40 },
  "Farmer carry": { id: "NH7Xv-7NQNQ", title: "How To Perform Farmer Walks Exercise Tutorial", ch: "Buff Dudes Workouts", secs: 90 },
  "Trap bar hold": { id: "df-MeZsxCAM", title: "Trap Bar Farmers Carry", ch: "John Rusin", secs: 23, note: "Trap bar carry: same pick-up and grip, just stand still and hold" }
};

const APP_HEADING = 'Baki Program';

/* Tempo tag for every exercise and swap. */
const TEMPO_INFO = {
  explosive: { label: 'Explosive', cls: 't-exp', cue: 'Max intent, every rep fast, full rest, stop if speed drops.' },
  power: { label: 'Power-controlled', cls: 't-pow', cue: 'Lower under control (2–3 s), drive up hard and fast.' },
  controlled: { label: 'Controlled', cls: 't-con', cue: 'Slow and controlled, 2–3 s down, squeeze at the top, no swinging.' },
  brace: { label: 'Brace + hold', cls: 't-hold', cue: 'Brace and stand tall.' }
};
const TEMPO_GROUPS = {
  explosive: ['Med-ball slam', 'Kettlebell swing', 'Broad jump', 'Box jump', 'Squat jump', 'Med-ball chest pass', 'Explosive push-up', 'Med-ball rotational throw', 'Cable woodchop (fast)', 'Lateral bound', 'Skater hop'],
  power: ['Trap bar deadlift', 'Conventional deadlift', 'Back squat', 'Leg press or hack squat', 'Incline barbell bench', 'Flat DB bench', 'Military press', 'Seated DB shoulder press', 'Romanian deadlift', 'DB RDL or lying leg curl', 'Weighted pull-up', 'Wide-grip lat pulldown', 'Barbell row', 'Chest-supported DB row'],
  controlled: ['Incline DB press', 'Incline barbell or machine press', 'DB lateral raise', 'Cable lateral raise', 'Hammer curl', 'Skull-crusher', 'Rope hammer curl', 'Overhead DB extension', 'Neck curl', 'Neck extension', 'Plate-loaded neck harness', 'Walking lunge', 'Bulgarian split squat', 'Dips', 'Close-grip bench', 'Standing calf raise', 'Seated calf raise', 'Hanging knee raise', 'Cable crunch', 'Close-grip cable row', 'Seated machine row', 'Rear delt fly', 'Shrug', 'Face pull', 'DB shrug', 'Incline DB curl', 'Rope pushdown', 'EZ bar curl', 'Overhead cable extension', 'Reverse curl', 'Wrist roller'],
  brace: ['Dead hang', 'Farmer hold', 'Farmer carry', 'Trap bar hold']
};
for (const [k, list] of Object.entries(TEMPO_GROUPS)) for (const m of list) MOV[m].tempo = k;

/* Mobility moves (and HIIT technique demos). img = free-exercise-db still (public domain) where one matches. */
const MOB = {
  'Chin tuck': { neck: true, cue: 'Sit or stand tall. Glide your head straight back (make a double chin), hold 3 s, relax. Eyes stay level. Slow reps.' },
  'Supine chin-tuck head lift': { neck: true, cue: 'Lie on your back. Nod your chin in gently, then lift your head 2–3 cm off the floor. Hold 5–10 s, rest, repeat.' },
  'Wall angel': { neck: true, cue: 'Back, head and bum on the wall, arms in a W. Slide the arms up and down slowly, keeping contact. Ribs down.' },
  'Foam roller T-spine extension': { neck: true, cue: 'Roller across the upper back, hands support your head. Arch back over it and breathe out. Move it up a few cm and repeat. Not on the lower back.' },
  'Doorway pec stretch': { neck: true, img: 'One_Arm_Against_Wall', match: 'closest', cue: 'Forearm on the door frame, elbow at shoulder height. Step through until the chest stretches. Breathe.' },
  'Prone Y-T-W': { neck: true, cue: 'Lie face down, thumbs up. Lift the arms into a Y, then a T, then a W. Shoulder blades down and back. Neck long, look at the floor.' },
  'Band pull-apart': { neck: true, cue: 'Arms straight at chest height. Pull the band apart until it touches your chest. Shoulders down, chin tucked, slow return.' },
  'Neck CARs': { neck: true, cue: 'Sit tall. Slowly draw the biggest pain-free circle you can with your chin, 3 each way. Smooth, never forced.' },
  'Levator scapulae stretch': { neck: true, img: 'Side_Neck_Stretch', match: 'closest', cue: 'Sit on one hand. Turn your nose toward the other armpit and gently ease the head down with that hand. Breathe.' },
  'Semi-supine rest': { cue: 'Lie on your back, knees bent, feet flat, a book or two under your head, hands on your belly. Let your neck be free, let your back lengthen and widen. Just rest.' },
  'Cat-cow': { img: 'Cat_Stretch', match: 'exact', cue: 'On hands and knees. Breathe in, drop the belly and look up. Breathe out, round the back and tuck the chin. Slow.' },
  '90/90 hip switch': { cue: 'Sit with both knees bent at 90°. Rotate both knees to the other side and back, chest tall. Hands behind you if needed.' },
  'Couch stretch': { cue: 'Back knee against a wall or couch, shin up the wall, front foot forward. Squeeze your bum and stay tall.' },
  'Hip CARs': { cue: 'On hands and knees (or standing, holding a wall). Draw the biggest, slowest circle you can with your knee. Everything else still.' },
  'Deep squat hold': { cue: 'Feet shoulder width, toes out a little. Sit as low as you can, heels down (hold a post or put plates under the heels). Chest tall, breathe.' },
  'Frog stretch': { cue: 'On all fours, knees wide, ankles in line with the knees. Rock the hips back slowly until the inner thighs stretch.' },
  'Pigeon stretch': { cue: 'Front shin across in front of you, back leg long. Stay tall or fold forward over the front leg. Feel the outside of the hip.' },
  'Cossack squat': { cue: 'Wide stance. Sit into one hip, other leg straight, toes up. Go as low as is comfortable, then shift across. Hold a post if needed.' },
  'Half-kneeling hip flexor stretch': { img: 'Kneeling_Hip_Flexor', match: 'exact', cue: 'Kneel on one knee. Squeeze the back-leg glute and tuck the pelvis under, then shift forward a little. Tall chest.' },
  "World's greatest stretch": { img: 'Worlds_Greatest_Stretch', match: 'exact', cue: 'Big lunge, hands inside the front foot. Drop the elbow toward the floor, then rotate and reach that arm to the ceiling.' },
  'Pancake stretch': { img: 'The_Straddle', match: 'closest', cue: 'Legs wide, knees pointing up. Sit tall, hinge forward from the hips and walk the hands out. Sit on a cushion if your back rounds.' },
  'Jefferson curl (light)': { cue: 'Stand on a box with an empty bar or 5–10 kg. Tuck the chin and roll down one vertebra at a time, then roll up slowly. Light and slow only.' },
  'Kneeling hamstring stretch': { cue: 'Half-kneel, front leg straight, toes up (a half split). Back flat, hinge forward from the hips until the hamstring stretches.' },
  'Strap hamstring stretch': { img: 'Lying_Hamstring', match: 'closest', cue: 'Lie on your back, strap or towel around one foot. Pull the straight leg up until the hamstring stretches. Other leg flat.' },
  'Shoulder CARs': { cue: 'Stand tall, make a fist. Slowly draw the biggest circle you can with a straight arm, body still. 3 each way.' },
  'Thread the needle': { cue: 'On all fours. Slide one arm under your body and rest the shoulder down, then open up and reach that arm to the ceiling.' },
  'Open book': { cue: 'Lie on your side, knees bent to 90°, arms together in front. Open the top arm across to the other side, eyes follow the hand. Knees stay together.' },
  'Bench lat stretch': { cue: 'Kneel in front of a bench, elbows on it, a stick between your hands. Sit the hips back and drop the chest.' },
  'Stick shoulder pass-through': { cue: 'Wide grip on a broomstick, arms straight. Lift it over your head and behind you, then back. Widen the grip if it pinches.' },
  'Knee-to-wall ankle mobilisation': { cue: 'Foot a hand\u2019s width from the wall. Drive the knee forward to touch the wall, heel stays down. Rock in and out; move the foot back as it gets easier.' },
  'Ankle CARs': { img: 'Ankle_Circles', match: 'closest', cue: 'Sit, or stand on one leg. Draw slow, big circles with your foot, shin still. 5 each way.' },
  'Wall calf stretch': { img: 'Calf_Stretch_Hands_Against_Wall', match: 'exact', cue: 'Hands on the wall, one leg back, heel down. Straight knee first, then bend the knee a little for the deeper calf.' },
  'Tibialis raise': { cue: 'Back against a wall, heels about 30 cm out. Lift your toes as high as you can, lower slowly. 15–20 reps.' },
  'Goblet squat pry': { img: 'Goblet_Squat', match: 'closest', cue: 'Hold a kettlebell at your chest and squat deep. Use the elbows to ease the knees out and shift side to side. Breathe.' },
  "Child's pose": { img: 'Childs_Pose', match: 'exact', cue: 'Kneel, big toes together, knees wide. Sit back on your heels and reach the arms forward. Breathe into your back.' },
  'Supine twist': { cue: 'Lie on your back, bring one knee across your body, other leg long. Arms out wide, shoulders down. Breathe out and relax into it.' },
  'Downward dog': { cue: 'Hands and feet on the floor, hips high. Bend the knees as much as you need to keep the back long. Push the floor away.' },
  'Crocodile breathing': { cue: 'Lie face down, forehead on your hands. Breathe slowly into your belly so your lower back rises. 4 s in, 6 s out.' },
  'Happy baby': { cue: 'Lie on your back, hold the outsides of your feet, knees wide. Gently pull the knees toward the floor, lower back down.' },
  'Sphinx pose': { cue: 'Lie face down, forearms under your shoulders. Lift the chest gently, neck long, shoulders down.' },
  'Inchworm': { img: 'Inchworm', match: 'exact', cue: 'Stand, bend down and walk the hands out to a plank. Walk the feet in toward the hands, legs as straight as you can.' },
  // HIIT technique demos
  'Burpee': { cue: 'Squat, hands down, jump the feet back to a plank, chest to the floor, jump the feet in, jump up. Steady rhythm.' },
  'Sprawl': { cue: 'From fight stance, drop the hands and shoot the legs back, hips down hard. Bounce back up to stance fast.' },
  'Rower technique': { img: 'Rowing_Stationary', match: 'exact', cue: 'Legs, then body, then arms. On the way back: arms, body, then legs. Drive with the legs. Damper 4–6.' },
  'Air bike technique': { cue: 'Sit tall, push and pull the handles while you pedal. For sprints, go all-out from the first second.' }
};
/* 7 follow-along sessions, 15–20 min. [move, seconds, 'sides'] — sided moves switch at half time. */
const MOBILITY = {
  mon: { day: 1, name: 'Hips + posture', moves: [['Cat-cow', 60], ['Chin tuck', 60], ['90/90 hip switch', 120], ['Half-kneeling hip flexor stretch', 120, 'sides'], ['Couch stretch', 120, 'sides'], ['Hip CARs', 120, 'sides'], ['Wall angel', 90], ['Deep squat hold', 90], ['Doorway pec stretch', 60], ['Semi-supine rest', 180]] },
  tue: { day: 2, name: 'Shoulders + T-spine', moves: [['Shoulder CARs', 120, 'sides'], ['Foam roller T-spine extension', 90], ['Open book', 120, 'sides'], ['Thread the needle', 120, 'sides'], ['Bench lat stretch', 90], ['Stick shoulder pass-through', 60], ['Doorway pec stretch', 120, 'sides'], ['Prone Y-T-W', 90], ['Chin tuck', 60], ['Band pull-apart', 60], ['Semi-supine rest', 120]] },
  wed: { day: 3, name: 'Hips + hamstrings', moves: [['Cat-cow', 60], ['Strap hamstring stretch', 120, 'sides'], ['Kneeling hamstring stretch', 120, 'sides'], ['Pancake stretch', 120], ['Jefferson curl (light)', 90], ['Frog stretch', 90], ['Pigeon stretch', 120, 'sides'], ['Cossack squat', 90], ['Supine chin-tuck head lift', 60], ['Wall angel', 60], ['Semi-supine rest', 120]] },
  thu: { day: 4, name: 'Neck + posture', moves: [['Neck CARs', 60], ['Chin tuck', 90], ['Supine chin-tuck head lift', 90], ['Levator scapulae stretch', 120, 'sides'], ['Foam roller T-spine extension', 90], ['Wall angel', 90], ['Doorway pec stretch', 120, 'sides'], ['Prone Y-T-W', 90], ['Band pull-apart', 60], ['Crocodile breathing', 60], ['Semi-supine rest', 300]] },
  fri: { day: 5, name: 'Full-body flow', moves: [['Cat-cow', 60], ['Inchworm', 60], ["World's greatest stretch", 120, 'sides'], ['Downward dog', 60], ['90/90 hip switch', 90], ['Thread the needle', 90, 'sides'], ['Deep squat hold', 90], ['Shoulder CARs', 90, 'sides'], ['Hip CARs', 90, 'sides'], ['Chin tuck', 60], ['Wall angel', 60], ['Semi-supine rest', 120]] },
  sat: { day: 6, name: 'Ankles + squat depth', moves: [['Ankle CARs', 90, 'sides'], ['Knee-to-wall ankle mobilisation', 120, 'sides'], ['Wall calf stretch', 120, 'sides'], ['Tibialis raise', 60], ['Goblet squat pry', 120], ['Deep squat hold', 120], ['Frog stretch', 90], ['Couch stretch', 120, 'sides'], ['Chin tuck', 60], ['Foam roller T-spine extension', 60], ['Semi-supine rest', 120]] },
  sun: { day: 0, name: 'Recovery flow + semi-supine', moves: [['Crocodile breathing', 90], ['Cat-cow', 60], ["Child's pose", 90], ['Sphinx pose', 60], ['Supine twist', 120, 'sides'], ['Happy baby', 60], ['Pigeon stretch', 120, 'sides'], ['Strap hamstring stretch', 120, 'sides'], ['Supine chin-tuck head lift', 60], ['Semi-supine rest', 300]] }
};
const MOB_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
/* Alexander Technique-style posture cues: short, rotate through the session. */
const AT_CUES = ['Let your neck be free.', 'Let your head go forward and up, not pulled back or down.', 'Let your back lengthen and widen.', 'Let your knees go forward and away.', 'Notice tension, then let it go. Don\u2019t force a \u201cgood posture\u201d.', 'Breathe out fully. Let the in-breath happen on its own.'];

/* Mobility + HIIT technique videos, checked the same way on 1 Oct 2026 (oEmbed 200 + title match, playable + embeddable). */
Object.assign(VIDEO, {
  "Chin tuck": { id: "KqR1EoEmq9c", title: "You're Doing Chin Tucks WRONG | Physical Therapist Teaches The Correct Way", ch: "Rehab and Revive", secs: 211 },
  "Supine chin-tuck head lift": { id: "7OgvJ653oxE", title: "Chin tuck and lift (supine)", ch: "Revival Performance Physical Therapy", secs: 88 },
  "Wall angel": { id: "cvx06snMQ3A", title: "Wall Angel", ch: "Rehab My Patient", secs: 31 },
  "Foam roller T-spine extension": { id: "SQF-0s1CckA", title: "Thoracic Spine Mobility using a Foam Roller", ch: "[P]rehab", secs: 35 },
  "Doorway pec stretch": { id: "M850sCj9LHQ", title: "How to Do a Doorway Pec Stretch Exercise | 90 Degrees Abduction | MedBridge", ch: "Medbridge", secs: 37 },
  "Prone Y-T-W": { id: "QdGTI4Lshg4", title: "Prone Y T W", ch: "The Active Life", secs: 31 },
  "Band pull-apart": { id: "smSSXITNpCI", title: "How To Do Band Pull Aparts", ch: "Rogue Fitness", secs: 29 },
  "Neck CARs": { id: "J3tkQ4pk_Sc", title: "Controlled Articular Rotations (CARs) - Neck", ch: "Tangelo - Seattle Chiropractor + Rehab", secs: 98 },
  "Levator scapulae stretch": { id: "GSoXPJRnR6E", title: "Levator Scapula Stretch - Ask Doctor Jo", ch: "AskDoctorJo", secs: 41 },
  "Semi-supine rest": { id: "NhxMNou1Tfo", title: "Alexander Technique | Active Rest (Lying down in Semi Supine)", ch: "Alexander Technique", secs: 84 },
  "Cat-cow": { id: "1Y0YjXS9sKI", title: "How to Do a Cat Cow Stretch: A Guide from Physical Therapists", ch: "Hinge Health", secs: 62 },
  "90/90 hip switch": { id: "m51AZSXMvEA", title: "90 90 Hip Switch", ch: "The Active Life", secs: 31 },
  "Couch stretch": { id: "Fg-lwNBzVV8", title: "Couch Stretch", ch: "Men's Health", secs: 53 },
  "Hip CARs": { id: "hRMrq6G81p8", title: "Controlled Articular Rotations (CARs) for Your Hips", ch: "Cleveland Clinic", secs: 83 },
  "Deep squat hold": { id: "IHApHfNA2Ag", title: "How to Do a Deep Squat According to Physical Therapists", ch: "Hinge Health", secs: 69 },
  "Frog stretch": { id: "7d-4CkcXWVU", title: "Frog Stretch", ch: "SOFLETE", secs: 35 },
  "Pigeon stretch": { id: "lqCqETr7Q0g", title: "How to Do a Pigeon Pose: A Guide from Physical Therapists", ch: "Hinge Health", secs: 76 },
  "Cossack squat": { id: "tpczTeSkHz0", title: "How to Cossack Squat Mobility Exercise: Tutorial & Progressions", ch: "FitnessFAQs", secs: 181 },
  "Half-kneeling hip flexor stretch": { id: "gqoPYLUgP48", title: "Bulletproof Step-by-step Guide to the Half Kneeling Hip Flexor Stretch\" [stretching advice]", ch: "[P]rehab", secs: 60 },
  "World's greatest stretch": { id: "-CiWQ2IvY34", title: "The World's Greatest Stretch (Mobility Exercise) by Squat University", ch: "Squat University", secs: 42 },
  "Pancake stretch": { id: "b0kCd4L20V8", title: "Full Guide: How to Pancake Stretch (Beginner to Advanced)", ch: "Kevin Cha | About Wellness", secs: 327 },
  "Jefferson curl (light)": { id: "YGlAdtSKQaU", title: "Jefferson Curls", ch: "The Barbell Physio", secs: 24 },
  "Kneeling hamstring stretch": { id: "MiAXGtx_J0M", title: "How to do a Kneeling Hamstring stretch", ch: "Medibank", secs: 23 },
  "Strap hamstring stretch": { id: "Il1L75v6gq0", title: "Hamstring Stretch with a Strap, Supine - Ask Doctor Jo", ch: "AskDoctorJo", secs: 39 },
  "Shoulder CARs": { id: "CLWFwun1BfQ", title: "Controlled Articular Rotations (CARs) - Shoulder", ch: "Tangelo - Seattle Chiropractor + Rehab", secs: 113 },
  "Thread the needle": { id: "SkQhKf74nZk", title: "How to Do a Thread the Needle Stretch: A Guide from Physical Therapists", ch: "Hinge Health", secs: 73 },
  "Open book": { id: "OW6YHlxY6JI", title: "Open Book Stretch - Physical Therapy Exercises", ch: "TSAOG Orthopaedics & Spine", secs: 60 },
  "Bench lat stretch": { id: "6Fc0u9xPkL8", title: "The Bench Stretch - The Ultimate Lat and Thoracic Spine Mobility Exercise", ch: "The Barbell Physio", secs: 66 },
  "Stick shoulder pass-through": { id: "rVBdvlriNlw", title: "Shoulder Dislocates with a stick or PVC pipe", ch: "Tom Morrison", secs: 90 },
  "Knee-to-wall ankle mobilisation": { id: "ElrpduJn92Y", title: "Knee To Wall Exercise for Ankle Mobility", ch: "Dr. Jess Harvey, Osteopath & Health Coach", secs: 53 },
  "Ankle CARs": { id: "BDNGAnp7u7s", title: "Controlled Articular Rotations (CARs) - Ankle", ch: "Tangelo - Seattle Chiropractor + Rehab", secs: 80 },
  "Wall calf stretch": { id: "trC42QD0wQI", title: "Calf Stretch", ch: "Sheffield Teaching Hospitals NHS Foundation Trust", secs: 76 },
  "Tibialis raise": { id: "VzIcGAgBiaM", title: "Tibialis Wall Raises (Exercise Demo)", ch: "The Barefoot Sprinter", secs: 25 },
  "Goblet squat pry": { id: "TcXOrjCAyPg", title: "Kettlebell Prying Goblet Squat | StrongFirst", ch: "StrongFirst", secs: 149 },
  "Child's pose": { id: "nMp3MlTz9fA", title: "How to do a child's pose stretch", ch: "Medibank", secs: 22 },
  "Supine twist": { id: "mNdJti7ZwKI", title: "Supine Spinal Twist for Spine Mobility", ch: "Vive Health", secs: 75 },
  "Downward dog": { id: "sd-Fn6xpyeg", title: "Yoga For Men | How To Do a Downward Dog For Inflexible Beginners", ch: "Body By Yoga", secs: 92 },
  "Crocodile breathing": { id: "8AL2DyYpBFc", title: "How To Do Crocodile Breathing - Tangelo Health", ch: "Tangelo - Seattle Chiropractor + Rehab", secs: 66 },
  "Happy baby": { id: "DsuQQMzFU-4", title: "How to Do the Happy Baby Pose: A Guide from Physical Therapists", ch: "Hinge Health", secs: 76 },
  "Sphinx pose": { id: "-J9zcJYACrk", title: "Sphinx Pose for Spine Health", ch: "BioSpine Institute", secs: 80 },
  "Inchworm": { id: "VSp0z7Mp5IU", title: "How to Do an Inchworm | Abs Workout", ch: "Howcast", secs: 88 },
  "Burpee": { id: "G2hv_NYhM-A", title: "How To Do Burpees With Proper Form", ch: "BuiltLean®", secs: 69 },
  "Sprawl": { id: "YyA0JAnK5l8", title: "Sprawl Solo Drill - Wrestling for MMA", ch: "Flow Athletics", secs: 129 },
  "Rower technique": { id: "4zWu1yuJ0_g", title: "Correct Rowing Machine Technique, Improve Your Rowing  | Concept2", ch: "concept2usa", secs: 113 },
  "Air bike technique": { id: "KC-ZSfOmXgE", title: "HOW TO USE THE AIRBIKE", ch: "Nutrition Warehouse", secs: 55 }
});
