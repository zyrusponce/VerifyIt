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
  // deepfakes.js: every clip is a real video from Wikimedia Commons (public domain, CC0, CC BY, or CC BY-SA),
  // trimmed and converted to MP4. Option orders: pairs [A is fake, B is fake, both fake, both real];
  // singles [real footage, deepfake, fully AI-generated].
  'df-21': {
    answer: 2,
    explanation:
      'Both clips are AI-generated: Will Smith never filmed either one. Video A is the famous "Will Smith eating spaghetti" clip, posted to Reddit in March 2023 and made with an early text-to-video AI. Its clues are hard to miss: the face changes from shot to shot, hands and pasta melt into each other, and faint "shutterstock" watermarks appear, copied from the stock videos the AI learned from. Video B was posted on X in May 2025 and made with Google\'s Veo 3. The face stays steady and the fork behaves, so the obvious clues are gone. In about two years the mistakes nearly disappeared, which is why the most reliable check is where a clip came from: does it appear on the person\'s own accounts or in reliable news coverage?',
    credits: [
      {
        label: 'Video A: "Will Smith Eating Spaghetti" (AI-generated), posted by chaindrop on Reddit, March 2023, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Will_Smith_Eating_Spaghetti_Original.webm',
      },
      {
        label: 'Video B: "Will Smith eating spaghetti", made with Google Veo 3, posted by Javi Lopez on X, May 2025, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Will_Smith_eating_spaghetti_Google_Veo_3.webm',
      },
    ],
  },
  'df-22': {
    answer: 1,
    explanation:
      'This is a deepfake. It comes from "Dictators", a September 2020 advertising campaign by the US nonprofit RepresentUs, which used AI to give a filmed speaker Kim Jong-un\'s face in order to warn Americans about threats to their election. The original ad ends with a card that says "This footage is not real, but the threat is"; we cut that ending so you could judge the clip yourself. A deepfake is designed to look real, so check the context instead: North Korea\'s leader is lecturing Americans about their voting districts and polling places, no official or news source carries the speech, and searching for its words leads straight to the RepresentUs campaign.',
    credits: [
      {
        label: '"Dictators: Kim Jong-Un", RepresentUs (2020), Wikimedia Commons, CC BY 3.0. Excerpt: ending card removed and converted to MP4 for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Dictators_-_Kim_Jong-Un_by_RepresentUs.webm',
      },
      {
        label: 'Learn more about deepfakes: WITNESS, "Synthetic media and deepfakes" (linked by the original video)',
        url: 'https://lab.witness.org/projects/synthetic-media-and-deep-fakes/',
      },
    ],
  },
  'df-23': {
    answer: 0,
    explanation:
      'This is real footage: Vladimir Putin\'s New Year address of 31 December 2000, published by the Russian Presidential Press and Information Office. The low resolution and grainy colours are not signs of a fake; this is simply what TV video from 2000 looked like. AI and deepfake clips today are often the opposite, sharp and polished. The reliable check is the source: this address was released by the Kremlin\'s own press office and is kept with its original details on Wikimedia Commons.',
    credits: [
      {
        label: 'Vladimir Putin\'s New Year address, 31 December 2000, Presidential Press and Information Office of Russia, Wikimedia Commons, CC BY 4.0. Excerpt, converted to MP4 for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Vladimir_Putin_2000_New_Year_Address_to_the_Nation.webm',
      },
    ],
  },
  'df-24': {
    answer: 1,
    explanation:
      'This is a deepfake from the same September 2020 RepresentUs campaign as the Kim Jong-un clip in this quiz. The original ad ends with cards reading "Democracy lives or dies with you" and "This footage is not real, but the threat is"; we cut them before you watched. The picture is sharp and professional, which is exactly why quality is not proof. The context gives it away: a Russian president recording a message to American voters about their own election is very unlikely, and it appears on no official Kremlin channel and in no news report. Compare it with the grainy New Year address in this quiz: the low-quality clip was real and the polished one is fake.',
    credits: [
      {
        label: '"Dictators: Vladimir Putin", RepresentUs (2020), Wikimedia Commons, CC BY 3.0. Excerpt: ending cards removed and converted to MP4 for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Vladimir_Putin_warning_Americans_on_election_interference_and_increasing_political_divide.webm',
      },
    ],
  },
  'df-25': {
    answer: 0,
    explanation:
      'Video A was generated by OpenAI\'s Sora and published in February 2024 as one of its first demo videos. Nothing in it was filmed: it was made from a written prompt that begins "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage", and it matches the rest of that description detail for detail, from the black leather jacket and long red dress to the sunglasses, red lipstick, and damp, reflective street. Video B is real: Shibuya Crossing in Tokyo, filmed on 7 June 2019 by Basile Morin. Neither clip has an obvious mistake, which is the lesson: when a beautiful clip is shared as "right now", look for who filmed it, when, and where.',
    credits: [
      {
        label: 'Video A: "Tokyo Walk", generated by OpenAI Sora (2024), Wikimedia Commons, public domain. Excerpt',
        url: 'https://commons.wikimedia.org/wiki/File:OpenAI_Sora_in_Action-_Tokyo_Walk.webm',
      },
      {
        label: 'Video B: Shibuya Crossing, Tokyo, filmed by Basile Morin (2019), Wikimedia Commons, CC BY-SA 4.0. Excerpt, converted to MP4 for this quiz and shared under the same license',
        url: 'https://commons.wikimedia.org/wiki/File:Shibuya_Crossing,_Tokyo,_Japan_(video).webm',
      },
    ],
  },
  'df-26': {
    answer: 1,
    explanation:
      'Video B was generated by OpenAI\'s Sora (a 2024 demo), even though it was asked to show the real Glenfinnan Viaduct. It gets the details wrong: it adds a second track beside the train, but the real viaduct carries a single line; the locomotive has an extra chimney; and the windows of the fourth carriage are distorted. Video A is real: the Jacobite steam train crossing the viaduct, filmed in 2013 by Kathir Vel. When AI recreates a famous real place, compare it with real photos of that place; invented details often stand out.',
    credits: [
      {
        label: 'Video A: The Jacobite steam train on the Glenfinnan Viaduct, filmed by Kathir Vel (2013), Wikimedia Commons, CC BY 3.0. Excerpt, converted to MP4 for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Harry_Potter%27s_Hogwarts_Express_(The_Jacobite_Steam_Train)_on_the_Glenfinnan_Viaduct_(Bridge).webm',
      },
      {
        label: 'Video B: "Photoreal train", generated by OpenAI Sora (2024), Wikimedia Commons, public domain. Its file page lists the errors described above',
        url: 'https://commons.wikimedia.org/wiki/File:Photoreal-train.webm',
      },
    ],
  },
  'df-27': {
    answer: 2,
    explanation:
      'This clip is fully AI-generated with OpenAI\'s Sora. Its creator uploaded it to Wikimedia Commons as an example of fake body-camera footage, and says they are the person shown and agreed to its publication. Two clues are visible: the "Sora" watermark that moves around the frame, and the on-screen clock, which counts 21:14:27, 21:14:28, 21:14:30 and then jumps back to 21:14:20. A real body camera\'s clock never runs backwards. Watermarks can be cropped or blurred out, so for "leaked" footage, check whether a police department or a reliable news outlet actually released it.',
    credits: [
      {
        label: 'Example of Sora AI-generated police body camera footage (2025), uploaded by its creator, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Example_of_Sora_AI-Generated_Police_Body_Camera_Footage.webm',
      },
    ],
  },
  'df-28': {
    answer: 2,
    explanation:
      'This clip is fully AI-generated. It was made with Google\'s Veo 3 in the Gemini app in August 2025 and uploaded to Wikimedia Commons with its prompt, which begins "A grey-haired young adult man in a cosy cafe, sipping a steaming cup of coffee". The AI did not even follow the prompt exactly: the uploader describes the result as a middle-aged man. The clue you can see is the small "Veo" watermark in the bottom-right corner; Google also embeds an invisible watermark, SynthID, in Veo videos. Stock-video sites do sell AI clips, so check how a clip is labelled and where it came from rather than trusting how calm and natural it looks.',
    credits: [
      {
        label: '"Grey Haired Man in a Cosy Cafe", generated with Google Veo 3 by VulcanSphere (2025), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Grey_Haired_Man_in_a_Cosy_Cafe_(Veo_3).webm',
      },
    ],
  },
  'df-29': {
    answer: 1,
    explanation:
      'Video B was generated by OpenAI\'s Sora, one of its February 2024 demo videos. Its prompt asked for "an adorable dalmation" looking through a ground-floor window in Burano, Italy. Watch what the dog does next: it climbs out and walks along the window ledges across the front of the house, the kind of movement a real dog would be very unlikely to make. Odd movement and physics are among the most useful clues in AI video. Video A is real: a toy poodle and a Chihuahua puppy playing, filmed by Nesnad near Tokyo in January 2020.',
    credits: [
      {
        label: 'Video A: Puppies playing, filmed by Nesnad near Tokyo (2020), Wikimedia Commons, CC BY 4.0. Excerpt, converted to MP4 for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Puppiesplaying-tokyoarea-jan7-2020.webm',
      },
      {
        label: 'Video B: "Italian Pup", generated by OpenAI Sora (2024), Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Open_AI_Sora_in_Action-_Italian_Pup.webm',
      },
    ],
  },
  'df-30': {
    answer: 3,
    explanation:
      'Both clips are real. Video A shows two burrowing owls, called "shoco" in Aruba, filmed in Santa Cruz, Aruba, in 2018 by Ginelly.Q. Video B shows a Goldendoodle puppy and a black Labrador puppy filmed by Tim Sweet in 2013, years before AI video generators existed; it was recorded at 60 frames per second and played back slower, which is why it looks so smooth. Smoothness, beauty, or cuteness is not evidence of AI. Assuming everything is fake is also a mistake, because it lets people wave away real evidence. Check the source before deciding either way.',
    credits: [
      {
        label: 'Video A: Burrowing owls (shoco) in Santa Cruz, Aruba, filmed by Ginelly.Q (2018), Wikimedia Commons, CC0. Excerpt',
        url: 'https://commons.wikimedia.org/wiki/File:Shoco_of_Aruba_(Athene_cunicularia_arubensis).webm',
      },
      {
        label: 'Video B: Goldendoodle and Black Lab puppies in slow motion, filmed by Tim Sweet (2013), Wikimedia Commons, CC BY-SA 3.0. Excerpt, converted to MP4 for this quiz and shared under the same license',
        url: 'https://commons.wikimedia.org/wiki/File:Goldendoodle_and_Black_Lab_puppies_playing_in_slow_motion.webm',
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
  // imageManipulation.js: every image is a real file from Wikimedia Commons (public domain, CC BY, or CC BY-SA).
  // Option orders: pairs [A edited, B edited, both edited, neither edited]; singles are listed per question.
  'im-11': {
    answer: 0,
    explanation:
      'Image A was edited. Image B is the original April 1937 photo: Vyacheslav Molotov is on the left, Stalin in the middle, and Nikolai Yezhov, head of the Soviet secret police, on the right. Yezhov fell from power and was executed in 1940, and he was then erased from this photo: in Image A he has been replaced by more water and railing, and the faces and background were brightened. Removing people who fell out of favour was common Soviet propaganda. The clue is the empty space where a person once stood. The proof is finding the original: comparing the two versions makes the edit obvious.',
    credits: [
      {
        label: 'Image A: the edited version with Nikolai Yezhov removed, 1937, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Stalin_and_Molotov_along_the_Volga%E2%80%93Don_Canal,_Nikolai_Yezhov_removed.jpg',
      },
      {
        label: 'Image B: the original photo of Molotov, Stalin, and Yezhov, April 1937, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Nikolai_Yezhov_with_Stalin_and_Molotov_along_the_Volga%E2%80%93Don_Canal,_original.jpg',
      },
    ],
  },
  'im-12': {
    answer: 1,
    explanation:
      'Image B was edited. Image A is the original photo from 26 May 1939: King George VI, Queen Elizabeth, and Prime Minister Mackenzie King on the terrace of the Banff Springs Hotel in Canada. In Image B the King has been removed. The archive record for this photo states that it is "the same image... except that King George VI has been deleted". Look at the trees and the mountain: the background lines up exactly, which shows both versions came from one photo. Photos were edited long before computers; a missing person is just as misleading as an added one.',
    credits: [
      {
        label: 'Image A: King George VI, Queen Elizabeth, and W. L. Mackenzie King at Banff, 1939, National Film Board of Canada, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:GeorgeVIBanffSprings.jpg',
      },
      {
        label: 'Image B: the same photo with King George VI deleted, National Film Board of Canada, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:QueenMotherandWLMK.jpg',
      },
    ],
  },
  'im-13': {
    answer: 1,
    explanation:
      'Someone was removed. In the original photo from about 1902, the four grand duchesses Olga, Tatiana, Maria, and Anastasia sit on a bench with their nanny, Margaretta Eagar, standing behind them. In this version her upper body was retouched away, but the editor left part of her long skirt: look below the bench, behind the youngest girl\'s legs, where a large piece of grey fabric belongs to no one. Edits often leave leftovers like this, such as a stray shadow, an extra hand, or clothing with no person. The original, with the nanny, is linked below.',
    credits: [
      {
        label: 'The retouched version, with the nanny removed, C. E. de Hahn & Co., Tsarskoye Selo, about 1902, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:OTMA_without_their_nanny_Margaretta_Eagar.jpg',
      },
      {
        label: 'The original, with their nanny Margaretta Eagar, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:OTMA_with_their_nanny_Margaretta_Eagar.jpg',
      },
    ],
  },
  'im-14': {
    answer: 1,
    explanation:
      'Image B was edited. Image A is the original photo, taken on 19 April 2024. Look just above the left side of the museum\'s roof: Image A shows a tall residential tower in the distance, the Torre de Manila condominium, which became controversial because it appears behind the Rizal Monument in photos. In Image B the tower has been digitally erased, leaving only sky, and the photo was also slightly cropped. The photographer labelled the edit openly on Wikimedia Commons, but once a picture is copied without that label, an edited view can easily pass as the real one.',
    credits: [
      {
        label: 'Image A: National Museum of Fine Arts, Manila, photographed by PhiliptheNumber1 (2024), Wikimedia Commons, CC BY 4.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:National_Museum_of_Fine_Arts_(Manila,_2024).jpg',
      },
      {
        label: 'Image B: the same photo, digitally altered to remove Torre de Manila, by PhiliptheNumber1 (2024), Wikimedia Commons, CC BY 4.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:National_Museum_of_Fine_Arts_(Manila,_2024)_(digitally_altered_to_remove_Torre_de_Manila).jpg',
      },
    ],
  },
  'im-15': {
    answer: 1,
    explanation:
      'It is a composite. Lincoln was assassinated in 1865 before an impressive standing portrait of him existed, so a printmaker took Lincoln\'s head from a photograph by Mathew Brady and placed it on an 1852 engraving of the Southern politician John C. Calhoun. Even the papers on the table were changed: in Calhoun\'s portrait they read "Strict Construction", "Free Trade", and "The Sovereignty of the States"; here they read "Constitution", "Union", and "Proclamation of Freedom". The side-by-side comparison is linked below. A trusted, famous image can still be a manipulation.',
    credits: [
      {
        label: 'Composite portrait of Abraham Lincoln, published by Rudolf Lesch, New York, 1860s, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Manipulated_portrait_of_Abraham_Lincoln_(1860%27s).jpg',
      },
      {
        label: 'Side-by-side comparison with the 1852 engraving of John C. Calhoun, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:1852_Calhoun_-_Lincoln_-_photo_manipulation.jpg',
      },
    ],
  },
  'im-16': {
    answer: 1,
    explanation:
      'It is a composite, made more than a century before AI image generators. The Library of Congress holds this "Kirksville tornado" photo, and comparing it with a real tornado photo taken in Waynoka, Oklahoma, on 17 May 1898 shows that the same tornado was pasted onto a different landscape. Fake disaster photos are nearly as old as photography. The method that exposed this one works today too: search for the same image, or the same distinctive shape, appearing elsewhere with an earlier date.',
    credits: [
      {
        label: '1899 fake tornado photo claimed to show Kirksville, Missouri, Library of Congress, Wikimedia Commons, public domain',
        url: 'https://commons.wikimedia.org/wiki/File:1899_Kirksville,_Missouri_fake_tornado_photo.png',
      },
    ],
  },
  'im-17': {
    answer: 0,
    explanation:
      'Image A was edited. Image B is the real harbour in Sogndal, Norway, photographed in July 2016, with its large wooden quay building. Image A is a composite by the same photographer, made to show how the harbour could look without that building: the building was removed, and a sandy beach with sunbathers taken from a photo of a beach in Barcelona was added. The photographer labelled it clearly as a "photo composite" on Wikimedia Commons. An honest illustration like this becomes misinformation when it is shared without its label, for example as "Sogndal\'s new beach".',
    credits: [
      {
        label: 'Image A: photo composite of Dampskipskaien, Sogndal, without the quay building, by Bjørn Erik Pedersen, Wikimedia Commons, CC BY 4.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Fotomanipulasjon,_dampskipskaien_i_Sogndal_utan_kaibygg.jpg',
      },
      {
        label: 'Image B: Dampskipskaien in Sogndal, 2016, by Bjørn Erik Pedersen, Wikimedia Commons, CC BY 4.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Dampskipskaien_i_Sogndal_2016.jpg',
      },
    ],
  },
  'im-18': {
    answer: 2,
    explanation:
      'A real, unedited photo only proves that a flood happened somewhere, at some time. This photo was taken in October 2009, after Typhoon Ondoy (Ketsana) flooded large parts of Luzon, and was published by AusAID, Australia\'s aid agency. It shows nothing about "right now". Old disaster photos are reused all the time because they look convincing and spread quickly. Before sharing, run a reverse image search: if the same photo appears years earlier, the post is misleading even though the photo itself is genuine.',
    credits: [
      {
        label: 'Flooding from Typhoon Ondoy (Ketsana), Philippines, 2009, photo: AusAID (Australian Department of Foreign Affairs and Trade), Wikimedia Commons, CC BY 2.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Flooding_from_Typhoon_Ondoy_(Ketsana),_Philippines_2009._Photo-_AusAID_(10695910543).jpg',
      },
    ],
  },
  'im-19': {
    answer: 2,
    explanation:
      'It is a real photo used out of context. Dave Harlow of the US Geological Survey took it on 12 June 1991, showing the eruption column of Mount Pinatubo from Clark Air Base, days before Pinatubo\'s huge eruption of 15 June. It shows a different volcano, more than 30 years earlier. Nothing in the picture was edited, which is why this kind of misinformation is so effective. During a real emergency, rely on official sources such as PHIVOLCS (the Philippine Institute of Volcanology and Seismology) instead of dramatic photos from unknown accounts.',
    credits: [
      {
        label: 'Mount Pinatubo eruption column, 12 June 1991, photo by Dave Harlow, US Geological Survey, Wikimedia Commons, public domain. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Pinatubo_1991-06-12_(USGS).jpg',
      },
      {
        label: 'PHIVOLCS: official volcano bulletins in the Philippines',
        url: 'https://www.phivolcs.dost.gov.ph',
      },
    ],
  },
  'im-20': {
    answer: 3,
    explanation:
      'Neither photo was edited, and here the caption is accurate. Both are documented photos of the aftermath of Typhoon Ondoy (Ketsana) in 2009: Image A was published by AusAID, Australia\'s aid agency, and Image B comes from a set of photos posted on 27 September 2009, the day after the storm. Their sources match the caption\'s event and date. Checking is not only for catching fakes; it also lets you share real information with confidence. Calling every dramatic photo "fake" is a mistake too.',
    credits: [
      {
        label: 'Image A: Flooding from Typhoon Ondoy (Ketsana), Philippines, 2009, photo: AusAID (Australian Department of Foreign Affairs and Trade), Wikimedia Commons, CC BY 2.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Flooding_from_Typhoon_Ondoy_(Ketsana),_Philippines_2009._Photo-_AusAID_(10695725136).jpg',
      },
      {
        label: 'Image B: Ondoy aftermath, 27 September 2009, from Dan Saavedra via The Philippine Online Chronicles, Wikimedia Commons, CC BY 2.0. Resized for this quiz',
        url: 'https://commons.wikimedia.org/wiki/File:Ondoy_(3967857165).jpg',
      },
    ],
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
