/*
  Investigation Lab cases.

  IMPORTANT: Every case, person, account, outlet, and place here is a FICTIONAL training
  example created for VerifyIT. "Brightvale" is an invented city. Do not replace these
  with real people or organizations without verified sources.

  How to edit:
  - The expected assessment and its explanation are NOT stored here. They live only on the
    server (server/src/data/investigationVerdicts.js) and are revealed after a submission.
  - Each case has one evidence card for each area in `investigationAreas`.
  - `signal` controls the color of a revealed finding:
      'warning'  = a red flag
      'supports' = evidence that supports the claim
      'neutral'  = useful context that does not point either way
  - `post.image.src` points to an illustration in public/case-images/ (drawn for VerifyIT, not a real
    photo, and labeled "VerifyIT illustration"). `variant` is the fallback placeholder style.
  - `key: true` marks clues that matter most. Unopened key clues are shown
    as "clues you may have missed" after submission.
*/

export const assessmentOptions = [
  {
    id: 'supported',
    label: 'Supported by the available evidence',
    description: 'Reliable sources and evidence confirm the claim as presented.',
  },
  {
    id: 'misleading',
    label: 'Misleading or missing important context',
    description: 'The claim is false, distorted, or leaves out details that change its meaning.',
  },
  {
    id: 'insufficient',
    label: 'Not enough information to decide',
    description: 'There is not enough reliable evidence to confirm or rule out the claim.',
  },
]

export const investigationAreas = [
  { id: 'source', label: 'Original source', icon: 'link' },
  { id: 'author', label: 'Author credibility', icon: 'user' },
  { id: 'date', label: 'Publication date', icon: 'calendar' },
  { id: 'evidence', label: 'Supporting evidence', icon: 'file' },
  { id: 'independent', label: 'Independent sources', icon: 'layers' },
  { id: 'context', label: 'Missing context', icon: 'eye' },
  { id: 'image', label: 'Image manipulation or reuse', icon: 'image' },
  { id: 'headline', label: 'Headline vs. content', icon: 'newspaper' },
]

