/*
  Deepfakes and AI-Generated Content quiz: real footage, deepfakes, and fully AI-generated video.
  See src/data/quizzes/aiGeneratedImages.js for the question format. Video questions use:
  - video (optional): { src, poster, description, caption } a single clip.
  - videos (optional): [{ src, poster, label, description }] shown side by side, plus `videosNote` under them.
  `description` is read to screen-reader users in place of watching; keep it a neutral account of what is shown.

  Every clip is a real video from Wikimedia Commons (public domain, CC0, or Creative Commons Attribution); none
  were generated for VerifyIT. They were trimmed to short excerpts and converted to MP4 so they play in every
  browser. The two deepfake advertisements were cut before their closing cards, which reveal that they are fake;
  that information is shown after answering instead. AI watermarks were left in place on purpose: learning to
  look for them is part of the lesson. File names, labels, and descriptions are neutral; the answers,
  explanations, and credits (with each file's license) live only on the server
  (server/src/data/quizAnswerKeys.js) and are revealed after answering.
*/

const PAIR_NOTE =
  'Here, "fake" means made or altered with AI. Either, both, or neither clip may be fake. Sources are shown after you answer.'
const SINGLE_CAPTION = 'Video found online, trimmed for this quiz. Its source is shown after you answer.'

const PAIR_OPTIONS = ['Video A is fake', 'Video B is fake', 'Both videos are fake', 'Both videos are real footage']
const SINGLE_OPTIONS = [
  'Real, unedited footage',
  "Deepfake: a real person's face or voice was changed by AI",
  'Fully AI-generated: the whole scene was made by an AI video tool',
]

