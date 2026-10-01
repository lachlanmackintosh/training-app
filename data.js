/* Lockie's Baki Training Plan — data taken from baki-training-plan.md (1 Oct 2026).
   Demo images: free-exercise-db (github.com/yuhonas/free-exercise-db), public domain (Unlicense).
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
  A: { key: 'A', day: 'Monday', title: 'Day A: Power + Back', exercises: [
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
  B: { key: 'B', day: 'Wednesday', title: 'Day B: Legs + Chest', exercises: [
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
  C: { key: 'C', day: 'Friday', title: 'Day C: Shoulders + Arms', exercises: [
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
  ['Monday', 'Day A: Power + Back'], ['Tuesday', 'Recovery (walk, sun, surf)'], ['Wednesday', 'Day B: Legs + Chest'],
  ['Thursday', 'Recovery'], ['Friday', 'Day C: Shoulders + Arms'], ['Saturday', 'Fighter HIIT (20 min)'], ['Sunday', 'Recovery']
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