export const investigations = [
  {
    id: 'flood-photo',
    title: 'The "Happening Now" Flood Photo',
    summary: 'A dramatic flood photo spreads during a heavy rain advisory. Does it show what the caption claims?',
    difficulty: 'Beginner',
    topic: 'Image reuse',
    post: {
      type: 'social',
      accountName: 'Brightvale Weather Watch',
      handle: '@bv_weatherwatch',
      accountInfo: 'Joined 2 months ago · 12.4K followers',
      verified: false,
      date: 'Posted today · 2:14 PM',
      text: 'HAPPENING NOW: Brightvale Highway is completely underwater!! Cars are trapped. Share to warn everyone!!',
      image: {
        variant: 'flood',
        src: '/case-images/flood-photo.svg',
        alt: 'Photo of a highway flooded up to car windows, with road signs in the background.',
      },
      stats: { likes: '8.2K', comments: '940', shares: '3.1K' },
    },
    context:
      'The (fictional) Brightvale weather bureau issued a heavy rain advisory this morning. Some streets have reported minor flooding.',
    guidingQuestions: [
      'Does the photo actually show Brightvale today?',
      'Who first published this photo, and when?',
      'What are official agencies and local outlets saying about the highway?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'Where did the photo come from?',
        finding: 'The account does not say who took the photo. It appears to be copied from elsewhere without credit.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'author',
        question: 'Is this account a credible source for weather emergencies?',
        finding: 'The account is two months old, has no listed owner, and is not connected to any weather agency or news outlet.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'date',
        question: 'Is the photo from today?',
        finding: 'The post is from today, but the photo itself is much older (see the image check).',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'evidence',
        question: 'Is there evidence that the highway is underwater?',
        finding: 'Live traffic camera images on the city\'s official website show the highway wet but passable at 2:00 PM.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'independent',
        question: 'Are other reliable sources reporting this?',
        finding: 'Local outlets report minor street flooding in two neighborhoods but nothing about the highway being submerged.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'context',
        question: 'Is anything important being left out?',
        finding: 'There really is a rain advisory today, which makes the false caption feel believable. Real events often make reused photos more convincing.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'image',
        question: 'Has this image appeared before?',
        finding: 'A reverse image search finds the same photo in a news gallery from six years ago about a flood in a different country. Road signs in the photo are in another language.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'headline',
        question: 'Does the caption match the evidence?',
        finding: '"Completely underwater" and "cars are trapped" are not supported by any current evidence.',
        signal: 'warning',
        key: false,
      },
    ],
    steps: [
      'Run a reverse image search before sharing dramatic photos during emergencies.',
      'Check official agencies and live traffic or weather sources for current conditions.',
      'Look for clues inside the image, such as signs, language, and vehicles.',
      'Share official advisories instead of unverified photos.',
    ],
  },
  {
    id: 'coffee-study',
    title: 'The "Coffee Cures Memory Loss" Headline',
    summary: 'A health headline makes a big promise. Does the study behind it say the same thing?',
    difficulty: 'Intermediate',
    topic: 'Misleading headline',
    post: {
      type: 'article',
      accountName: 'HealthNow Daily',
      handle: 'healthnowdaily.example',
      accountInfo: 'Lifestyle and health website',
      verified: false,
      date: 'Published Oct 12',
      headline: 'Scientists PROVE Coffee Cures Memory Loss',
      text: 'New research shows that your morning cup of coffee could be the key to a sharper memory. Here\'s what the experts found...',
      image: {
        variant: 'coffee',
        src: '/case-images/coffee-study.svg',
        alt: 'Stock photo of a cup of coffee next to an open notebook.',
      },
      stats: { likes: '21K', comments: '1.2K', shares: '9.8K' },
    },
    context:
      'The article links to a (fictional) university press release about a study on caffeine and memory.',
    guidingQuestions: [
      'What did the original study actually test?',
      'Do the words "prove" and "cure" match the study\'s conclusions?',
      'Who was studied: people or animals?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'What is the original source of the claim?',
        finding: 'The article cites a university press release about a study published in a scientific journal.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'author',
        question: 'Who wrote the article?',
        finding: 'The article has no author name. The website mostly publishes lifestyle tips and sponsored product posts.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'date',
        question: 'Is the information current?',
        finding: 'Both the article and the study are recent.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'evidence',
        question: 'What did the study find?',
        finding: 'The study tested caffeine on 24 laboratory mice and found improved performance on one memory task. No humans were tested.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'independent',
        question: 'How do other sources describe the study?',
        finding: 'A science news outlet describes it as "early research in mice" and quotes an independent scientist saying human studies are needed.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'context',
        question: 'What important details are missing?',
        finding: 'The article never mentions that the study was done on mice, or that the researchers said it does not show a cure for anything.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'image',
        question: 'Is the image misleading?',
        finding: 'The image is a generic stock photo. It is not misleading, but it is not evidence either.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'headline',
        question: 'Does the headline match the content?',
        finding: '"PROVE" and "Cures Memory Loss" go far beyond a small mouse study on one memory task.',
        signal: 'warning',
        key: true,
      },
    ],
    steps: [
      'Find the original study or press release and read its conclusion.',
      'Check who or what was studied and how many participants were involved.',
      'Watch for words like "prove," "cure," and "miracle" in health headlines.',
      'See how science journalists and independent experts describe the research.',
    ],
  },
  {
    id: 'class-suspension',
    title: 'The Class Suspension Announcement',
    summary: 'A post says classes are suspended tomorrow because of a storm. Is it legitimate?',
    difficulty: 'Beginner',
    topic: 'Verifying official announcements',
    post: {
      type: 'social',
      accountName: 'Brightvale City Public Information Office',
      handle: '@brightvalecity_pio',
      accountInfo: 'Official government page · Joined 2014',
      verified: true,
      date: 'Posted today · 6:05 PM',
      text: 'ADVISORY: Classes at all levels, public and private, are suspended tomorrow, Oct. 20, due to Tropical Storm Kalinaw. Stay indoors and monitor official updates. Full advisory: brightvalecity.gov.example/advisories',
      image: {
        variant: 'advisory',
        src: '/case-images/class-suspension.svg',
        alt: 'Official advisory graphic with the city seal and the text "Class Suspension, Oct. 20".',
      },
      stats: { likes: '15K', comments: '2.3K', shares: '11K' },
    },
    context:
      'A (fictional) tropical storm is expected to pass near Brightvale tonight. Students are waiting for an announcement.',
    guidingQuestions: [
      'Is this the account that is responsible for making this announcement?',
      'Does the official website say the same thing?',
      'Are other reliable sources confirming it?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'Is this the original source of the announcement?',
        finding: 'Yes. The city public information office is responsible for announcing class suspensions, and this is its official page.',
        signal: 'supports',
        key: true,
      },
      {
        area: 'author',
        question: 'Is the account authentic?',
        finding: 'The page has been active since 2014, is linked from the city\'s official website, and has a long history of advisories.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'date',
        question: 'Is the announcement current?',
        finding: 'The post was published this evening and refers to tomorrow\'s date.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'evidence',
        question: 'Does the official website confirm it?',
        finding: 'The linked advisory page on the city\'s website shows the same suspension with an advisory number and the mayor\'s signature.',
        signal: 'supports',
        key: true,
      },
      {
        area: 'independent',
        question: 'Do independent sources report it?',
        finding: 'Two local radio stations and a local newspaper report the suspension and cite the city advisory.',
        signal: 'supports',
        key: true,
      },
      {
        area: 'context',
        question: 'Is any important context missing?',
        finding: 'The weather bureau\'s storm bulletin matches the timing of the suspension. Nothing important appears to be missing.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'image',
        question: 'Is the advisory graphic authentic?',
        finding: 'The graphic matches the style of previous official advisories, and the same graphic appears on the city website.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'headline',
        question: 'Does the post accurately summarize the advisory?',
        finding: 'Yes. The post matches the full advisory word for word.',
        signal: 'supports',
        key: false,
      },
    ],
    steps: [
      'Check that announcements come from the office responsible for them.',
      'Confirm on the official website, not just social media.',
      'Watch for fake pages that copy official names and logos.',
      'Share the official post directly rather than screenshots.',
    ],
  },
  {
    id: 'quote-card',
    title: 'The Councilor\'s Quote Card',
    summary: 'A graphic attributes a controversial quote to a local official. Can you confirm it?',
    difficulty: 'Intermediate',
    topic: 'Unverified quotes',
    post: {
      type: 'social',
      accountName: 'Voice of the Brightvale People',
      handle: '@voiceofbvpeople',
      accountInfo: 'Joined 5 weeks ago · 3.8K followers',
      verified: false,
      date: 'Posted yesterday · 9:40 PM',
      text: '"Students who can\'t afford tuition should just stop studying." – Councilor M. Dela Rosa. Do you agree?? Comment below!',
      image: {
        variant: 'quote',
        src: '/case-images/quote-card.svg',
        alt: 'Graphic with a portrait of a councilor and the quote in large letters.',
      },
      stats: { likes: '4.5K', comments: '3.6K', shares: '2.2K' },
    },
    context:
      'Councilor M. Dela Rosa is a (fictional) member of the Brightvale city council. The council debated an education budget last week.',
    guidingQuestions: [
      'When and where was this quote supposedly said?',
      'Is there a video, transcript, or news report of it?',
      'What has the councilor\'s office said?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'Where does the quote come from?',
        finding: 'The graphic gives no date, event, or link. The page did not respond to commenters asking for a source.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'author',
        question: 'Who runs this page?',
        finding: 'The page is five weeks old, lists no owners, and posts several politically charged graphics every day.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'date',
        question: 'When was the quote said?',
        finding: 'No date is given. It is unclear whether it refers to last week\'s budget debate or something else.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'evidence',
        question: 'Is there a recording or transcript?',
        finding: 'The official council session video is about four hours long. The part you were able to check does not contain the quote, but you have not reviewed the full recording.',
        signal: 'neutral',
        key: true,
      },
      {
        area: 'independent',
        question: 'Did reliable outlets report it?',
        finding: 'No local news outlets have reported this quote. One outlet says it has asked the councilor\'s office for comment.',
        signal: 'neutral',
        key: true,
      },
      {
        area: 'context',
        question: 'What context is missing?',
        finding: 'The councilor\'s office has not yet confirmed or denied the quote. There is no information about the setting in which it was supposedly said.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'image',
        question: 'Is the portrait real?',
        finding: 'The portrait matches the councilor\'s official photo. A real photo does not confirm the quote is real.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'headline',
        question: 'Does the framing push a reaction?',
        finding: 'The post asks "Do you agree??" to drive comments and outrage, which encourages engagement before verification.',
        signal: 'warning',
        key: false,
      },
    ],
    steps: [
      'Ask for the original source of any quote: when, where, and on what record.',
      'Search the official session recordings or transcripts.',
      'Check whether reliable outlets have contacted the person quoted.',
      'Wait for confirmation before sharing; "not enough information" is a valid answer.',
    ],
  },
  {
    id: 'mayor-video',
    title: 'The Mayor\'s "Leaked" Video',
    summary: 'A short video appears to show the mayor admitting to corruption. Is it authentic?',
    difficulty: 'Advanced',
    topic: 'Deepfake video',
    post: {
      type: 'social',
      accountName: 'Exposé Brightvale',
      handle: '@expose_bv',
      accountInfo: 'Joined 10 days ago · 900 followers',
      verified: false,
      date: 'Posted today · 11:20 AM',
      text: 'LEAKED VIDEO: Mayor Reyes ADMITS stealing flood relief funds!! Watch before they take it down!!',
      image: {
        variant: 'video',
        src: '/case-images/mayor-video.svg',
        alt: 'Still frame from a video showing a person resembling the mayor speaking at a podium.',
      },
      stats: { likes: '6.1K', comments: '2.8K', shares: '7.4K' },
    },
    context:
      'Mayor A. Reyes is the (fictional) mayor of Brightvale. The video is 22 seconds long with no information about where it was recorded.',
    guidingQuestions: [
      'Where was this video first published?',
      'Are there signs of manipulation in the video or audio?',
      'What do the mayor\'s office and reliable outlets say?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'Who first published the video?',
        finding: 'The earliest copy you can find is from this account. It does not explain who recorded it or where.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'author',
        question: 'Is the account credible?',
        finding: 'The account is ten days old and has only posted content attacking the mayor.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'date',
        question: 'When was the video recorded?',
        finding: 'There is no recording date. The background matches a city hall press room used for events last year.',
        signal: 'neutral',
        key: false,
      },
      {
        area: 'evidence',
        question: 'Is there any other evidence of the admission?',
        finding: 'There are no documents, audit reports, or official investigations connected to the claim.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'independent',
        question: 'What do reliable sources report?',
        finding: 'Local outlets report that the mayor\'s office called the video "fabricated" and found that the background matches a press conference from last year about flood preparation.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'context',
        question: 'What context is missing?',
        finding: 'The original press conference video, available on the city\'s official page, shows the mayor saying completely different words in the same setting.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'image',
        question: 'Are there signs of manipulation?',
        finding: 'Lip movements do not consistently match the audio, the voice has unusual pauses, and the edges of the face blur when the head turns.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'headline',
        question: 'Does the caption match the evidence?',
        finding: '"ADMITS" presents an unverified, likely manipulated clip as a confession.',
        signal: 'warning',
        key: false,
      },
    ],
    steps: [
      'Search for the original, longer version of any short "leaked" clip.',
      'Look and listen for mismatched lips, unnatural pauses, and blurring.',
      'Check official channels and reliable news outlets before reacting.',
      'Remember that a video looking real is not enough to prove it is authentic.',
    ],
  },
  {
    id: 'fuel-price',
    title: 'The Fuel Price Hike Article',
    summary: 'A real news article about fuel prices is going viral again. Is it still accurate?',
    difficulty: 'Beginner',
    topic: 'Outdated information',
    post: {
      type: 'article',
      accountName: 'Brightvale Herald',
      handle: 'brightvaleherald.example',
      accountInfo: 'Shared by @savings_tips_bv · Joined 2020',
      verified: false,
      date: 'Article dated March 3, three years ago · Shared today',
      headline: 'Fuel Prices to Rise by ₱8 per Liter Next Week',
      text: 'Shared caption: "GRABE! Fill up your tanks NOW before next week!!"',
      image: {
        variant: 'fuel',
        src: '/case-images/fuel-price.svg',
        alt: 'Photo of a fuel station price board.',
      },
      stats: { likes: '3.3K', comments: '610', shares: '5.9K' },
    },
    context:
      'The Brightvale Herald is a (fictional) established local newspaper. The article is being reshared by a savings tips page.',
    guidingQuestions: [
      'When was the article originally published?',
      'Is the outlet reliable, and does that make the post accurate today?',
      'What are current fuel price announcements saying?',
    ],
    evidence: [
      {
        area: 'source',
        question: 'Is the original article real?',
        finding: 'Yes. The article exists on the Herald\'s website and was accurate when it was published.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'author',
        question: 'Is the outlet credible?',
        finding: 'The Herald is an established newspaper with named reporters and a corrections policy.',
        signal: 'supports',
        key: false,
      },
      {
        area: 'date',
        question: 'When was it published?',
        finding: 'The article is dated March 3, three years ago. The person sharing it does not mention this.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'evidence',
        question: 'Is there current evidence of a price hike?',
        finding: 'This week\'s fuel price advisories from oil companies show a small decrease, not an increase.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'independent',
        question: 'Do other current sources report a hike?',
        finding: 'No current news reports describe an ₱8 increase next week.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'context',
        question: 'What context is missing?',
        finding: 'The share removes the article date, so "next week" now appears to mean the coming week instead of a week three years ago.',
        signal: 'warning',
        key: true,
      },
      {
        area: 'image',
        question: 'Is the photo current?',
        finding: 'The price board in the photo shows prices from three years ago.',
        signal: 'warning',
        key: false,
      },
      {
        area: 'headline',
        question: 'Does the caption match the article?',
        finding: 'The headline matched the article at the time, but the new caption presents it as current news.',
        signal: 'neutral',
        key: false,
      },
    ],
    steps: [
      'Always check the publication date, not just the date it was shared.',
      'Look for current reports before acting on time-sensitive news.',
      'Remember that a trusted outlet does not make every share of its content accurate.',
      'When sharing older articles, clearly mention their date.',
    ],
  },
]

export function getInvestigationById(id) {
  return investigations.find((item) => item.id === id)
}
