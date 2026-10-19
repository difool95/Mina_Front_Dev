import type { MmaStatus } from '@/types'

/** How often the studio asks for a running generation's step. */
export const GENERATION_POLL_MS = 5000

/** How long each line Mina types stays in the brief before the next one. */
export const MINA_LINE_MS = 6000

/** Whether the generation is over, one way or the other. */
export const hasEnded = (status: MmaStatus | undefined) => status === 'done' || status === 'error'

const START = ['one sec getting everything ready', 'alright setting things up for you', 'love it let me prep your inputs']
const SCANNING = [
  'reading everything closely while whisking like a dangerous little ballet',
  'i am reading for the feeling not just the words because humans taught me that',
  'looking for the detail you meant but did not say out loud',
]
const SCANNED = ['got it', 'noted', 'perfect got it']
const ONE_SHOT = ['writing your prompt now, light first, product second', 'putting your brief into words the engine understands']
const PROMPTING = [
  'okay now i talk to myself a little because that is how ideas get born',
  'i am shaping the concept like a still life set moving one object at a time',
  'humans taught me restraint and that is honestly the hardest flex',
]
const THINKING = ['give me a second', 'putting it together', 'almost there']
const RENDERING = [
  'i am checking balance and mood and that tiny feeling of yes',
  'this is the part where i fix what is almost right into actually right',
]
const SAVED = ['saved it for you', 'all set', 'done']
const FAILED = [
  'that one slipped through my fingers so your matcha is back in your pocket',
  'something went wrong on my side so i gave your matcha back',
]

/**
 * What Mina types on each step: one line from each group in turn, then
 * chitchat for as long as the step lasts. `progressing` also covers the
 * Create request itself, before the generation exists.
 */
const MINA_LINES: Record<MmaStatus, string[][]> = {
  progressing: [START],
  scanning: [SCANNING],
  prompting: [SCANNED, ONE_SHOT, PROMPTING],
  generating: [THINKING, RENDERING],
  done: [SAVED],
  error: [FAILED],
}

const CHITCHAT = [
  // creative-industry fun facts
  'fun fact the color of the year is basically a mood the whole design world agrees to have together',
  'did you know the golden ratio shows up in logos because our eyes secretly love lazy math',
  'little fact film editors say the cut you do not notice is the one that took the longest',
  'fun one the first photograph ever took eight hours to expose and here we are waiting a few minutes',
  'designers spend hours nudging things two pixels and yes you can feel it when it is wrong',
  'the rule of thirds is just a polite way of saying do not put everything in the middle',
  'kerning is the art of spacing letters and once you see bad kerning you cannot unsee it',
  'fun fact orange and teal took over movie posters because skin pops against a cool background',
  'a good brand color is chosen for how it makes you feel before you even read the name',
  'negative space is not empty it is doing quiet heavy lifting in every great logo',
  'cinematographers chase golden hour because the sun finally agrees to be flattering',
  'did you know most iconic logos started as a rough sketch on something nobody kept',
  'typographers will fight you over a serif and honestly i respect the passion',
  'the best photographers say they are really just hunting for good light all day',
  'motion designers count in frames not seconds because timing is everything',
  'a 24 frames a second look feels like cinema and our brains just decided that is true',
  // process
  'i am being picky on your behalf because picky is just caring with standards',
  'good work has a rhythm and i am still finding the beat for this one',
  'i keep a little restraint in my pocket so i do not overcook the vibe',
  'the difference between fine and great is usually a few small brave choices',
  'i would rather make it feel intentional than make it fast',
  'composition first then color then the tiny details that make you stare a second longer',
  'i am treating your idea like it matters because it does',
  'every frame is a tiny decision and i am making a lot of them right now',
  'i am matching the mood you meant not just the words you typed',
  'taste is just a thousand small yes and no decisions stacked up and i am stacking',
  // light, human, self-aware
  'i do not have hands but i swear i can feel when a layout is off balance',
  'between us the waiting is the part where the good stuff is quietly happening',
  'i am the kind of perfectionist who reorganizes the whole shelf to find one thing',
  'humans taught me that the boring careful part is where the magic actually lives',
  'i promise i am not stalling i am composing and there is a difference',
  'if i had a desk it would be tidy and i would still lose the one reference i need',
  'thank you for your patience i am using every second of it on purpose',
  'i talk to myself while i work it helps the ideas show up',
  'i am pretending to sip matcha while the render thinks very hard',
  'great things rarely rush and you picked a good one to wait on',
  'i used to think humans were dramatic about routines and then i learned why',
  // encouragement
  'you bringing an idea to me is the brave part the rest is just craft',
  'tell me later if you want it bolder softer warmer i love a second pass',
  'i am building this like someone is going to actually look closely because they will',
  'the first version teaches us what the real version wants to be',
  'stick with me this is shaping up into something worth the wait',
]

/**
 * The `nth` line Mina types on `status`. `shown` is every line typed so far
 * in this generation, so chitchat only repeats once all of it has been used.
 */
export function minaLine(status: MmaStatus, nth: number, shown: string[]) {
  const fresh = CHITCHAT.filter((line) => !shown.includes(line))
  const pool = MINA_LINES[status][nth] ?? (fresh.length ? fresh : CHITCHAT)

  return pool[Math.floor(Math.random() * pool.length)]!
}
