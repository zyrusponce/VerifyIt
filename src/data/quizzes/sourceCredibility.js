/*
  Source Credibility quiz. See src/data/quizzes/aiGeneratedImages.js for the question format.
  All posts, accounts, websites, and places in `scenario` are FICTIONAL training examples.
*/

const SIFT = { label: 'SIFT: The Four Moves (Mike Caulfield)', url: 'https://hapgood.us/2019/06/19/sift-the-four-moves/' }

export const sourceCredibilityQuestions = [
  {
    id: 'sc-01',
    categoryId: 'source-credibility',
    difficulty: 'Beginner',
    scenario: {
      account: 'Brightvale Breaking 24/7',
      handle: '@bvbreaking247',
      meta: 'Account created 3 weeks ago · 48K followers',
      text: 'URGENT: All public schools in Brightvale will close for one month starting Monday. Share before this gets deleted!',
    },
    prompt: 'Is this post a reliable source for the school closure?',
    options: [
      'Yes, it has many followers',
      'Not yet; check the education office\'s official channels first',
      'Yes, because it says "urgent"',
      'Yes, because it might get deleted',
    ],
  },
  {
    id: 'sc-02',
    categoryId: 'source-credibility',
    difficulty: 'Beginner',
    scenario: {
      account: 'Dr. R. Santos Wellness',
      handle: 'santoswellness.shop',
      meta: 'Website · "Shop Now" banner on every page',
      text: 'Doctors don\'t want you to know: our herbal tea removes all toxins in 48 hours. Order today for 50% off!',
    },
    prompt: 'What is the biggest credibility concern with this source?',
    options: [
      'The website uses bright colors',
      'The person uses the title "Dr."',
      'The source profits from the claim and offers no evidence',
      'The post is written in English',
    ],
    source: SIFT,
  },
  {
    id: 'sc-03',
    categoryId: 'source-credibility',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Brightvale Times',
      handle: 'brightvale-times.news',
      meta: 'Shared link · Same logo and colors as the real paper',
      text: 'Brightvale Times: Governor resigns in shock announcement',
      detail: 'The real Brightvale Times website is brightvaletimes.com. Its homepage has no story about a resignation.',
    },
    prompt: 'What is the most likely explanation?',
    options: [
      'The newspaper moved to a new web address',
      'It is a look-alike website imitating a real outlet',
      'The real outlet deleted the story by accident',
      'Both websites are equally reliable',
    ],
  },
  {
    id: 'sc-04',
    categoryId: 'source-credibility',
    difficulty: 'Intermediate',
    prompt: 'You find an unfamiliar website with a professional design. What is the most effective way to learn whether it is trustworthy?',
    options: [
      'Read its About page and trust what it says about itself',
      'Judge it by how professional the design looks',
      'Open new tabs and search what other reliable sources say about the website and its owners',
      'Check how many ads it has',
    ],
    source: SIFT,
  },
  {
    id: 'sc-05',
    categoryId: 'source-credibility',
    difficulty: 'Beginner',
    scenario: {
      account: 'Kai Lifestyle',
      handle: '@kai.lifestyle',
      meta: 'Fitness and fashion creator · 1.2M followers',
      text: 'Thread: Why you should stop taking the medicine your doctor prescribed for blood pressure 🧵',
    },
    prompt: 'What should you check first about this author?',
    options: [
      'Whether they have relevant medical expertise and cite reliable evidence',
      'How many followers they have',
      'Whether their photos look professional',
      'Whether you like their other content',
    ],
  },
  {
    id: 'sc-06',
    categoryId: 'source-credibility',
    difficulty: 'Beginner',
    scenario: {
      account: 'Policy Pulse Blog',
      handle: 'policypulse.example',
      meta: 'Blog post',
      text: 'A new government report says half of all students fail basic math. Read our summary below!',
      detail: 'The blog does not link to the report or give its title.',
    },
    prompt: 'What is the best next step before trusting the summary?',
    options: [
      'Share it, because it mentions a government report',
      'Find the original report on the responsible agency\'s official website',
      'Trust it if the blog has many comments',
      'Assume the report does not exist',
    ],
    source: SIFT,
  },
  {
    id: 'sc-07',
    categoryId: 'source-credibility',
    difficulty: 'Intermediate',
    prompt: 'Which of these is the strongest sign that a news website is accountable for its reporting?',
    options: [
      'It publishes many articles every hour',
      'It has a large social media following',
      'It names its editors and owners, gives contact details, and publishes corrections when it makes mistakes',
      'Its headlines are written in all capital letters',
    ],
  },
  {
    id: 'sc-08',
    categoryId: 'source-credibility',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Real Talk Updates ✓',
      handle: '@realtalkupdates',
      meta: 'Account with a checkmark badge',
      text: 'CONFIRMED: Classes suspended nationwide tomorrow.',
    },
    prompt: 'Does the checkmark mean this post is accurate?',
    options: [
      'Yes, verified accounts cannot post false information',
      'No; depending on the platform, a badge may show identity or a paid subscription, not accuracy',
      'Yes, because "CONFIRMED" is in the post',
      'No, because checkmarks are always fake',
    ],
  },
  {
    id: 'sc-09',
    categoryId: 'source-credibility',
    difficulty: 'Advanced',
    scenario: {
      account: 'Fictional example',
      handle: 'Two websites',
      meta: 'Search results',
      text: 'Site A and Site B both report that a celebrity is opening a school in Brightvale.',
      detail: 'Site B\'s article copies Site A\'s text almost word for word and says "according to reports." Neither names a source.',
    },
    prompt: 'Do these two articles count as independent confirmation?',
    options: [
      'Yes, two websites agree',
      'No, both trace back to the same single unsourced report',
      'Yes, because Site B added "according to reports"',
      'No, because celebrities never open schools',
    ],
    source: SIFT,
  },
  {
    id: 'sc-10',
    categoryId: 'source-credibility',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Brightvale Daily',
      handle: 'brightvaledaily.example',
      meta: 'Small label at the top: "Sponsored content"',
      text: 'Why experts say NovaFresh is the healthiest drink for students',
    },
    prompt: 'How should you treat this article?',
    options: [
      'As independent news reporting',
      'As paid promotion that the brand likely influenced',
      'As a government health advisory',
      'As an independent fact-check',
    ],
  },
]
