/*
  Quiz categories for the Quiz page (/quiz) and each category quiz (/quiz/:categoryId).

  How to edit:
  - `id` is used in the URL (/quiz/<id>) and in localStorage. Changing an id resets saved scores for it.
  - `icon` must match a key in ICONS inside src/components/QuizCategoryCard.jsx.
  - `relatedLessonIds` must match lesson ids in src/data/lessons.js. They are suggested on the results screen.
  - `resources` are external links. Check every URL before presenting.
  - Questions live in src/data/quizzes/, one file per category. The Mixed Challenge has no file of its own:
    it draws `questionsPerCategory` questions from every other category.
*/

import { aiGeneratedImagesQuestions } from './quizzes/aiGeneratedImages.js'
import { misleadingInformationQuestions } from './quizzes/misleadingInformation.js'
import { sourceCredibilityQuestions } from './quizzes/sourceCredibility.js'
import { imageManipulationQuestions } from './quizzes/imageManipulation.js'
import { deepfakesQuestions } from './quizzes/deepfakes.js'
import { factCheckingQuestions } from './quizzes/factChecking.js'

export const MIXED_CATEGORY_ID = 'mixed-challenge'

export const quizCategories = [
  {
    id: 'ai-generated-images',
    title: 'AI-Generated Image Detection',
    description:
      'Real photo or AI? Study real images found online, decide which ones were made by AI, then see the clues and the original sources.',
    icon: 'scan',
    difficulty: 'Intermediate',
    topics: ['Real vs. AI-generated images', 'Visual clues', 'Watermarks and context', 'Checking the source'],
    notice:
      'Visual clues and AI detection tools are not always reliable. An unusual-looking image is not automatically AI-generated, and a realistic one is not automatically authentic.',
    questions: aiGeneratedImagesQuestions,
    relatedLessonIds: ['ai-generated-content-deepfakes', 'manipulated-images-context'],
    resources: [
      { label: 'Content Authenticity Initiative', url: 'https://contentauthenticity.org' },
      { label: 'C2PA: Coalition for Content Provenance and Authenticity', url: 'https://c2pa.org' },
      { label: 'TinEye reverse image search', url: 'https://tineye.com' },
    ],
  },
  {
    id: 'misleading-information',
    title: 'Misleading Information',
    description:
      'Identify misleading claims, false information, clickbait, and sensational headlines before they shape what you believe or share.',
    icon: 'megaphone',
    difficulty: 'Beginner',
    topics: ['Unsupported claims', 'Exaggerated headlines', 'Clickbait', 'Missing context'],
    questions: misleadingInformationQuestions,
    relatedLessonIds: ['misleading-headlines-clickbait', 'what-is-misinformation', 'misinformation-vs-disinformation'],
    resources: [
      { label: 'News Literacy Project', url: 'https://newslit.org' },
      {
        label: 'Information Disorder report (Council of Europe)',
        url: 'https://rm.coe.int/information-disorder-toward-an-interdisciplinary-framework-for-researc/168076277c',
      },
    ],
  },
  {
    id: 'source-credibility',
    title: 'Source Credibility',
    description:
      'Learn how to evaluate websites, publishers, authors, and online sources by checking who is behind the information.',
    icon: 'shield',
    difficulty: 'Beginner',
    topics: ['Author credentials', 'Original sources', 'Publication history', 'Independent verification'],
    questions: sourceCredibilityQuestions,
    relatedLessonIds: ['evaluating-online-sources', 'checking-evidence-sources'],
    resources: [
      { label: 'SIFT: The Four Moves (Mike Caulfield)', url: 'https://hapgood.us/2019/06/19/sift-the-four-moves/' },
      { label: 'News Literacy Project', url: 'https://newslit.org' },
    ],
  },
  {
    id: 'image-manipulation',
    title: 'Image Manipulation and Missing Context',
    description:
      'Spot images that have been edited, cropped, or reused in the wrong context. An authentic image can still be used to mislead.',
    icon: 'crop',
    difficulty: 'Intermediate',
    topics: ['Reverse image search', 'Original publication dates', 'Cropping and editing', 'Image context'],
    notice: 'An authentic, unedited photo can still mislead when it is shown with the wrong date, place, or caption.',
    questions: imageManipulationQuestions,
    relatedLessonIds: ['manipulated-images-context'],
    resources: [
      { label: 'TinEye reverse image search', url: 'https://tineye.com' },
      { label: 'Google Fact Check Explorer', url: 'https://toolbox.google.com/factcheck/explorer' },
    ],
  },
  {
    id: 'deepfakes',
    title: 'Deepfakes and AI-Generated Content',
    description:
      'Watch real videos found online and decide: real footage, a deepfake of a real person, or a clip made entirely by AI tools like Sora and Veo. Then see the clues and the original sources.',
    icon: 'clapperboard',
    difficulty: 'Advanced',
    topics: ['Deepfake videos', 'AI-generated video (Sora, Veo)', 'Real footage vs. fakes', 'Checking the source'],
    notice: 'No detection tool is perfectly accurate. Verifying where media came from is usually more reliable than judging how it looks.',
    questions: deepfakesQuestions,
    relatedLessonIds: ['ai-generated-content-deepfakes'],
    resources: [
      { label: 'Content Authenticity Initiative', url: 'https://contentauthenticity.org' },
      { label: 'C2PA: Coalition for Content Provenance and Authenticity', url: 'https://c2pa.org' },
    ],
  },
  {
    id: 'fact-checking',
    title: 'Fact-Checking and Evidence Verification',
    description:
      'Investigate claims using evidence and reliable sources: cross-check information, find originals, and separate facts from unsupported claims.',
    icon: 'file-search',
    difficulty: 'Intermediate',
    topics: ['Cross-checking', 'Finding original sources', 'Examining evidence', 'Facts vs. unsupported claims'],
    questions: factCheckingQuestions,
    relatedLessonIds: ['checking-evidence-sources', 'responsible-sharing'],
    resources: [
      { label: 'Google Fact Check Explorer', url: 'https://toolbox.google.com/factcheck/explorer' },
      { label: 'International Fact-Checking Network (Poynter)', url: 'https://www.poynter.org/ifcn/' },
      { label: 'SIFT: The Four Moves (Mike Caulfield)', url: 'https://hapgood.us/2019/06/19/sift-the-four-moves/' },
    ],
  },
  {
    id: MIXED_CATEGORY_ID,
    title: 'Mixed Challenge',
    description:
      'A comprehensive challenge with questions from every category. Best taken after you have explored the individual topics.',
    icon: 'shuffle',
    difficulty: 'Advanced',
    topics: ['Questions from all six categories', 'New mix on every attempt'],
    isMixed: true,
    questionsPerCategory: 2,
    relatedLessonIds: [],
    resources: [
      { label: 'SIFT: The Four Moves (Mike Caulfield)', url: 'https://hapgood.us/2019/06/19/sift-the-four-moves/' },
      { label: 'UNESCO Media and Information Literacy', url: 'https://www.unesco.org/en/media-information-literacy' },
    ],
  },
]

/** The six single-topic categories (everything except the Mixed Challenge). */
export const topicCategories = quizCategories.filter((category) => !category.isMixed)

/** Every question from every topic category, used by the Mixed Challenge and for totals. */
export const allQuestions = topicCategories.flatMap((category) => category.questions)

export function getQuizCategory(id) {
  return quizCategories.find((category) => category.id === id) ?? null
}

/** How many questions one attempt of this category contains. */
export function getQuestionCount(category) {
  if (category.isMixed) return topicCategories.length * category.questionsPerCategory
  return category.questions.length
}

export const categoryTitle = Object.fromEntries(quizCategories.map((category) => [category.id, category.title]))
