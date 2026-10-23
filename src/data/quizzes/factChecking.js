/*
  Fact-Checking and Evidence Verification quiz. See src/data/quizzes/aiGeneratedImages.js for the question format.
  All posts, accounts, and places in `scenario` are FICTIONAL training examples.
*/

const FACT_CHECK_EXPLORER = { label: 'Google Fact Check Explorer', url: 'https://toolbox.google.com/factcheck/explorer' }

export const factCheckingQuestions = [
  {
    id: 'fc-01',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    scenario: {
      account: 'Healthy Juan',
      handle: '@healthyjuan',
      meta: 'Posted today · Text',
      text: 'My cousin\'s neighbor drank calamansi juice and her fever disappeared in an hour. It works for everyone!',
    },
    prompt: 'How strong is the evidence in this post?',
    options: [
      'Strong, because it is a personal experience',
      'Weak, because it is a single secondhand story generalized to everyone',
      'Strong, because calamansi is natural',
      'Strong, because many people liked it',
    ],
  },
  {
    id: 'fc-02',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    scenario: {
      account: 'Brightvale City Government',
      handle: '@brightvalecity',
      meta: 'Verified official account · Posted today',
      text: 'Road repairs on Mabini Street will close two lanes from Oct. 21 to Oct. 25. Full advisory and detour map on our official website.',
      detail: 'Two local news outlets report the same closure and link to the city\'s advisory.',
    },
    prompt: 'How should you assess this post?',
    options: [
      'Misleading, because all government posts are biased',
      'Supported by the available evidence',
      'Not enough information to decide',
      'Misleading, because it includes dates',
    ],
  },
  {
    id: 'fc-03',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    scenario: {
      account: 'Brightvale Insider',
      handle: 'bvinsider.example',
      meta: 'Article',
      text: 'New law requires all students to wear blue shoes starting next month.',
      detail: 'You cannot find this story anywhere else.',
    },
    prompt: 'What is the best next step?',
    options: [
      'Believe it, since it is in an article',
      'Search whether reliable, independent outlets or the education department report the same thing',
      'Share it and ask friends if it is true',
      'Buy blue shoes just in case',
    ],
  },
  {
    id: 'fc-04',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    scenario: {
      account: 'Health Tips Everyday',
      handle: '@healthtipseveryday',
      meta: 'Posted today · Graphic',
      text: 'The Department of Health says eating garlic every morning prevents all infections.',
      detail: 'The graphic has no link, date, or document name.',
    },
    prompt: 'How can you check whether the department really said this?',
    options: [
      'Trust it, because it names a government department',
      'Look for the statement on the department\'s official website or verified accounts',
      'Ask the page that posted it',
      'Check whether the graphic looks official',
    ],
  },
  {
    id: 'fc-05',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    prompt: 'Which of these is a factual claim that can be checked with evidence?',
    options: [
      'Brightvale has the most beautiful bridge in the country',
      'The Brightvale bridge opened to traffic in 2015',
      'Everyone should love the Brightvale bridge',
      'The Brightvale bridge is boring',
    ],
  },
  {
    id: 'fc-06',
    categoryId: 'fact-checking',
    difficulty: 'Beginner',
    prompt: 'A claim has been going viral for weeks. What is a quick way to see if professional fact-checkers have already investigated it?',
    options: [
      'Search for it with a fact-check search tool such as Google Fact Check Explorer',
      'Count how many times it has been shared',
      'Wait for it to stop trending',
      'Ask the person who posted it',
    ],
    source: FACT_CHECK_EXPLORER,
  },
  {
    id: 'fc-07',
    categoryId: 'fact-checking',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Data Says It All',
      handle: '@datasaysitall',
      meta: 'Posted today · Chart (fictional data)',
      text: 'In months when ice cream sales rise, swimming accidents also rise. Ice cream causes swimming accidents!',
    },
    prompt: 'What is wrong with this conclusion?',
    options: [
      'Nothing; the chart proves it',
      'Two things rising together does not show that one causes the other; hot weather could explain both',
      'Ice cream sales are not real data',
      'Swimming accidents never change',
    ],
  },
  {
    id: 'fc-08',
    categoryId: 'fact-checking',
    difficulty: 'Intermediate',
    scenario: {
      account: 'Brain Boost Supplements',
      handle: '@brainboostsupps',
      meta: 'Sponsored ad',
      text: 'Clinically shown to improve memory by 40%!',
      detail: 'The fine print says the "clinical study" tested 12 people for one week and was paid for by the company.',
    },
    prompt: 'How should you weigh this evidence?',
    options: [
      'As strong evidence, because it was a clinical study',
      'As weak evidence: a tiny, short, company-funded study needs independent confirmation',
      'As proof the product works for everyone',
      'As irrelevant, because all studies are useless',
    ],
  },
  {
    id: 'fc-09',
    categoryId: 'fact-checking',
    difficulty: 'Advanced',
    scenario: {
      account: 'Inspire Daily Quotes',
      handle: '@inspiredailyquotes',
      meta: 'Posted today · Quote card',
      text: '"Never trust anything you read on the internet." — attributed to a national hero who died before the internet existed',
    },
    prompt: 'What is the best way to check a quote like this?',
    options: [
      'Trust it if it sounds like something the person would say',
      'Look for it in the person\'s published writings, speeches, or reliable collections; if there is no original source, treat it as unverified',
      'Check how many people shared the quote card',
      'Assume all quotes are accurate',
    ],
  },
  {
    id: 'fc-10',
    categoryId: 'fact-checking',
    difficulty: 'Intermediate',
    prompt: 'Which of these is the STRONGEST evidence that a local event really happened?',
    options: [
      'A viral post with 50,000 shares',
      'A screenshot of a message from an anonymous account',
      'Several independent news outlets with on-the-ground reporting, plus an official statement',
      'A comment that says "I heard this from a friend"',
    ],
  },
]
