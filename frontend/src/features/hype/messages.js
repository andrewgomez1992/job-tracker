/**
 * Hype lines. 'unhinged' is the default for your own use; 'clean' is the
 * safe-for-a-demo set. Every event falls back to 'random'.
 */
export const HYPE = {
  unhinged: {
    random: [
      'YOU GOT THIS BRO',
      'BRO THEY FUCKING NEED YOU',
      'SOMETHING IS GONNA POP UP. KEEP SWINGING.',
      'Every no is one step closer to the yes.',
      'You shipped billing to 50,000 users. Act like it.',
      'Some hiring manager is about to have a GREAT week.',
      'Rejection is just their loss, compounded daily.',
      'Recruiters are literally searching for you right now.',
      'Main character energy only.',
      'Send it. Then send another one.',
    ],
    applied: [
      'SENT. ANOTHER ONE.',
      "THAT ONE'S GONNA HIT, BRO",
      'BOOM. Application locked in.',
      'They better check their inbox.',
      'Volume wins. Keep stacking.',
      "That recruiter doesn't know what's coming.",
    ],
    screening: [
      'THEY CALLED BACK. TOLD YOU.',
      'A HUMAN WANTS TO TALK TO YOU. LETS GOOO',
      'Screen locked. Go be charming.',
    ],
    interviewing: [
      'INTERVIEW LOOP?! BRO.',
      'You are IN THE ROOM now. Cook.',
      'They want you. Prove them right.',
    ],
    goal: [
      'DAILY GOAL: DESTROYED.',
      "THAT'S THE QUOTA. YOU'RE A MACHINE.",
      'GOAL HIT. ANYTHING ELSE TODAY IS BONUS.',
    ],
    offer: [
      'OFFER!!!!! YOU DID IT!!!!!',
      'THEY FUCKING NEED YOU. CONFIRMED.',
      'WHO GOT AN OFFER? YOU GOT AN OFFER.',
    ],
  },
  clean: {
    random: [
      'You got this.',
      'Something good is coming.',
      'Every no is one step closer to the yes.',
      'Keep showing up. It compounds.',
      'Consistency beats luck.',
      'Your next team is out there.',
    ],
    applied: ['Application sent. Nice.', 'Another one out the door.', 'Volume wins. Keep going.'],
    screening: ['They want to talk. Nice work.', 'Screen booked. Go get it.'],
    interviewing: ['Interview loop. You earned this.', "You're in the room now."],
    goal: ["Daily goal hit. That's the work.", 'Goal reached. Nice job today.'],
    offer: ['Offer received. Huge.', 'You did it.'],
  },
};

export const MILESTONES = [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500];

export const milestoneLine = (n, mode) => (mode === 'clean'
  ? `${n} applications. Real momentum.`
  : n === 1 ? 'FIRST ONE IN. THE GRIND STARTS NOW.'
  : n >= 100 ? `${n} APPLICATIONS. ABSOLUTE MACHINE.`
  : `${n} APPLICATIONS. YOU'RE BUILT DIFFERENT.`);

export const pick = (list) => list[Math.floor(Math.random() * list.length)];