export const deepfakesQuestions = [
  {
    id: 'df-21',
    categoryId: 'deepfakes',
    difficulty: 'Beginner',
    videos: [
      {
        src: '/quiz-videos/clip-07.mp4',
        poster: '/quiz-videos/clip-07.jpg',
        label: 'Video A',
        description: 'A short, low-resolution clip made of several quick shots of a man with short dark hair eating spaghetti, mostly with his hands. No sound.',
      },
      {
        src: '/quiz-videos/clip-12.mp4',
        poster: '/quiz-videos/clip-12.jpg',
        label: 'Video B',
        description: 'A sharp clip of a man with short dark hair in a patterned shirt eating spaghetti with a fork at a kitchen table. With sound.',
      },
    ],
    videosNote: PAIR_NOTE,
    prompt: 'Both clips appear to show the actor Will Smith eating spaghetti. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-22',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    video: {
      src: '/quiz-videos/clip-03.mp4',
      poster: '/quiz-videos/clip-03.jpg',
      description:
        'North Korean leader Kim Jong-un, seated at a desk in a wood-panelled office, appears to speak to the camera, with English subtitles about democracy and elections. With sound.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This clip spreads with the caption "North Korea\'s leader comments on American democracy." What is it?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-23',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    video: {
      src: '/quiz-videos/clip-15.mp4',
      poster: '/quiz-videos/clip-15.jpg',
      description:
        'Vladimir Putin, in a dark coat, speaks Russian to the camera at night outdoors, with a Kremlin tower and snowy fir trees behind him. The picture is low resolution. With sound.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This grainy clip of Vladimir Putin speaking is shared online. What is it?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-24',
    categoryId: 'deepfakes',
    difficulty: 'Advanced',
    video: {
      src: '/quiz-videos/clip-09.mp4',
      poster: '/quiz-videos/clip-09.jpg',
      description:
        'Vladimir Putin stands at a white podium in front of Russian flags and a golden wall, appearing to give a speech to American viewers about their election. With sound.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This sharp, professional-looking clip of Vladimir Putin is shared online. What is it?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-25',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    videos: [
      {
        src: '/quiz-videos/clip-01.mp4',
        poster: '/quiz-videos/clip-01.jpg',
        label: 'Video A',
        description:
          'At night, a woman in sunglasses, a black leather jacket, and a red dress walks toward the camera down a wet, neon-lit city street with pedestrians behind her. No sound.',
      },
      {
        src: '/quiz-videos/clip-11.mp4',
        poster: '/quiz-videos/clip-11.jpg',
        label: 'Video B',
        description:
          'In daylight, crowds of pedestrians cross a huge city intersection from every direction at once, filmed from above. With sound.',
      },
    ],
    videosNote: PAIR_NOTE,
    prompt: 'Both clips are shared as "Tokyo streets right now." Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-26',
    categoryId: 'deepfakes',
    difficulty: 'Advanced',
    videos: [
      {
        src: '/quiz-videos/clip-05.mp4',
        poster: '/quiz-videos/clip-05.jpg',
        label: 'Video A',
        description:
          'Wide shots of a long, curved stone railway viaduct in green Scottish hills as a steam train with red carriages crosses it, trailing white steam. With sound.',
      },
      {
        src: '/quiz-videos/clip-14.mp4',
        poster: '/quiz-videos/clip-14.jpg',
        label: 'Video B',
        description:
          'A close aerial view of a steam train with red carriages crossing a curved stone viaduct with many arches, in sunny hills. No sound.',
      },
    ],
    videosNote: PAIR_NOTE,
    prompt: "Both clips claim to show the Glenfinnan Viaduct in Scotland, the 'Harry Potter bridge'. Which statement is correct?",
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-27',
    categoryId: 'deepfakes',
    difficulty: 'Beginner',
    video: {
      src: '/quiz-videos/clip-02.mp4',
      poster: '/quiz-videos/clip-02.jpg',
      description:
        'Tall, phone-shaped footage styled like a police body camera, with a date, time, and REC label on screen. At night beside a highway, under flashing red and blue lights, a young man in a white T-shirt stands by a car. With sound.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This clip is shared as leaked police body-camera footage of an arrest. What is it?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-28',
    categoryId: 'deepfakes',
    difficulty: 'Advanced',
    video: {
      src: '/quiz-videos/clip-10.mp4',
      poster: '/quiz-videos/clip-10.jpg',
      description:
        'A man with short grey hair sips from a white cup by a sunny window in a café with bookshelves, then lowers the cup and gazes outside. With sound.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This calm café clip is posted as a stock video of a real customer. What is it?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-29',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    videos: [
      {
        src: '/quiz-videos/clip-13.mp4',
        poster: '/quiz-videos/clip-13.jpg',
        label: 'Video A',
        description: 'A small brown poodle puppy and a small Chihuahua puppy play and wrestle in and around a pink pet bed on a wooden floor. No sound.',
      },
      {
        src: '/quiz-videos/clip-06.mp4',
        poster: '/quiz-videos/clip-06.jpg',
        label: 'Video B',
        description:
          'A Dalmatian looks out of a window in a brightly painted yellow house, then climbs out and walks along the narrow window ledges of the building. No sound.',
      },
    ],
    videosNote: PAIR_NOTE,
    prompt: 'Both pet clips go viral on the same day. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-30',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    videos: [
      {
        src: '/quiz-videos/clip-08.mp4',
        poster: '/quiz-videos/clip-08.jpg',
        label: 'Video A',
        description: 'Two small brown-and-white speckled owls perch close together on a branch in a leafless tree, looking around. With sound.',
      },
      {
        src: '/quiz-videos/clip-04.mp4',
        poster: '/quiz-videos/clip-04.jpg',
        label: 'Video B',
        description:
          'In slow motion, a fluffy white puppy and a black puppy holding a ball run and tumble across a backyard lawn beside a wooden fence. No sound.',
      },
    ],
    videosNote: PAIR_NOTE,
    prompt: 'A friend says, "Videos this smooth and lovely are always AI now." Which statement is correct?',
    options: PAIR_OPTIONS,
  },
]
