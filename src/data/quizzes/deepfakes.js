/*
  Deepfakes and AI-Generated Content quiz: synthetic people and fake "historical" photos.
  See src/data/quizzes/aiGeneratedImages.js for the question format.

  Every image is a real file from Wikimedia Commons (public domain); none were drawn or generated for VerifyIT.
  Real people shown are historical figures and astronauts in their public-domain official portraits.
  File names, labels, and alt text are neutral; which images are AI-generated, the explanations, and the
  credits live only on the server (server/src/data/quizAnswerKeys.js) and are revealed after answering.
*/

const PAIR_NOTE = 'Either, both, or neither image may be AI-generated. Sources are shown after you answer.'
const SINGLE_CAPTION = 'Image found online. Its source is shown after you answer.'

const PAIR_OPTIONS = ['Image A is AI-generated', 'Image B is AI-generated', 'Both images are AI-generated', 'Both images are real photographs']
const SINGLE_OPTIONS = ['AI-generated', 'Real photograph']

export const deepfakesQuestions = [
  {
    id: 'df-11',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/spot-01.jpg',
      alt: 'A close-up portrait of a smiling woman with shoulder-length brown hair against a dark background.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'A new account with this profile photo sends you a friend request. Does this person exist, or is the photo AI-generated?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-12',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/spot-02.jpg',
        label: 'Image A',
        alt: 'Image A: a close-up of a man with short dark hair and a short beard, wearing an earpiece, in front of a blurred blue background.',
      },
      {
        src: '/quiz-images/spot-03.jpg',
        label: 'Image B',
        alt: 'Image B: an older man in an orange flight suit poses with a helmet in front of a flag and a model of a space shuttle.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Two accounts message you about a space-science scholarship, each with one of these photos. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-13',
    categoryId: 'deepfakes',
    difficulty: 'Advanced',
    images: [
      {
        src: '/quiz-images/spot-04.jpg',
        label: 'Image A',
        alt: 'Image A: a close-up of a young woman with straight brown hair and bangs in front of a grey stone wall.',
      },
      {
        src: '/quiz-images/spot-05.jpg',
        label: 'Image B',
        alt: 'Image B: a close-up of a smiling boy with short black hair and a white collared shirt against a black background.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Two new members join your class group chat with these profile photos. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-14',
    categoryId: 'deepfakes',
    difficulty: 'Beginner',
    images: [
      {
        src: '/quiz-images/spot-06.jpg',
        label: 'Image A',
        alt: 'Image A: a faded sepia portrait of a tall bearded man in a dark suit, seated beside a small table with his hand at his face.',
      },
      {
        src: '/quiz-images/spot-07.jpg',
        label: 'Image B',
        alt: 'Image B: a sharp color image of a bearded man in 1860s-style clothes and a bow tie, seated on a leather sofa and looking down at a smartphone.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both images are shared as photographs of Abraham Lincoln, president of the United States in the 1860s. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-15',
    categoryId: 'deepfakes',
    difficulty: 'Advanced',
    images: [
      {
        src: '/quiz-images/spot-08.jpg',
        label: 'Image A',
        alt: 'Image A: a crisp, colorful postcard of a stone railway station with a steam train arriving and people in long coats on the platform.',
      },
      {
        src: '/quiz-images/spot-09.jpg',
        label: 'Image B',
        alt: 'Image B: a grainy black-and-white postcard of the same stone railway station with a steam train arriving and people on the platform.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both are shared as the same old postcard of a French train station from around 1900. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'df-16',
    categoryId: 'deepfakes',
    difficulty: 'Beginner',
    image: {
      src: '/quiz-images/spot-10.jpg',
      alt: 'A group of people dressed in animal furs gathers outside a cave as a bearded man proudly presents a large wooden wheel; a cave painting with animals and handprints is on the rock wall.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'A page shares this as a "rare photo of the invention of the wheel." Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-17',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/spot-11.jpg',
      alt: 'A close-up of a smiling young man with short dark hair and stubble outdoors, with a blurred green and grey background.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This photo appears next to a glowing "verified buyer" review of a weight-loss product. Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-18',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/spot-12.jpg',
      alt: 'A smiling woman with curly brown hair in a navy blue shirt with patches, posing in front of a flag and a model of a space shuttle.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This portrait of an astronaut looks polished and professional. Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-19',
    categoryId: 'deepfakes',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/spot-13.jpg',
      alt: 'An old black-and-white photo of a steam locomotive that has burst through the front wall of a large station building and nosed down onto the street below.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This "old photo" of a train that crashed through a station wall looks staged. Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'df-20',
    categoryId: 'deepfakes',
    difficulty: 'Beginner',
    image: {
      src: '/quiz-images/spot-14.jpg',
      alt: 'An old black-and-white photo of an early automobile with passengers parked inside a tunnel cut through the base of an enormous tree.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'A car parked inside a tunnel cut through a living tree? Is this old photo AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
]
