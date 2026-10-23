/*
  Lesson content for the Learn page.

  How to edit:
  - Each object in the `lessons` array is one lesson.
  - `icon` must match a key in ICONS inside src/components/LessonCard.jsx.
  - `relatedCategories` links a lesson to quiz categories (ids in src/data/quizCategories.js)
    so the Results page can suggest the right lesson.
  - Practical examples are FICTIONAL training scenarios. Keep them clearly labeled as such.
*/

export const lessons = [
  {
    id: 'what-is-misinformation',
    number: 1,
    title: 'What Is Misinformation?',
    description: 'Understand what misinformation is, why it spreads, and why anyone can be fooled by it.',
    readingTime: 4,
    difficulty: 'Beginner',
    icon: 'info',
    relatedCategories: ['misleading-information', 'fact-checking'],
    content: [
      {
        heading: 'A simple definition',
        paragraphs: [
          'Misinformation is false or misleading information that is shared, whether or not the person sharing it knows it is wrong. Many people who spread misinformation honestly believe they are helping by warning friends or passing along news.',
          'Misinformation does not always look like an obvious lie. It can be a real photo with the wrong caption, an accurate statistic taken out of context, an old story presented as new, or a joke that people mistake for fact.',
        ],
      },
      {
        heading: 'Why it spreads so easily',
        paragraphs: [
          'Social media rewards content that gets reactions. Posts that make us feel surprised, angry, afraid, or proud tend to be shared quickly, often before anyone checks whether they are true.',
        ],
        points: [
          'Speed: sharing takes one tap, while checking takes time.',
          'Emotion: strong feelings make us less likely to pause and question.',
          'Trust: we tend to believe content shared by friends and family.',
          'Repetition: seeing the same claim many times can make it feel familiar and therefore true.',
        ],
      },
      {
        heading: 'Why it matters',
        paragraphs: [
          'False information can affect real decisions about health, safety, money, and voting. It can damage reputations, increase fear during emergencies, and make it harder for communities to agree on basic facts.',
          'The goal of digital literacy is not to distrust everything. It is to build habits that help you decide what deserves your trust.',
        ],
      },
    ],
    example: {
      title: 'The "free load" message',
      scenario:
        'A message in a group chat says a telecom company is giving away free mobile load to anyone who forwards the message to 20 contacts. It includes a link and the company logo.',
      analysis: [
        'The message pushes urgency ("today only") and asks you to forward it before checking.',
        'The link does not lead to the company\'s official website.',
        'A quick look at the company\'s official page shows no such promotion.',
        'The person who forwarded it to you likely believed it. That is what makes it misinformation rather than a deliberate lie on their part.',
      ],
    },
    takeaways: [
      'Misinformation is false or misleading content, shared with or without the intent to deceive.',
      'It often uses real elements, such as genuine photos or logos, in misleading ways.',
      'Strong emotions and urgency are signals to slow down, not to share faster.',
    ],
    knowledgeCheck: [
      {
        id: 'l1-q1',
        question: 'Your aunt shares a false health tip because she sincerely believes it will help people. What is this an example of?',
        options: ['Misinformation', 'Satire', 'Verified news', 'Advertising'],
        answer: 0,
        explanation:
          'Misinformation includes false content shared without the intent to deceive. Your aunt believes the tip is true, but it is still false.',
      },
      {
        id: 'l1-q2',
        question: 'Which feature of a post should make you slow down before sharing?',
        options: [
          'It links to an official source you can open',
          'It urges you to share immediately and makes you feel alarmed',
          'It includes the date it was published',
          'It names the author and their organization',
        ],
        answer: 1,
        explanation: 'Urgency and strong emotional pressure are common in misinformation. They are cues to pause and check.',
      },
    ],
  },
  {
    id: 'misinformation-vs-disinformation',
    number: 2,
    title: 'Misinformation vs. Disinformation',
    description: 'Learn the difference between honest mistakes, deliberate deception, and harmful use of true information.',
    readingTime: 5,
    difficulty: 'Beginner',
    icon: 'scale',
    relatedCategories: ['misleading-information', 'source-credibility'],
    content: [
      {
        heading: 'Three related terms',
        paragraphs: [
          'Researchers often describe "information disorder" using three categories. The difference between them is mainly about intent and harm, not just whether something is true or false.',
        ],
        points: [
          'Misinformation: false information shared without intent to cause harm. Example: forwarding an outdated typhoon warning you believe is current.',
          'Disinformation: false information created or shared deliberately to deceive or cause harm. Example: a fake account inventing a scandal to damage a candidate.',
          'Malinformation: genuine information shared to cause harm. Example: leaking someone\'s private address to encourage harassment.',
        ],
      },
      {
        heading: 'How one claim can change category',
        paragraphs: [
          'A piece of disinformation can become misinformation as it travels. Someone may invent a false story on purpose (disinformation), and then thousands of people may share it because they believe it (misinformation).',
          'This is why calling every person who shares false content a "liar" is unhelpful. Most people can be corrected respectfully once they see better evidence.',
        ],
      },
      {
        heading: 'Common motives behind disinformation',
        points: [
          'Money: clickbait pages earn advertising revenue from traffic.',
          'Politics: influencing how people vote or view a group.',
          'Attention: going viral for followers or status.',
          'Disruption: creating confusion or distrust on purpose.',
        ],
      },
    ],
    example: {
      title: 'The invented quote',
      scenario:
        'A page with no clear owner posts a graphic showing a public official with a shocking quote. The page posts several similar graphics every day. A student shares it in a class group, upset by the quote.',
      analysis: [
        'If the page created the quote knowing it was false, the page is spreading disinformation.',
        'The student sharing it in good faith is spreading misinformation.',
        'The best response is to look for the original speech or interview and share the correction kindly.',
      ],
    },
    takeaways: [
      'Misinformation is false and shared without intent to deceive; disinformation is false and deliberate.',
      'Malinformation uses true information to cause harm.',
      'The same claim can move between categories as different people share it.',
    ],
    knowledgeCheck: [
      {
        id: 'l2-q1',
        question: 'A website knowingly publishes a fake news story to earn advertising money. Which term fits best?',
        options: ['Misinformation', 'Disinformation', 'Malinformation', 'Opinion'],
        answer: 1,
        explanation: 'The website knows the story is false and publishes it on purpose for profit. That is disinformation.',
      },
      {
        id: 'l2-q2',
        question: 'Someone posts a real screenshot of a classmate\'s private messages to embarrass them. Which term fits best?',
        options: ['Misinformation', 'Disinformation', 'Malinformation', 'Satire'],
        answer: 2,
        explanation: 'The messages are genuine, but they are shared to cause harm. That is malinformation.',
      },
    ],
  },
  {
    id: 'evaluating-online-sources',
    number: 3,
    title: 'Evaluating Online Sources',
    description: 'Practice lateral reading to quickly judge who is behind a website or account and whether to trust it.',
    readingTime: 6,
    difficulty: 'Intermediate',
    icon: 'globe',
    relatedCategories: ['source-credibility'],
    content: [
      {
        heading: 'Ask: who is behind this?',
        paragraphs: [
          'Before deciding whether to believe a claim, find out who is making it. A professional-looking website or a large follower count does not prove that a source is reliable.',
        ],
        points: [
          'Is there a named author or organization?',
          'What is their expertise or track record on this topic?',
          'Do they have a reason to persuade you, such as selling a product or promoting a cause?',
          'Do they correct their mistakes publicly?',
        ],
      },
      {
        heading: 'Read laterally, not just vertically',
        paragraphs: [
          'Reading "vertically" means staying on one page and judging it by how it looks. Professional fact-checkers usually do the opposite: they open new tabs and search for what other sources say about the website or author. This is called lateral reading.',
          'For example, search the website\'s name plus words like "fact check," "who owns," or "reliability." A few minutes of lateral reading can reveal that a "news site" is actually a satire page, a marketing site, or an anonymous network of copied content.',
        ],
      },
      {
        heading: 'Warning signs in a source',
        points: [
          'No "About" page, no contact details, or ownership is hidden.',
          'A web address that imitates a known outlet with a small spelling change.',
          'Accounts that were created very recently but post constantly.',
          'Mostly emotional or one-sided content with few links to evidence.',
        ],
      },
    ],
    example: {
      title: 'The look-alike news site',
      scenario:
        'An article about a sudden tuition increase appears on "brightvaIe-news.co". It uses a logo similar to a well-known local paper, but the second "l" in the name is actually a capital "I".',
      analysis: [
        'The address imitates a real outlet, a common disinformation tactic.',
        'Searching the site name in a new tab finds no information about who runs it.',
        'The real outlet and the school\'s official page have no story about a tuition increase.',
      ],
    },
    takeaways: [
      'Identify who is behind information before deciding whether to trust it.',
      'Lateral reading means leaving the page to see what others say about the source.',
      'Professional design and high follower counts are not evidence of reliability.',
    ],
    knowledgeCheck: [
      {
        id: 'l3-q1',
        question: 'What is lateral reading?',
        options: [
          'Reading an article slowly from top to bottom',
          'Opening new tabs to check what other sources say about a website or author',
          'Reading only the headline and the comments',
          'Checking whether a site has a modern design',
        ],
        answer: 1,
        explanation: 'Lateral reading means leaving the original page to investigate the source using other independent sources.',
      },
      {
        id: 'l3-q2',
        question: 'Which detail is the strongest warning sign about a news website?',
        options: [
          'It has an "About Us" page listing its editors',
          'It publishes corrections when it makes mistakes',
          'Its web address imitates a known outlet with a small spelling change',
          'It links to the reports it cites',
        ],
        answer: 2,
        explanation: 'Imitating a trusted brand is a deceptive tactic. The other options are signs of a more accountable source.',
      },
    ],
  },
  {
    id: 'misleading-headlines-clickbait',
    number: 4,
    title: 'Misleading Headlines and Clickbait',
    description: 'Spot headlines that exaggerate, distort, or hide what an article actually says.',
    readingTime: 4,
    difficulty: 'Beginner',
    icon: 'newspaper',
    relatedCategories: ['misleading-information'],
    content: [
      {
        heading: 'Headlines are not the whole story',
        paragraphs: [
          'Many people share articles after reading only the headline. Headlines are short by design, and some are written to attract clicks rather than to describe the story accurately.',
          'A misleading headline can be technically connected to the article but still leave you with the wrong impression.',
        ],
      },
      {
        heading: 'Common clickbait techniques',
        points: [
          'Curiosity gaps: "You won\'t believe what happened next."',
          'Exaggeration: "proves," "destroys," "miracle," or "shocking" when the article is much more cautious.',
          'Questions that imply an answer: "Is your phone secretly recording you?"',
          'Turning a possibility into a certainty: an article says something "may" happen, and the headline says it "will."',
        ],
      },
      {
        heading: 'How to check a headline',
        points: [
          'Read the full article before reacting or sharing.',
          'Compare the headline with the first few paragraphs and the conclusion.',
          'Look for the original study, report, or quote the article is based on.',
          'Check how other reliable outlets described the same story.',
        ],
      },
    ],
    example: {
      title: '"Scientists confirm chocolate makes you smarter"',
      scenario:
        'A viral headline claims scientists confirmed that chocolate makes people smarter. The article itself describes a small study that found a possible link between cocoa and short-term attention in a group of adults.',
      analysis: [
        'The study found a possible link, not proof of cause and effect.',
        '"Makes you smarter" is far broader than "short-term attention."',
        'A small study is a starting point for more research, not a final answer.',
      ],
    },
    takeaways: [
      'Always read beyond the headline before sharing.',
      'Watch for exaggerated words that the article itself does not support.',
      'Compare the headline with the original source of the claim.',
    ],
    knowledgeCheck: [
      {
        id: 'l4-q1',
        question: 'An article says a new policy "could possibly" raise prices, but the headline says "Prices WILL Skyrocket." What is the problem?',
        options: [
          'Nothing, headlines are always shortened',
          'The headline turns a possibility into a certainty',
          'The article should not mention prices',
          'The headline is too short',
        ],
        answer: 1,
        explanation: 'The headline makes a stronger claim than the article supports. This is a common misleading-headline technique.',
      },
      {
        id: 'l4-q2',
        question: 'What is the best first step before sharing an article with a surprising headline?',
        options: ['Read the full article', 'Check how many likes it has', 'Share it with a warning', 'Read the comments only'],
        answer: 0,
        explanation: 'Reading the full article shows whether the headline accurately represents the content.',
      },
    ],
  },
  {
    id: 'manipulated-images-context',
    number: 5,
    title: 'Manipulated Images and Missing Context',
    description: 'Learn how real photos are edited, cropped, or reused to tell a false story, and how to trace them.',
    readingTime: 6,
    difficulty: 'Intermediate',
    icon: 'image',
    relatedCategories: ['image-manipulation', 'ai-generated-images'],
    content: [
      {
        heading: 'Images can mislead without being fake',
        paragraphs: [
          'Photos feel like proof, which makes them powerful tools for misinformation. Often the image itself is real, but the caption, date, or location attached to it is wrong.',
        ],
        points: [
          'Reused images: an old photo is shared as if it shows a current event.',
          'Wrong location: a photo from one country is claimed to show another.',
          'Cropping: removing part of an image changes its meaning.',
          'Editing: objects or people are added, removed, or altered.',
        ],
      },
      {
        heading: 'Missing context',
        paragraphs: [
          'Missing context happens when information is technically accurate but leaves out details that would change how you understand it. A short video clip might cut out what happened before and after. A chart might start its axis at an unusual number to exaggerate a change.',
          'Ask: what is not being shown, and would it change my conclusion?',
        ],
      },
      {
        heading: 'How to trace an image',
        points: [
          'Use a reverse image search tool to find earlier copies of the image.',
          'Look at the oldest result you can find; it is often closest to the original.',
          'Check for clues in the image itself: signs, weather, language, vehicles, or landmarks.',
          'Compare the caption with the original context you find.',
        ],
      },
    ],
    example: {
      title: 'The "today\'s flood" photo',
      scenario:
        'During heavy rain, an account posts a dramatic photo of a flooded highway with the caption "Happening NOW in our city!"',
      analysis: [
        'A reverse image search finds the same photo in a news gallery published years earlier.',
        'Road signs in the photo are in a different language from the city\'s.',
        'The flooding may be real today, but this photo does not show it. Sharing it spreads a false picture of the situation.',
      ],
    },
    takeaways: [
      'A real photo with a false caption is still misinformation.',
      'Reverse image search helps you find where and when an image first appeared.',
      'Ask what is missing from a photo, clip, or chart before drawing conclusions.',
    ],
    knowledgeCheck: [
      {
        id: 'l5-q1',
        question: 'A photo from a protest five years ago is shared as if it happened yesterday. What kind of problem is this?',
        options: ['Deepfake', 'Reused image with false context', 'Satire', 'Accurate reporting'],
        answer: 1,
        explanation: 'The photo is genuine, but the time context is false. This is one of the most common forms of image misinformation.',
      },
      {
        id: 'l5-q2',
        question: 'Which tool is most useful for finding where an image appeared before?',
        options: ['A spell checker', 'A reverse image search', 'A word counter', 'A screen recorder'],
        answer: 1,
        explanation: 'Reverse image search finds other places the same or similar image has been published, often revealing its origin.',
      },
    ],
  },
  {
    id: 'ai-generated-content-deepfakes',
    number: 6,
    title: 'AI-Generated Content and Deepfakes',
    description: 'Understand how AI can create convincing fake images, audio, video, and text, and how to respond.',
    readingTime: 6,
    difficulty: 'Advanced',
    icon: 'bot',
    relatedCategories: ['deepfakes', 'ai-generated-images'],
    content: [
      {
        heading: 'What AI can generate',
        paragraphs: [
          'Generative AI tools can create realistic images, voices, videos, and articles from short text instructions. A deepfake is synthetic media that makes it look or sound like a real person said or did something they did not.',
          'These tools have legitimate creative and educational uses. The problem arises when AI content is presented as real to deceive people.',
        ],
      },
      {
        heading: 'Possible signs of AI-generated media',
        paragraphs: [
          'AI tools are improving quickly, so visual flaws are becoming less common. Treat these as clues worth investigating, not as proof either way.',
        ],
        points: [
          'Unnatural details: distorted hands, jewelry, text, or backgrounds.',
          'Lip movements that do not quite match the audio.',
          'Lighting or shadows that are inconsistent.',
          'Voices with unusual pacing, tone, or breathing.',
          'Text that sounds fluent but contains vague or invented facts.',
        ],
      },
      {
        heading: 'Focus on the source, not just the pixels',
        paragraphs: [
          'Because AI content can look flawless, the most reliable check is often the context: Who first posted it? Did reliable outlets report the event? Did the person shown confirm or deny it on their official channels?',
          'If a shocking video of a public figure appears only on unknown accounts and nowhere else, that absence is an important clue.',
        ],
      },
    ],
    example: {
      title: 'The voice message from the "principal"',
      scenario:
        'Parents receive a voice message that sounds like the school principal announcing that classes are cancelled for a week and asking them to pay a "re-enrollment fee" through a link.',
      analysis: [
        'The request for payment through an unofficial link is a major warning sign.',
        'The school\'s official page and verified accounts have no announcement.',
        'Calling the school office directly confirms the message is fake. The voice may have been cloned using AI.',
      ],
    },
    takeaways: [
      'Deepfakes make it appear that real people said or did things they did not.',
      'Visual flaws are clues, but their absence does not prove content is real.',
      'Verify through the source, official channels, and independent reporting.',
    ],
    knowledgeCheck: [
      {
        id: 'l6-q1',
        question: 'A video looks completely realistic. Does that prove it is not AI-generated?',
        options: [
          'Yes, AI videos always have visible flaws',
          'No, realistic quality alone does not prove a video is authentic',
          'Yes, if it has many views',
          'Yes, if it was shared by a friend',
        ],
        answer: 1,
        explanation: 'AI tools can produce convincing media. Check the source and look for confirmation from reliable channels.',
      },
      {
        id: 'l6-q2',
        question: 'What is the most reliable way to check a suspicious video of a public figure?',
        options: [
          'Count the likes and comments',
          'Check the person\'s official channels and reliable news coverage',
          'Watch it several more times',
          'Ask the account that posted it',
        ],
        answer: 1,
        explanation: 'Official statements and independent reporting are stronger evidence than the video\'s appearance alone.',
      },
    ],
  },
  {
    id: 'checking-evidence-sources',
    number: 7,
    title: 'Checking Evidence and Original Sources',
    description: 'Trace claims back to their origin and judge whether the evidence actually supports them.',
    readingTime: 5,
    difficulty: 'Intermediate',
    icon: 'search',
    relatedCategories: ['fact-checking', 'source-credibility'],
    content: [
      {
        heading: 'Go upstream',
        paragraphs: [
          'Many posts summarize something that was said or published elsewhere. Each time information is retold, details can be lost or changed. Tracing a claim "upstream" to the original report, study, document, or video lets you see what was really said.',
        ],
        points: [
          'Look for links, names of reports, or the names of the people quoted.',
          'Search for the original document on the official website of the organization involved.',
          'Compare the original with the post. What was added, removed, or changed?',
        ],
      },
      {
        heading: 'Not all evidence is equal',
        points: [
          'Stronger: official records, original documents, full videos, peer-reviewed research, and reporting from multiple independent outlets.',
          'Weaker: screenshots without a source, anonymous claims, single testimonials, and "a friend of a friend said."',
          'Be careful with numbers: ask where they came from, what they measure, and what they are compared to.',
        ],
      },
      {
        heading: 'Find better coverage',
        paragraphs: [
          'If a claim is important and true, several independent and reliable sources will usually report it. If you cannot find any, that does not automatically mean it is false, but it does mean you do not have enough evidence to share it as fact.',
          'Fact-checking organizations can help, but read their explanation and evidence instead of relying only on a "true" or "false" label.',
        ],
      },
    ],
    example: {
      title: 'The screenshot of a "new law"',
      scenario:
        'A screenshot claims that a new city ordinance will fine people for posting complaints about public services. It has no link and no ordinance number.',
      analysis: [
        'Searching the city council\'s official website for recent ordinances finds nothing matching the claim.',
        'The screenshot\'s formatting does not match official city documents.',
        'Without an original source, the screenshot is not reliable evidence.',
      ],
    },
    takeaways: [
      'Trace claims back to the original source whenever possible.',
      'Prefer original documents and multiple independent sources over screenshots and anonymous claims.',
      'If you cannot find good evidence, you do not have enough information to share the claim as fact.',
    ],
    knowledgeCheck: [
      {
        id: 'l7-q1',
        question: 'Which is the strongest evidence that a government announcement is real?',
        options: [
          'A screenshot posted by an anonymous account',
          'The announcement on the government agency\'s official website',
          'A video reacting to the announcement',
          'Many comments agreeing with it',
        ],
        answer: 1,
        explanation: 'The official source of the announcement is the strongest evidence. Screenshots and reactions can be edited or wrong.',
      },
      {
        id: 'l7-q2',
        question: 'You cannot find any reliable source reporting a surprising claim. What is the best conclusion?',
        options: [
          'It is definitely false',
          'It is definitely true but being hidden',
          'There is not enough evidence to share it as fact',
          'Share it so others can check',
        ],
        answer: 2,
        explanation: 'A lack of evidence means you cannot confirm the claim. Hold off on sharing until better information is available.',
      },
    ],
  },
  {
    id: 'responsible-sharing',
    number: 8,
    title: 'Responsible Sharing and Digital Citizenship',
    description: 'Build habits for sharing thoughtfully and correcting misinformation without conflict.',
    readingTime: 4,
    difficulty: 'Beginner',
    icon: 'share',
    relatedCategories: ['fact-checking', 'misleading-information'],
    content: [
      {
        heading: 'You are part of the information system',
        paragraphs: [
          'Every share, like, and comment helps decide what other people see. Responsible digital citizens treat sharing as a small act of publishing: they think about accuracy and impact before they post.',
        ],
      },
      {
        heading: 'A pause-before-sharing routine',
        points: [
          'Stop: notice how the content makes you feel. Strong emotions are a cue to slow down.',
          'Check: who posted it, when, and what evidence supports it?',
          'Consider: could sharing this harm someone or cause panic if it is wrong?',
          'Decide: if you are unsure, do not share it, or share it clearly labeled as unverified with a request for sources.',
        ],
      },
      {
        heading: 'Correcting others respectfully',
        paragraphs: [
          'When friends or family share misinformation, a calm and private message often works better than a public argument. Focus on the evidence, not on the person.',
        ],
        points: [
          'Start with empathy: "I almost shared this too."',
          'Share a reliable source that explains the facts.',
          'Avoid repeating the false claim in a way that spreads it further.',
          'If you shared something false, correct it publicly. That builds trust.',
        ],
      },
    ],
    example: {
      title: 'Correcting a family group chat',
      scenario:
        'A relative shares a post claiming that drinking hot water every hour prevents a viral illness. Several family members react with hearts.',
      analysis: [
        'Rather than calling the post "stupid," send a kind message acknowledging the relative\'s good intentions.',
        'Share guidance from a health authority\'s official website about how the illness is actually prevented.',
        'Keep the focus on keeping the family safe, which is everyone\'s shared goal.',
      ],
    },
    takeaways: [
      'Treat every share as a small act of publishing.',
      'When unsure, pause. Not sharing is a responsible choice.',
      'Correct misinformation kindly, privately when possible, and with reliable evidence.',
    ],
    knowledgeCheck: [
      {
        id: 'l8-q1',
        question: 'You are not sure whether an alarming post is true. What is the most responsible action?',
        options: [
          'Share it just in case',
          'Pause and check before sharing, or do not share it',
          'Share it and delete it later if it is false',
          'Add a comment saying "is this true?" and share it',
        ],
        answer: 1,
        explanation: 'If you cannot verify a claim, pausing or not sharing prevents you from spreading possible misinformation.',
      },
      {
        id: 'l8-q2',
        question: 'Which approach is most likely to help a friend reconsider a false post?',
        options: [
          'Mocking the post publicly',
          'A respectful private message with a reliable source',
          'Reporting your friend to everyone in the group',
          'Ignoring every false post forever',
        ],
        answer: 1,
        explanation: 'Respectful, evidence-based conversations are more likely to change minds than public criticism.',
      },
    ],
  },
]

export function getLessonById(id) {
  return lessons.find((lesson) => lesson.id === id)
}
