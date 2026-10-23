/*
  Misleading Information quiz. See src/data/quizzes/aiGeneratedImages.js for the question format.
  All posts, accounts, and places in `scenario` are FICTIONAL training examples.
*/

export const misleadingInformationQuestions = [
  {
    id: 'mi-01',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'The Daily Click',
      handle: 'dailyclick.example',
      meta: 'Headline',
      text: 'STUDY PROVES Video Games Make Students Fail',
      detail:
        'Article text: "Researchers surveyed 60 students and found that those who reported playing more than 5 hours a night had slightly lower grades on average. The researchers noted that sleep and other factors may explain the difference."',
    },
    prompt: 'Does the headline accurately represent the article?',
    options: [
      'Yes, the study proves it',
      'No, the article describes a small association, not proof',
      'Yes, because researchers were involved',
      'It is impossible to tell from the article',
    ],
  },
  {
    id: 'mi-02',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'TrendHub Stories',
      handle: '@trendhubstories',
      meta: 'Headline',
      text: 'Is Your Phone Secretly Listening to Every Word You Say? (The Answer Will Shock You)',
    },
    prompt: 'Which clickbait technique does this headline mainly use?',
    options: [
      'Citing an original source',
      'A curiosity gap and a leading question',
      'Including a publication date',
      'Naming the author',
    ],
  },
  {
    id: 'mi-03',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'Money Watch PH Fan Page',
      handle: '@moneywatchfans',
      meta: 'Posted today · Links to an article',
      text: 'BREAKING: Rice prices to jump 30% next week!',
      detail: 'The linked article is from a real outlet but is dated four years ago.',
    },
    prompt: 'How should you assess this post?',
    options: [
      'Supported, because the outlet is real',
      'Misleading, because an old article is presented as current news',
      'Supported, because prices change often',
      'Not enough information, because the article has no headline',
    ],
  },
  {
    id: 'mi-04',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'Wellness Secrets Daily',
      handle: '@wellnesssecrets',
      meta: 'Posted today · Text',
      text: 'Experts agree: drinking five liters of water a day cures migraines permanently!',
    },
    prompt: 'What is the main problem with this claim?',
    options: [
      'It mentions water',
      'It cites "experts" without naming them or showing any evidence',
      'It is too short to be wrong',
      'Nothing; experts are always right',
    ],
  },
  {
    id: 'mi-05',
    categoryId: 'misleading-information',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Barangay Watch Brightvale',
      handle: '@brgywatch_bv',
      meta: 'Posted today · Graphic',
      text: 'BIKE THEFTS UP 100% IN OUR BARANGAY! No one is safe!',
      detail: 'The barangay report lists 2 bike thefts last year and 4 this year.',
    },
    prompt: 'Why is the "100%" figure misleading here?',
    options: [
      'Because the math is wrong',
      'Because a large percentage based on very small numbers exaggerates the change',
      'Because percentages are always false',
      'It is not misleading; 100% is the correct figure',
    ],
  },
  {
    id: 'mi-06',
    categoryId: 'misleading-information',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Tito Ben',
      handle: 'Family group chat',
      meta: 'Forwarded screenshot',
      text: 'City to replace all traffic lights with roosters to save electricity, says mayor.',
      detail: 'The original article comes from a website whose About page describes it as a humor and satire publication.',
    },
    prompt: 'What went wrong when this was shared in the family chat?',
    options: [
      'Satire was shared as a screenshot without its context, so it looks like real news',
      'The article is a real government announcement',
      'Satire websites should be banned',
      'Nothing; screenshots always keep the original context',
    ],
  },
  {
    id: 'mi-07',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'Pinoy Outrage Network',
      handle: '@pinoyoutrage',
      meta: 'Posted 1 hour ago · Text',
      text: 'DISGUSTING!!! You will be FURIOUS when you see what they are putting in school lunches. SHARE NOW before they hide it!!!',
    },
    prompt: 'Which feature of this post is the biggest warning sign?',
    options: [
      'It mentions school lunches',
      'It uses strong emotional language and urgency instead of facts',
      'It was posted an hour ago',
      'It uses capital letters only once',
    ],
  },
  {
    id: 'mi-08',
    categoryId: 'misleading-information',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Fictional example',
      handle: 'Family group chat',
      meta: 'Text message',
      text: 'Your aunt sincerely believes a false health tip is true and shares it to help the family.',
    },
    prompt: 'Using the Information Disorder framework, what is this an example of?',
    options: [
      'Disinformation, because the information is false',
      'Misinformation, because it is false but shared without intent to harm',
      'Malinformation, because it is true but shared to cause harm',
      'It is not information disorder because she meant well',
    ],
    source: {
      label: 'Information Disorder report (Council of Europe, 2017)',
      url: 'https://rm.coe.int/information-disorder-toward-an-interdisciplinary-framework-for-researc/168076277c',
    },
  },
  {
    id: 'mi-09',
    categoryId: 'misleading-information',
    difficulty: 'Intermediate',
    scenario: {
      account: 'GlowUp Skincare',
      handle: '@glowupskincare',
      meta: 'Sponsored ad',
      text: '"A remarkable product" — Brightvale Consumer Review',
      detail:
        'The full review says: "The packaging is a remarkable product of good design, but the cream itself caused irritation for most testers and we do not recommend it."',
    },
    prompt: 'What technique is the ad using?',
    options: [
      'Accurate quoting',
      'Selective quoting that removes the surrounding words and changes the meaning',
      'Citing an independent fact-check',
      'Using a satire label',
    ],
  },
  {
    id: 'mi-10',
    categoryId: 'misleading-information',
    difficulty: 'Beginner',
    scenario: {
      account: 'Brightvale Now',
      handle: 'brightvalenow.example',
      meta: 'Headline',
      text: 'Mayor BANS Motorcycles From the City!',
      detail: 'Article text: "Motorcycles will not be allowed on Plaza Street during the three-day town festival to make room for food stalls."',
    },
    prompt: 'How does the headline compare with the article?',
    options: [
      'It matches the article exactly',
      'It overgeneralizes a short, single-street closure into a citywide ban',
      'It understates the closure',
      'Headlines do not need to match articles',
    ],
  },
]
