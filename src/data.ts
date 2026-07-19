import { APKProject, GlobalStats } from './types.js';

export const INITIAL_STATS: GlobalStats = {
  boops: 0,
  bugs: 0,
  coffeeLitres: 0,
  likes: 0,
};

export const INITIAL_PROJECTS: APKProject[] = [
  // {
  //   id: 'nekotasker-pro',
  //   title: 'NekoTasker Pro',
  //   version: 'v2.4.1 stable',
  //   description: 'A task manager for people who actually want to get things done, but also want their buttons to feel like squishing a marshmallow.',
  //   longDescription: 'NekoTasker Pro redefines personal productivity. Combining deep Japanese gaming aesthetics with hardcore task scheduling, this app ensures you stay organized while offering satisfying haptic triggers, floating kitty widgets, and ambient synth tracks to keep you focused. Built with love and 100% caffeine.',
  //   category: 'Productivity',
  //   framework: 'React Native',
  //   tags: ['REANIMATED', 'HERMES ENGINE', 'SKIA CANVAS'],
  //   size: '42.5 MB',
  //   minApi: 'Android 10',
  //   updatedAt: '2 days ago',
  //   license: 'MIT',
  //   downloads: 480,
  //   status: 'Live',
  //   screenshotUrl: '/images/MainImage.jpg',
  //   iconType: 'alarm',
  //   worksGreat: [
  //     'Ultra-smooth 60fps animations that make your GPU smile.',
  //     "Dark mode that is actually black, not just 'dark blue'.",
  //     "Push notifications that don't yell at you."
  //   ],
  //   spontaneousFeatures: [
  //     'The app might decide to take a nap if you open 50 tabs.',
  //     'Random confetti explosions when you finish a task. Not a bug, a lifestyle choice.'
  //   ],
  //   mascotQuote: 'This app is so clean it basically smells like lavender. Also, I haven\'t crashed it once today... yet.'
  // },
  // {
  //   id: 'coffee-tracker-3000',
  //   title: 'Coffee Tracker 3000',
  //   version: 'v1.2.0',
  //   description: 'Tracks your caffeine intake with aggressive notifications that judge your life choices.',
  //   longDescription: 'Do you run on espresso? Or do you drown in pour-overs? Coffee Tracker 3000 logs every double shot, latte, and instant brew with precise timestamps. It monitors your biological caffeine curve and outputs snarky widgets based on how jittery your hands are.',
  //   category: 'Utility',
  //   framework: 'React Native',
  //   tags: ['REANIMATED', 'SQLITE'],
  //   size: '18.2 MB',
  //   minApi: 'Android 9',
  //   updatedAt: '3 hours ago',
  //   license: 'MIT',
  //   downloads: 320,
  //   status: 'Live',
  //   screenshotUrl: '/images/MainImage.jpg',
  //   iconType: 'coffee',
  //   worksGreat: [
  //     'Intelligent caffeine half-life decay simulation.',
  //     'Built-in "Panik Mode" siren if heart rate matches double-bass metal.',
  //     'Logs espresso beans with custom origin notes.'
  //   ],
  //   spontaneousFeatures: [
  //     'Occasionally registers plain water as highly-concentrated cold brew.',
  //     'Sends a push notification at 3 AM saying "I see you."'
  //   ],
  //   mascotQuote: 'Highly addictive. Will make your eyes twitch, but in a very productive way.'
  // },
  // {
  //   id: 'doggo-translator',
  //   title: 'Doggo Translator',
  //   version: 'v0.9.8-beta',
  //   description: 'AI-powered barking analysis. Spoiler: It mostly translates to "I am hungry" or "Look, a squirrel!".',
  //   longDescription: 'Decode the complex language of your best friend! Doggo Translator captures barking, whimpering, and tail-wagging patterns using neural microphones. Results may vary depending on dog stubbornness.',
  //   category: 'AI Assistant',
  //   framework: 'Expo Go',
  //   tags: ['EXPO GO', 'HERMES', 'AUDIO_ENGINE'],
  //   size: '56.0 MB',
  //   minApi: 'Android 10',
  //   updatedAt: '1 day ago',
  //   license: 'Apache 2.0',
  //   downloads: 140,
  //   status: 'Buggy',
  //   screenshotUrl: '/images/MainImage.jpg',
  //   iconType: 'dog',
  //   worksGreat: [
  //     'Understands Golden Retrievers at 98.2% lexical precision.',
  //     'Translates tail-wagging speed to descriptive adjectives.',
  //     'Automatic treat-dispensation request generation.'
  //   ],
  //   spontaneousFeatures: [
  //     'Translates cats as "Error: Superior being detected."',
  //     'Sometimes crashes and barks back through the main speaker.'
  //   ],
  //   mascotQuote: 'Woof woof! Translation: Please download my APK and feed me bacon immediately.'
  // },
  // {
  //   id: 'bug-breeder',
  //   title: 'Bug Breeder',
  //   version: 'v3.1.2',
  //   description: 'The only app that rewards you for finding edge cases. Level up your bugs and watch them break your UI.',
  //   longDescription: 'Why fix bugs when you can breed them? Find edge cases in your code, capture memory leaks, and generate visual glitch critters that dynamically crawl across your layout, chewing up DOM nodes in real time.',
  //   category: 'Developer Tool',
  //   framework: 'React Native',
  //   tags: ['REANIMATED', 'WEBGL_MOCK', 'GLITCH'],
  //   size: '28.4 MB',
  //   minApi: 'Android 11',
  //   updatedAt: '3 hours ago',
  //   license: 'MIT',
  //   downloads: 95,
  //   status: 'Live',
  //   screenshotUrl: '/images/logo.png',
  //   iconType: 'bug',
  //   worksGreat: [
  //     'Dynamic glitch simulator with genuine stack-trace rendering.',
  //     'Over 40 breedable bugs, including NullPointerButterfly and InfiniteLoopCaterpillar.',
  //     'Real-time console-error feeding mechanism.'
  //   ],
  //   spontaneousFeatures: [
  //     'Bugs can actually close the application if they eat the exit button.',
  //     'Changes phone system language to Binary'
  //   ],
  //   mascotQuote: 'Not a bug, a beautiful pet! Feed them exceptions and watch them multiply.'
  // },
  // {
  //   id: 'nap-master-pro',
  //   title: 'Nap Master Pro',
  //   version: 'v4.2.0-beta',
  //   description: 'An ultra-responsive alarm that only turns off if you solve a complex math problem or tell the app a secret.',
  //   longDescription: 'Are you a professional sleep champion? Nap Master Pro is designed for heavy sleepers. It records high-definition snoring audio to shame you later, drains battery with custom native vibrations, and forces you to plead for mercy or answer rocket science math to snooze.',
  //   category: 'Health',
  //   framework: 'Native Modules',
  //   tags: [ 'NATIVE AUDIO', 'MATH_ENGINE'],
  //   size: '42.5 MB',
  //   minApi: 'Android 10',
  //   updatedAt: '2 days ago',
  //   license: 'Proprietary',
  //   downloads: 1200,
  //   status: 'Sleeping',
  //   screenshotUrl: '/images/MainImage.jpg',
  //   iconType: 'alarm',
  //   worksGreat: [
  //     'Extreme volume crescendo that ignores physical side-buttons.',
  //     'AI analysis of grogginess levels through camera selfie check.',
  //     'Daily snooze tax (donates to open-source developers if you fail).'
  //   ],
  //   spontaneousFeatures: [
  //     'Might sleep through its own alarm if the room temperature is too comfy.',
  //     'Translates math puzzles to ancient runic code.'
  //   ],
  //   mascotQuote: 'Rest is important, but waking up to see the sunrise is pretty cool too!'
  // },
  // {
  //   id: 'vibe-check',
  //   title: 'Vibe Check',
  //   version: 'v1.0.1',
  //   description: 'Uses your camera to detect if the room\'s vibe is "Coding" or "Crying". 99.9% accuracy during deadlines.',
  //   longDescription: 'A custom mood scanner utilizing advanced, edge-computing pixel matrices. Ideal for student coders, startup founders, and anyone drinking their fourth energy drink. Automatically plays comforting lofi tracks when high cortisol is detected.',
  //   category: 'Social',
  //   framework: 'Expo Go',
  //   tags: ['EXPO GO', 'VISION_API', 'LOFI_PLAYER'],
  //   size: '31.1 MB',
  //   minApi: 'Android 11',
  //   updatedAt: '1 week ago',
  //   license: 'MIT',
  //   downloads: 250,
  //   status: 'Sleeping',
  //   screenshotUrl: '/images/MainImage.jpg',
  //   iconType: 'vibe',
  //   worksGreat: [
  //     'Instant detection of keyboard-slapping frequencies.',
  //     'Monitors dark circles under eyes with state-of-the-art contrast calculation.',
  //     'Automatic dark mode toggle upon deep weeping sound detection.'
  //   ],
  //   spontaneousFeatures: [
  //     'Flags rubber duckies as "Critical Lead Developers".',
  //     'Classifies heavy sighs as standard database optimization loops.'
  //   ],
  //   mascotQuote: 'Vibe check passed! Status: Sleep-deprived but incredibly creative.'
  // },
  {
    id: 'guilt-giver',
    title: 'Guilt Giver',
    version: 'v1.0.0',
    description: 'A sarcastic meal tracker that calls out your food choices and keeps you honest about your habits.',
    longDescription: 'Guilt Giver is a sarcastic meal tracker that bluntly calls out your food choices so you can stop ignoring them. Log meals, track macros, and get no-nonsense feedback designed for people who need a tougher push to eat better.',
    category: 'Health',
    framework: 'React Native',
    tags: ['EXPO', 'REACT NATIVE', 'AI', 'GUILT', 'HEALTH', 'MEAN'],
    size: '97.2 MB',
    minApi: 'Android 11',
    updatedAt: 'Freshly wired',
    license: 'MIT',
    downloads: 0,
    status: 'Buggy',
    screenshotUrl: '/images/GuiltGiverImage.jpg',
    screenshotFit: 'cover',
    screenshotScale: 150,
    screenshotXOffset: -1,
    screenshotYOffset: -2,
    coverUrl: '/images/GuiltGiverLogo.png',
    iconType: 'alarm',
    apk: '/apks/GuiltGiver.apk',
    worksGreat: [
      // 'Turns every skipped workout into a very personal reminder.',
      'Keeps macros visible without ever letting you feel comfortable.',
      'Surprisingly funny even while roasting you'
    ],
    spontaneousFeatures: [
      'Can roast your snack choices with surprising precision.',
      'Makes healthy eating feel like a personal challenge.'
    ],
    mascotQuote: 'A little guilt goes a long way when you are trying to stay on track.'
  }
];
