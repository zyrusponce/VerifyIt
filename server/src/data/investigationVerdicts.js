/*
  SERVER-ONLY expected verdicts for the Investigation Lab. Never import this file from the frontend (src/).

  Keyed by case id (see src/data/investigations.js). `expected` must be one of the
  assessmentOptions ids. The explanation is revealed only after a submission.

  After editing, run `npm run catalog:seed --prefix server` and apply the regenerated
  catalog migration so the database verdicts match.
*/

export const investigationVerdicts = {
  'flood-photo': {
    expected: 'misleading',
    explanation:
      'The photo is real, but it shows a different flood from six years ago in another country. While it is raining in Brightvale today, official traffic cameras and local news do not show the highway underwater. A genuine photo with a false time and place is misleading.',
  },
  'coffee-study': {
    expected: 'misleading',
    explanation:
      'There is a real study, but the headline badly exaggerates it. The research involved 24 mice and one memory task, and the researchers did not claim a cure. Turning early animal research into "proof" of a cure for humans is misleading.',
  },
  'class-suspension': {
    expected: 'supported',
    explanation:
      'This announcement comes from the office responsible for it, matches the advisory on the official website, and is confirmed by independent local media. Being a careful thinker also means recognizing when evidence is strong enough to trust.',
  },
  'quote-card': {
    expected: 'insufficient',
    explanation:
      'There is no source, date, or recording for the quote, and no reliable outlet has confirmed it. At the same time, no one has shown it is fabricated yet. The responsible conclusion is that there is not enough information to decide, which means you should not share it as fact.',
  },
  'mayor-video': {
    expected: 'misleading',
    explanation:
      'The clip appears to be built from real press conference footage with altered audio and lip movements. The original video shows the mayor saying something entirely different, and reliable outlets have reported the comparison. This is manipulated media and should not be shared as real.',
  },
  'fuel-price': {
    expected: 'misleading',
    explanation:
      'The article is real and was accurate three years ago, but sharing it today without its date makes it misleading. Current advisories show prices going down. A reliable source can still be shared in a misleading way.',
  },
}
