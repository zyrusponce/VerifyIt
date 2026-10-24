/*
  Image Manipulation and Missing Context quiz: real edited photos and real photos reused out of context.
  See src/data/quizzes/aiGeneratedImages.js for the question format.

  Every image is a real file from Wikimedia Commons (public domain, CC BY, or CC BY-SA); none were edited or
  generated for VerifyIT, apart from resizing. The edited versions are historical or documented manipulations
  whose originals are also on Commons. File names, labels, and alt text are neutral; which image was edited, the
  explanations, and the credits live only on the server (server/src/data/quizAnswerKeys.js).
  The social media posts in `scenario` are FICTIONAL; the photos in them are real.
*/

const TINEYE = { label: 'TinEye reverse image search', url: 'https://tineye.com' }

const PAIR_NOTE = 'Either, both, or neither photo may have been edited. Sources are shown after you answer.'
const SINGLE_CAPTION = 'Real photo found online. Its source is shown after you answer.'

const PAIR_OPTIONS = ['Image A was edited', 'Image B was edited', 'Both images were edited', 'Neither image was edited']

export const imageManipulationQuestions = [
  {
    id: 'im-11',
    categoryId: 'image-manipulation',
    difficulty: 'Beginner',
    images: [
      {
        src: '/quiz-images/edit-01.jpg',
        label: 'Image A',
        alt: 'Image A: a black-and-white photo of three men in long coats and caps standing by the water at a canal, with buildings behind them.',
      },
      {
        src: '/quiz-images/edit-02.jpg',
        label: 'Image B',
        alt: 'Image B: a black-and-white photo of four men in long coats and caps standing by the water at a canal, with buildings behind them.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both photos show Joseph Stalin (in the middle) visiting a canal in 1937. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'im-12',
    categoryId: 'image-manipulation',
    difficulty: 'Beginner',
    images: [
      {
        src: '/quiz-images/edit-03.jpg',
        label: 'Image A',
        alt: 'Image A: a black-and-white photo of two men and a woman in a hat talking on a stone terrace, with a pine tree and a snowy mountain behind them.',
      },
      {
        src: '/quiz-images/edit-04.jpg',
        label: 'Image B',
        alt: 'Image B: a black-and-white photo of a man and a woman in a hat talking on a stone terrace, with a pine tree and a snowy mountain behind them.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both photos show Queen Elizabeth and Canadian Prime Minister Mackenzie King at Banff, Canada, in 1939. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'im-13',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/edit-05.jpg',
      alt: 'An old sepia photo of four young girls in hats and coats sitting side by side on a park bench in front of a large tree trunk.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This 1902 photo shows the four daughters of Russia\'s last tsar. Look closely behind the girls in the middle. What do you notice?',
    options: [
      'Nothing: it is an unedited group photo',
      'Someone was removed: the skirt of an adult is still visible behind the children',
      'The photo was colourized from a black-and-white original',
      'It is an AI-generated image of historical children',
    ],
  },
  {
    id: 'im-14',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/edit-06.jpg',
        label: 'Image A',
        alt: 'Image A: a large neoclassical museum building in Manila at sunset, seen across a busy road with cars, motorbikes, and pedestrians.',
      },
      {
        src: '/quiz-images/edit-07.jpg',
        label: 'Image B',
        alt: 'Image B: a large neoclassical museum building in Manila at sunset, seen across a busy road with cars, motorbikes, and pedestrians.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both photos of the National Museum of Fine Arts in Manila were taken in 2024. Compare the skyline behind the museum. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'im-15',
    categoryId: 'image-manipulation',
    difficulty: 'Advanced',
    image: {
      src: '/quiz-images/edit-08.jpg',
      alt: 'An old engraved portrait of Abraham Lincoln standing in a long coat beside a table with papers and books, with a globe and a draped flag behind him.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This dignified standing portrait of Abraham Lincoln was sold widely in the 1860s. What is it?',
    options: [
      'An authentic portrait made from a photo of Lincoln posing',
      "A composite: Lincoln's head was placed on another politician's body",
      'An AI-generated image made to look historical',
      'A real portrait whose colours were only adjusted',
    ],
  },
  {
    id: 'im-16',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/edit-09.jpg',
      alt: 'An old, grainy black-and-white photo of a large funnel-shaped tornado above a dirt road between dark trees.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This photo claims to show a tornado in Kirksville, Missouri, on 27 April 1899. What is it?',
    options: [
      'A genuine photo of that tornado',
      'A composite: a tornado from another photo was pasted onto a landscape',
      'An AI-generated image, aged to look old',
      'A painting, not a photograph',
    ],
  },
  {
    id: 'im-17',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/edit-10.jpg',
        label: 'Image A',
        alt: 'Image A: a sandy beach with two people sunbathing beside a concrete quay, small boats on a fjord, and a steep green mountain under blue sky.',
      },
      {
        src: '/quiz-images/edit-11.jpg',
        label: 'Image B',
        alt: 'Image B: a large orange wooden building with a café terrace on a concrete quay beside a fjord, with a steep green mountain under blue sky.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both photos are labelled "the harbour in Sogndal, Norway, 2016". Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'im-18',
    categoryId: 'image-manipulation',
    difficulty: 'Beginner',
    image: {
      src: '/quiz-images/edit-12.jpg',
      alt: 'People wade through knee-deep floodwater on a city street, pushing a wooden cart, with palm trees, a Philippine flag, and tall buildings behind them.',
      caption: SINGLE_CAPTION,
    },
    scenario: {
      account: 'Metro Updates Now',
      handle: '@metroupdates_now',
      meta: 'Posted 20 minutes ago · Photo',
      text: 'MANILA UNDERWATER RIGHT NOW after last night\'s rain!! Share to warn everyone!!',
    },
    prompt: 'The photo looks real and unedited. What does it prove on its own?',
    options: [
      'That Manila is flooded right now',
      'That the photo is fake, because it is being shared with a dramatic caption',
      'That a flood happened somewhere at some time, but not when or where; find the original source first',
      'Nothing, because flood photos are always edited',
    ],
    source: TINEYE,
  },
  {
    id: 'im-19',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/edit-13.jpg',
      alt: 'A huge grey mushroom-shaped ash cloud rises from behind distant mountains into a blue sky, seen across a flat, empty field.',
      caption: SINGLE_CAPTION,
    },
    scenario: {
      account: 'PH Breaking Alerts',
      handle: '@ph_breaking_alerts',
      meta: 'Posted 1 hour ago · Photo',
      text: 'TAAL VOLCANO ERUPTED THIS MORNING. Evacuate now!!',
      detail:
        'A reverse image search finds the same photo on the US Geological Survey website, captioned "June 12, 1991, eruption column from Mount Pinatubo, taken from Clark Air Base."',
    },
    prompt: 'What does the reverse image search tell you about this post?',
    options: [
      'It is a real photo of Taal Volcano this morning',
      'It is an AI-generated image',
      'It is a real photo, but of a different volcano and year, reused out of context',
      'It is a real photo that was edited to add the ash cloud',
    ],
    source: TINEYE,
  },
  {
    id: 'im-20',
    categoryId: 'image-manipulation',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/edit-14.jpg',
        label: 'Image A',
        alt: 'Image A: a muddy residential street covered in debris after a flood, with people, a bicycle cart, water containers, and a parked car.',
      },
      {
        src: '/quiz-images/edit-15.jpg',
        label: 'Image B',
        alt: 'Image B: brown floodwater covering open ground in front of a large SM City shopping mall.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both photos are shared with the caption "Flood damage after Typhoon Ondoy (Ketsana), September 2009." Which statement is correct?',
    options: PAIR_OPTIONS,
  },
]
