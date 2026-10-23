/*
  AI-Generated Image Detection quiz: "Real photo or AI?"

  Every question asks the learner to identify real images found on the internet. All images come from
  Wikimedia Commons under public-domain or CC0 terms; none were drawn or generated for VerifyIT.

  Question format (same for every file in src/data/quizzes/):
  - id: unique across all quizzes
  - categoryId: must match an id in src/data/quizCategories.js
  - prompt: the question text
  - image (optional): { src, alt, caption } a single image.
  - images (optional): [{ src, alt, label }] shown side by side, plus `imagesNote` under them.
  - options: two to four answer choices
  - The correct answer, the explanation, and the image credits are NOT stored here. They live only on the
    server (server/src/data/quizAnswerKeys.js) and are revealed after each answer is submitted. Keep file
    names, labels, captions, and alt text neutral so they never give the answer away.
  - difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  - source (optional): { label, url }. Add one only for a real tool, standard, or published reference.

  Image files: public/quiz-images/hedgehog-*.jpg and identify-*.jpg. Their sources and licenses are listed
  with each question's credits in the server answer key.
*/

// Shown under side-by-side images. It never says how many are AI-generated.
const PAIR_NOTE = 'Either, both, or neither image may be AI-generated. Sources are shown after you answer.'
const SINGLE_CAPTION = 'Image found online. Its source is shown after you answer.'

const PAIR_OPTIONS = ['Image A is AI-generated', 'Image B is AI-generated', 'Both images are AI-generated', 'Both images are real photographs']
const SINGLE_OPTIONS = ['AI-generated', 'Real photograph']

export const aiGeneratedImagesQuestions = [
  {
    id: 'aii-11',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/hedgehog-a.jpg',
        label: 'Image A',
        alt: 'Image A: a hedgehog with pale, evenly spiked quills and a white face rests its front paws on a log, with a blurred green background.',
      },
      {
        src: '/quiz-images/hedgehog-b.jpg',
        label: 'Image B',
        alt: 'Image B: a brown hedgehog, partly curled up on a lawn, with blades of dry grass caught in its spines.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Look closely at both hedgehogs. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'aii-12',
    categoryId: 'ai-generated-images',
    difficulty: 'Beginner',
    images: [
      {
        src: '/quiz-images/identify-01.jpg',
        label: 'Image A',
        alt: 'Image A: a sunny meadow of tall golden grass in front of pine trees and grey granite cliffs, with a rounded granite dome in the distance under a deep blue sky.',
      },
      {
        src: '/quiz-images/identify-02.jpg',
        label: 'Image B',
        alt: 'Image B: a glowing mountain valley at golden hour with a calm river, scattered boulders, a log cabin, and tall granite cliffs. A small round label sits in the lower-right corner.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Both images were shared as views of the same famous mountain valley. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'aii-13',
    categoryId: 'ai-generated-images',
    difficulty: 'Advanced',
    images: [
      {
        src: '/quiz-images/identify-04.jpg',
        label: 'Image A',
        alt: 'Image A: a green apple with a short stem sits on a beige linen tablecloth in soft, warm studio light.',
      },
      {
        src: '/quiz-images/identify-03.jpg',
        label: 'Image B',
        alt: 'Image B: a green apple sits on a plain light grey surface against a grey background, with a soft shadow behind it.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Two photos of a green apple, both posted as stock photos. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'aii-14',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    images: [
      {
        src: '/quiz-images/identify-05.jpg',
        label: 'Image A',
        alt: 'Image A: a smooth, saucer-shaped cloud hangs alone in an orange sunset sky above dark mountain ridges. A photographer\'s name appears in the lower-right corner.',
      },
      {
        src: '/quiz-images/identify-06.jpg',
        label: 'Image B',
        alt: 'Image B: a shiny green apple covered in water droplets hangs from a branch among green leaves.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'People commented that both of these look "too strange" or "too perfect" to be real. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'aii-15',
    categoryId: 'ai-generated-images',
    difficulty: 'Advanced',
    images: [
      {
        src: '/quiz-images/identify-07.jpg',
        label: 'Image A',
        alt: 'Image A: a gift box wrapped in crumpled red paper with white polka dots, held shut with a cross of brown paper tape, on a wooden table.',
      },
      {
        src: '/quiz-images/identify-08.jpg',
        label: 'Image B',
        alt: 'Image B: a round wreath of fir branches with white chrysanthemum flowers and a black ribbon bow, lying on a gold surface.',
      },
    ],
    imagesNote: PAIR_NOTE,
    prompt: 'Look at these two everyday objects. Which statement is correct?',
    options: PAIR_OPTIONS,
  },
  {
    id: 'aii-16',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/identify-09.jpg',
      alt: 'Students in sweatshirts browse and hold books in a library with tall wooden bookshelves; open books lie on a wooden counter in the foreground. A small word appears in the lower-right corner.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'A page shares this as a photo from a school library\'s book week. Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'aii-17',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/identify-10.jpg',
      alt: 'A bearded man in a camouflage uniform sits in a wheelchair in front of a large flag, holding a cardboard sign that reads "Today\'s my birthday, please like". One knee is wrapped in a bandage.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This picture is spreading with the caption "Nobody wished me happy birthday." Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'aii-18',
    categoryId: 'ai-generated-images',
    difficulty: 'Beginner',
    image: {
      src: '/quiz-images/identify-11.jpg',
      alt: 'Two smiling children at a classroom table with colored pencils. The boy in a green shirt raises one hand high while two more hands clap in front of him.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'Look carefully at the boy in the green shirt. Is this image AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'aii-19',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/identify-12.jpg',
      alt: 'A lane between traditional wooden Japanese buildings is filled with rows of orange tulips and pink blossoming trees; a red lattice tower and a snow-capped volcano rise at the end of the lane.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'A travel page posts this as "Spring in a Japanese village." Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
  {
    id: 'aii-20',
    categoryId: 'ai-generated-images',
    difficulty: 'Intermediate',
    image: {
      src: '/quiz-images/identify-13.jpg',
      alt: 'A very close, wide-angle shot of a red fox\'s face with amber eyes and fluffy, uneven fur, standing on wet stones beside a stream.',
      caption: SINGLE_CAPTION,
    },
    prompt: 'This close-up of a wild fox is sharp, dramatic, and almost too good. Is it AI-generated or a real photograph?',
    options: SINGLE_OPTIONS,
  },
]
