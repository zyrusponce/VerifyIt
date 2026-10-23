/*
  SERVER-ONLY quiz answer keys. Never import this file from the frontend (src/).

  Keyed by question id. Each entry holds the index of the correct option (in the original,
  unshuffled option order defined in src/data/quizzes/) and the explanation shown after answering.
  The question text and options themselves stay in src/data/quizzes/ so both sides share one copy.

  After editing, run `npm run catalog:seed --prefix server` and apply the regenerated
  catalog migration so the database answer keys match.
*/

export const quizAnswerKeys = {
  // aiGeneratedImages.js: every image is a real file from Wikimedia Commons (public domain or CC0).
  // Option orders: pairs [A is AI, B is AI, both AI, both real]; singles [AI-generated, real photograph].
  'aii-11': {
    answer: 0,
    explanation:
      'Image A was made with the FLUX.1 [schnell] AI image generator. Look at its clues: the quills are unusually uniform and plastic-looking, the face is bright white and glossy, the claws look pink and polished, and the shape behind the log does not turn into any real object. Image B is a real photograph of a European hedgehog: it is messy and imperfect, with grass caught in its spines and uneven natural light. These clues helped here, but newer generators make fewer mistakes, so appearance alone is never proof. The strongest check is provenance: both files\' original pages (linked below) state exactly how each image was made.',
    credits: [
      {
        label: 'Image A: "Cute Hedgehog", generated with FLUX.1 [schnell] (prompted by Emdosis), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Cute_Hedgehog.jpg',
      },
      {
        label: 'Image B: European hedgehog photographed by formicacid (2014), Wikimedia Commons / iNaturalist, CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Erinaceus_europaeus_-_formicacid_-_44557473.jpg',
      },
    ],
  },
  'aii-12': {
    answer: 1,
    explanation:
      'Image B was generated with Google\'s Imagen 4.0 model, loosely based on Yosemite Valley. Its clearest clue is the small "ai" label in the lower-right corner, so always check the corners for labels and watermarks. The scene is also too ideal: golden light falls evenly on everything, a cozy cabin sits in the perfect spot, and the boulders are neatly arranged along the river. Image A is a real 2004 photograph of meadows in Yosemite Valley with Half Dome in the distance. Remember that labels can be cropped out, so compare suspicious images with other photos of the same place.',
    credits: [
      {
        label: 'Image A: "Yosemite meadows", photographed by Jon Sullivan (2004), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Yosemite_meadows_2004-09-04.jpg',
      },
      {
        label: 'Image B: "Illuminated Valley in the Afternoon", generated with Google Imagen 4.0 (by VulcanSphere, 2025), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Illuminated_Valley_in_the_Afternoon_(Imagen_4.0).webp',
      },
    ],
  },
  'aii-13': {
    answer: 0,
    explanation:
      'Image A was generated with Midjourney (version 6). If this one was hard, that is the lesson: a simple, well-lit object is exactly what modern generators do best. The only hints are subtle: dreamy, painting-like studio light, speckles spread almost perfectly evenly, and a skin with no bruises or scratches. Image B is a real 2014 photo of a Granny Smith apple, and it also looks clean and "stock-like." When two images are this close, looking harder will not settle it. Finding where each image came from will.',
    credits: [
      {
        label: 'Image A: "Green apple gen", generated with Midjourney v6 (prompted by The masketta man, 2024), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Green_apple_gen.png',
      },
      {
        label: 'Image B: Granny Smith apple photographed by Grzegorznadolski (2014), Wikimedia Commons, CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Jab%C5%82ko_granny_smith.jpg',
      },
    ],
  },
  'aii-14': {
    answer: 3,
    explanation:
      'Both are real photographs. Image A shows a lenticular cloud (altocumulus lenticularis), a lens-shaped cloud that forms when air flows over mountains. It is so often mistaken for a flying saucer that the photographer, Giuseppe Donatiello, captioned it "A flying saucer? No, it\'s only a lenticular cloud." Image B is a real 2006 photo of a green apple on a branch after rain. Strange or beautiful does not mean fake, and wrongly calling a real image "AI" spreads misinformation too.',
    credits: [
      {
        label: 'Image A: lenticular clouds photographed by Giuseppe Donatiello (2016), Wikimedia Commons, CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Lenticular_clouds_(Altocumulus_lenticularis)_(30368465690).jpg',
      },
      {
        label: 'Image B: "Green apple", photographed by Faustas L. (2006), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Green_apple.jpg',
      },
    ],
  },
  'aii-15': {
    answer: 2,
    explanation:
      'Both images are AI-generated: Image A was made with ChatGPT and Image B with an AI tool accessed through Poe.com. Neither has an obvious mistake. At most, the polka dots on the gift are almost too evenly spaced, and some chrysanthemum petals have smudged, painted-looking brown tips. That is the uncomfortable truth about AI images: many have no visible error at all. When you cannot find clues, do not guess. Look for the original upload and how its creator describes it.',
    credits: [
      {
        label: 'Image A: "Badly wrapped gift", generated with ChatGPT (2025), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Badly_wrapped_gift.jpg',
      },
      {
        label: 'Image B: "Memorial Wreath", generated with an AI tool via Poe.com (2025), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Memorial_Wreath.jpg',
      },
    ],
  },
  'aii-16': {
    answer: 0,
    explanation:
      'This image was generated with Grok, the AI tool from xAI, and its watermark is still visible in the lower-right corner. Other clues: the writing on the sweatshirt and the text in the open books do not form real words, and the book spines are blurry blocks with no readable titles. Real library photos are full of readable signs, labels, and titles. Before believing a "school event" photo, also check whether the school itself posted it.',
    credits: [
      {
        label: '"Image of a Library by Grok", generated with Grok (2025), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Image_of_a_Library_by_Grok.jpg',
      },
    ],
  },
  'aii-17': {
    answer: 0,
    explanation:
      'This image was generated with Microsoft Copilot. It has almost no visual errors: the hands look normal and the sign is neatly lettered, because newer generators handle text much better. The strongest clues come from the context. AI pictures of veterans, elderly people, or children holding signs that ask for likes or birthday wishes are a common kind of engagement bait. They come with an emotional appeal, no name, no place, and no original source. Before liking or sharing, look for who first posted it.',
    credits: [
      {
        label: '"AI-generated veteran birthday sign image", generated with Microsoft Copilot (2024), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:AI-generated_veteran_birthday_sign_image.png',
      },
    ],
  },
  'aii-18': {
    answer: 0,
    explanation:
      'This image was generated with DALL·E 3. Count the boy\'s arms: one is raised high, and two more are clapping in front of him. That is three arms. Extra or merged limbs and fingers are a classic AI mistake, along with skin that looks airbrushed and pencils that blend into each other. Newer tools make this kind of error less often, so a missing mistake does not prove an image is real.',
    credits: [
      {
        label: '"The boy with three arms", generated with DALL·E 3 (2024), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:The_boy_with_three_arms.png',
      },
    ],
  },
  'aii-19': {
    answer: 0,
    explanation:
      'This image was generated with Leonardo AI. It packs famous symbols into one impossible view: a red lattice tower resembling the one in central Tokyo stands right in front of Mount Fuji at the end of a small village lane, with tulips and blossoms all at their peak. Look closer and the roof ornaments twist into shapes no real roof has, and windows and railings melt into repeating patterns. A quick search for the "village" would turn up no such place.',
    credits: [
      {
        label: '"Japanese buildings and Turkish tulips", generated with Leonardo AI (2024), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Japanese_buildings_and_Turkish_tulips.jpg',
      },
    ],
  },
  'aii-20': {
    answer: 1,
    explanation:
      'This is a real photograph by the U.S. Fish and Wildlife Service in Alaska. According to the agency, a curious fox came in for a closer look at the photographer. Real details are everywhere: individual whiskers, uneven fluffy fur, wet stones, and natural blur where the lens could not focus. A sharp, dramatic, "too good" photo is not evidence of AI. Skilled photographers take amazing pictures, and here the source can be verified.',
    credits: [
      {
        label: '"Red Fox", photographed by the U.S. Fish and Wildlife Service, Alaska Region (2016), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Red_Fox_(28735336466).jpg',
      },
    ],
  },
  // deepfakes.js: every image is a real public-domain file from Wikimedia Commons.
  // Option orders: pairs [A is AI, B is AI, both AI, both real]; singles [AI-generated, real photograph].
  'df-11': {
    answer: 0,
    explanation:
      'This person does not exist. The face was generated by StyleGAN2, the same kind of AI behind sites that show a new fake face on every visit. Look at the edges, where these images usually fail: a stray strand of hair sticks straight up from the top of her head, there are shapeless pink blobs in the bottom corners, and she wears an earring on one ear only. Fake accounts often use faces like this so that a reverse image search finds nothing. A friendly face is not proof that a real person is behind an account.',
    credits: [
      {
        label: '"This Person Does Not Exist example", generated with StyleGAN2, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:This_Person_Does_Not_Exist_example.jpg',
      },
    ],
  },
  'df-12': {
    answer: 0,
    explanation:
      'Image A is a person who does not exist, generated with StyleGAN. Its clues: the earphone wire fades away into nothing, a rainbow-colored smudge sits beside his left shoulder, and the blurred background contains no recognizable objects. Image B is a real 1998 NASA portrait of astronaut John Glenn, the first American to orbit Earth, taken before he returned to space at age 77. Real people leave a trail you can check, such as official pages, news reports, and other photos. A synthetic face has none.',
    credits: [
      {
        label: 'Image A: "Man 2", generated with StyleGAN (by Owlsmcgee, 2019), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Man_2.jpg',
      },
      {
        label: 'Image B: NASA portrait of astronaut John Glenn by Robert Markowitz and Mark Sowa (1998), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Astronaut_U.S._Senator_John_Glenn_-_GPN-2000-001175.jpg',
      },
    ],
  },
  'df-13': {
    answer: 2,
    explanation:
      'Neither of these people exists: both faces were generated with StyleGAN. The clues are small. The young woman\'s clothing turns into a smeared, meaningless pattern, and there is a tiny rainbow-colored glitch in the boy\'s hair at the top right. Notice also how both faces are perfectly centered, with the eyes in almost the same spot, a common trait of these generated headshots. Fake accounts are sometimes created in batches, so several "new members" with flawless headshots and no history deserve extra caution.',
    credits: [
      {
        label: 'Image A: "Woman 1", generated with StyleGAN (by Owlsmcgee, 2019), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Woman_1.jpg',
      },
      {
        label: 'Image B: "Boy 1", generated with StyleGAN (by Owlsmcgee, 2019), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Boy_1.jpg',
      },
    ],
  },
  'df-14': {
    answer: 1,
    explanation:
      'Image B is AI-generated. Lincoln died in 1865, and smartphones appeared about 140 years later, so this is an anachronism: something that could not exist at that time. The style is wrong too. It looks like a sharp, modern color photo with a softly blurred background, while photos from the 1860s were black-and-white or sepia, as in Image A. Image A is a real portrait taken by Alexander Gardner in his Washington studio on 9 August 1863. When a "historical photo" shows something that did not exist yet, check the date and look for the original in a museum or library archive.',
    credits: [
      {
        label: 'Image A: Abraham Lincoln photographed by Alexander Gardner (9 August 1863), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_O-74_by_A_Gardner,_1863.jpg',
      },
      {
        label: 'Image B: "Abraham Lincoln using a smartphone (anachronism)", AI-generated (by Dennis Sylvester Hurd, 2023), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_using_a_smartphone_(anachronism).jpg',
      },
    ],
  },
  'df-15': {
    answer: 0,
    explanation:
      'Image A is an AI-made copy of the real postcard in Image B, recreated with Google Gemini. Compare them closely. The AI took the postcard\'s catalog number "1216" from the caption and painted it onto the front of the locomotive, where no number can be seen on the original. The tiny printed credit in the bottom-right corner, blurry on the original, became sharp-looking gibberish ("Bootnrysmt. Yannelteuzz..."), and a small sparkle logo appears beside it. The colors and sharpness are also far beyond what a printed postcard from 1900 could show. AI "restorations" can quietly invent details, so compare them with the archived original.',
    credits: [
      {
        label: 'Image A: "Gare-Batz-Locomotive-1900", AI recreation made with Google Gemini (2026), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Gare-Batz-Locomotive-1900_(g%C3%A9n%C3%A9r%C3%A9_par_IA_G%C3%A9mini).png',
      },
      {
        label: 'Image B: postcard of Batz station around 1900 (phototypie Vasseurs), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Gare-Batz-Locomotive-1900.jpg',
      },
    ],
  },
  'df-16': {
    answer: 0,
    explanation:
      'This image was generated with an AI model (GPT Image). The first clue is logic: no photograph can show prehistoric people, because cameras were invented thousands of years later. The image also looks like a movie scene, with golden "cinematic" lighting, neatly carpentered wooden pegs on the wheel, and stitched sandals. Look at the cave painting in the top-right corner too: the handprints have six fingers, a classic AI mistake. Calling an image a "rare photo" does not make it a photo.',
    credits: [
      {
        label: '"AI-generated image of a caveman presenting the invention of the wheel", generated with GPT Image (2026), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:AI-generated_image_of_a_caveman_presenting_the_invention_of_the_wheel,_showing_6-fingered_handprints_on_the_cave_painting.png',
      },
    ],
  },
  'df-17': {
    answer: 0,
    explanation:
      'This face was generated with StyleGAN2; the person does not exist. Its clues: the background is a blur with an object on the right that never turns into anything recognizable, and the two sides of the shirt collar do not match. Fake reviews often pair glowing praise with a friendly AI face, because a stolen photo could be traced back with a reverse image search. Judge reviews by details you can verify, not by the face next to them.',
    credits: [
      {
        label: '"GAN Mensch StyleGAN2", generated with StyleGAN2 (2019), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:GAN_Mensch_StyleGAN2.png',
      },
    ],
  },
  'df-18': {
    answer: 1,
    explanation:
      'This is a real photograph: NASA\'s official portrait of Sally Ride, taken in June 1984. Ride became the first American woman in space in 1983. A polished, professional portrait is not a sign of AI. Official portraits are carefully lit on purpose. What makes this one easy to verify is its source: the same image is published in NASA\'s archive, and Ride\'s life is documented in countless reliable records.',
    credits: [
      {
        label: 'NASA portrait of astronaut Sally Ride (June 1984), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Sally_Ride,_First_U.S._Woman_in_Space_-_GPN-2004-00019.jpg',
      },
    ],
  },
  'df-19': {
    answer: 1,
    explanation:
      'This is a real photograph from October 1895. An express train arriving at Montparnasse station in Paris could not stop in time, crossed the station, and burst through its front wall onto the square below. It looks impossible, which is exactly why real images like this get called "fake." The scene was photographed and reported at the time, and the photo has been archived for more than a century. Unbelievable is not the same as AI-generated.',
    credits: [
      {
        label: 'Train wreck at Montparnasse station, Paris (October 1895), photograph credited to Levy & fils, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Train_wreck_at_Montparnasse_1895.jpg',
      },
    ],
  },
  'df-20': {
    answer: 1,
    explanation:
      'This is a real photograph from around 1918, published by the Keystone View Company. It shows the Wawona Tree, a giant sequoia in Yosemite\'s Mariposa Grove. A tunnel was cut through it in 1881 so visitors could drive or ride through, and the tree stood until it fell in 1969. Old photos that look absurd are sometimes real, and you can confirm them by finding the same scene in other archived photos and historical records.',
    credits: [
      {
        label: '"The Wawona tree, Mariposa Grove, Yosemite" (Keystone View Co., about 1918), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Wawona.jpg',
      },
    ],
  },
  // factChecking.js
  'fc-01': {
    answer: 1,
    explanation:
      'A single secondhand story cannot show that a remedy works for everyone. The fever may have gone down for other reasons. Health claims need stronger evidence from reliable health authorities.',
  },
  'fc-02': {
    answer: 1,
    explanation:
      'The claim comes from the responsible official source, links to a full advisory, and is confirmed by independent outlets. Healthy skepticism also means recognizing when evidence is strong.',
  },
  'fc-03': {
    answer: 1,
    explanation:
      'Cross-checking means looking for independent confirmation. A real nationwide rule would be announced by the responsible agency and covered by several outlets. If only one unknown site reports it, treat it as unverified.',
  },
  'fc-04': {
    answer: 1,
    explanation:
      'Attributing a claim to an authority does not make it true; anyone can put a name on a graphic. Trace the claim to the original source. If the department never published it, the attribution is false.',
  },
  'fc-05': {
    answer: 1,
    explanation:
      'A factual claim can be shown true or false with evidence, such as records of when a bridge opened. Opinions and value judgments, like "most beautiful" or "boring," can be discussed but not fact-checked in the same way.',
  },
  'fc-06': {
    answer: 0,
    explanation:
      'Fact Check Explorer searches fact-checks published by fact-checking organizations. If a viral claim has been checked already, you can read the evidence they found. Not every claim will be covered, so you may still need to check it yourself.',
  },
  'fc-07': {
    answer: 1,
    explanation:
      'This confuses correlation with causation. A third factor, warm weather, increases both ice cream sales and swimming. Before accepting that one thing causes another, look for other explanations.',
  },
  'fc-08': {
    answer: 1,
    explanation:
      'The words "clinically shown" can hide a weak study. Very small samples, short durations, and funding from the seller all reduce how much a result can tell you. Look for larger, independent research.',
  },
  'fc-09': {
    answer: 1,
    explanation:
      'Quotes are often misattributed to famous people to make an idea sound more authoritative. A real quote can be traced to a book, speech, letter, or interview. Here, the timeline alone shows the attribution is impossible.',
  },
  'fc-10': {
    answer: 2,
    explanation:
      'Strong evidence comes from multiple independent, accountable sources that can be checked. Shares measure popularity, not accuracy, and anonymous or secondhand claims are the weakest kind of evidence.',
  },
  // imageManipulation.js
  'im-01': {
    answer: 1,
    explanation:
      'The image is genuine but comes from a different event. This does not prove there is no flood today, but it does mean this photo cannot be used as evidence of one.',
  },
  'im-02': {
    answer: 0,
    explanation:
      'A tightly cropped photo combined with a misleading caption changed the meaning. Looking for the wider or original version of an image often reveals the full picture.',
  },
  'im-03': {
    answer: 1,
    explanation:
      'Nothing in the cropped photo was invented, but cutting out the empty space changed what it seems to show. Cropping is one of the simplest and most common ways to mislead with an authentic image.',
  },
  'im-04': {
    answer: 1,
    explanation:
      'The clip is real, but it removes the moments before and after that explain the officer\'s action. Missing context can make genuine footage tell a false story.',
  },
  'im-05': {
    answer: 1,
    explanation:
      'Reverse image search tools like TinEye or Google Lens find other copies of an image. Sorting or scanning for the earliest copies often leads you to the original photographer, date, and location.',
  },
  'im-06': {
    answer: 1,
    explanation:
      'Reverse image search is powerful but incomplete. An older copy may exist in a private group or on a site the tool has not indexed. A matching date is supportive, not conclusive, so look for other evidence that places the photo in time and location.',
  },
  'im-07': {
    answer: 1,
    explanation:
      'Finding each part of the image in a different earlier photo is strong evidence of a composite. Dramatic disaster images are often edited this way because people share them quickly during emergencies.',
  },
  'im-08': {
    answer: 1,
    explanation:
      'Much visual misinformation uses real photos with false captions. The image is genuine; the story told about it is not. Always ask whether the caption matches what the image actually shows.',
  },
  'im-09': {
    answer: 0,
    explanation:
      'Details inside an image, such as language on signs, which side cars drive on, architecture, and landmarks, can confirm or contradict a claimed location. Here they point to a different place, so the photo should not be used as evidence of a local accident.',
  },
  'im-10': {
    answer: 1,
    explanation:
      'When editing tools are used to reshape a body, nearby straight lines in the background often warp too. Warped backgrounds are a common clue in edited body images, especially in ads making extreme claims.',
  },
  // misleadingInformation.js
  'mi-01': {
    answer: 1,
    explanation:
      'The article describes a small survey that found a slight association and mentions other possible explanations. "Proves" and "make students fail" exaggerate what the research found.',
  },
  'mi-02': {
    answer: 1,
    explanation:
      'The headline asks a frightening question and withholds the answer to make you click. Headlines that promise a "shocking" answer often deliver much less than they suggest.',
  },
  'mi-03': {
    answer: 1,
    explanation:
      'The article may have been accurate when it was published, but presenting it as "breaking" news today is misleading. Always check the publication date.',
  },
  'mi-04': {
    answer: 1,
    explanation:
      'Vague phrases like "experts agree" or "studies show" sound authoritative but give you nothing to check. A trustworthy claim names its source so you can verify it. Words like "cures" and "permanently" are also red flags for exaggeration.',
  },
  'mi-05': {
    answer: 1,
    explanation:
      'Going from 2 to 4 is technically a 100% increase, so the number is accurate. But presenting it without the actual counts, plus "No one is safe!", makes a small change sound alarming. Always ask: a percentage of what?',
  },
  'mi-06': {
    answer: 0,
    explanation:
      'Satire is not meant to deceive its original audience, but once it is screenshotted and forwarded without the source, people can mistake it for real news. Checking where a story originally came from helps you spot this.',
  },
  'mi-07': {
    answer: 1,
    explanation:
      'Posts designed to make you angry or afraid push you to share before you think. Notice that the post makes no specific, checkable claim at all. Strong emotions are a signal to pause.',
  },
  'mi-08': {
    answer: 1,
    explanation:
      'In the framework by Wardle and Derakhshan, misinformation is false information shared without intent to cause harm, while disinformation is false information created or shared deliberately to deceive or harm. Good intentions do not make false information true, so it still needs correcting.',
  },
  'mi-09': {
    answer: 1,
    explanation:
      'The ad quotes three words that are technically in the review, but the full sentence and review say the opposite about the product. Cherry-picking quotes is a common way to mislead while appearing to cite a source.',
  },
  'mi-10': {
    answer: 1,
    explanation:
      'The article describes a temporary closure on one street. The headline leaves out the time limit and location, making it sound like a permanent citywide ban. Many people share headlines without reading the article, so this kind of exaggeration spreads easily.',
  },
  // sourceCredibility.js
  'sc-01': {
    answer: 1,
    explanation:
      'A new account with no clear owner is not a reliable source for an official decision. Follower counts can be bought, and "share before it gets deleted" is a pressure tactic. Official announcements should appear on the responsible office\'s verified channels.',
  },
  'sc-02': {
    answer: 2,
    explanation:
      'The source sells the product it is promoting, which is a conflict of interest. A title like "Dr." does not prove expertise in this topic, and the claim is not backed by any evidence you can check.',
  },
  'sc-03': {
    answer: 1,
    explanation:
      'Copying a trusted outlet\'s name and logo on a slightly different web address is a common tactic. Always check the exact URL, and compare with the outlet\'s homepage or official social accounts.',
  },
  'sc-04': {
    answer: 2,
    explanation:
      'This is called lateral reading: leaving the site to see what independent sources say about it. A site can describe itself however it likes, and professional design is cheap. Fact-checkers rely on what others say about a source.',
  },
  'sc-05': {
    answer: 0,
    explanation:
      'Popularity in one area does not create expertise in another. For medical advice, check whether the author has relevant qualifications and whether their claims are supported by reliable health authorities. Never stop prescribed medicine based on social media posts; talk to a health professional.',
  },
  'sc-06': {
    answer: 1,
    explanation:
      'Summaries can misquote, exaggerate, or leave out important details. Tracing the claim to the original report lets you see exactly what it says. If the original cannot be found, treat the claim as unverified.',
  },
  'sc-07': {
    answer: 2,
    explanation:
      'Transparency about who runs a site and a visible corrections policy show that a publisher takes responsibility for accuracy. Every outlet makes mistakes; credible ones admit and fix them.',
  },
  'sc-08': {
    answer: 1,
    explanation:
      'What a checkmark means depends on the platform, and on many platforms badges can be bought. Even a genuinely verified account can share mistakes. Check class suspensions with the official education or local government channels.',
  },
  'sc-09': {
    answer: 1,
    explanation:
      'Independent confirmation means separate sources checked the facts themselves. When outlets copy each other, a claim can seem widely reported while still resting on one unverified source. Trace claims back to where they started.',
  },
  'sc-10': {
    answer: 1,
    explanation:
      'Sponsored content is advertising designed to look like an article. It may be published on a real news site, but the sponsor pays for it and usually shapes the message. Look for independent sources before trusting its claims.',
  },
}
