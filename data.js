/* Lockie's Baki Training Plan — data taken from baki-training-plan.md (1 Oct 2026).
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
  ['Thursday', 'Recovery'], ['Friday', 'Session 3 · Shoulders + Arms'], ['Saturday', 'HIIT · Fighter HIIT (20 min)'], ['Sunday', 'Recovery']
];

const HIIT = {
  bag: { name: 'Option 1: Bag work', desc: '5 rounds \u00d7 3 min hard, 1 min rest', phases: (() => {
    const p = []; for (let i = 1; i <= 5; i++) { p.push({ label: 'HARD', kind: 'hard', secs: 180, round: i, of: 5 }); p.push({ label: 'Rest', kind: 'rest', secs: 60, round: i, of: 5 }); } return p; })() },
  bike: { name: 'Option 2: Bike or rower', desc: '5 min easy, 8 \u00d7 30 s all-out / 90 s easy, 5 min easy', phases: (() => {
    const p = [{ label: 'Warm-up (easy)', kind: 'easy', secs: 300 }];
    for (let i = 1; i <= 8; i++) { p.push({ label: 'ALL-OUT', kind: 'hard', secs: 30, round: i, of: 8 }); p.push({ label: 'Easy', kind: 'rest', secs: 90, round: i, of: 8 }); }
    p.push({ label: 'Cool-down (easy)', kind: 'easy', secs: 300 }); return p; })() }
};

const NUTRITION = { kcal: 2500, protein: 175, carbs: 220, fat: 100 };

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

const APP_NAME = 'Baki Training App';
