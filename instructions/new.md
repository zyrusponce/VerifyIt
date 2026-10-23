Improve the **right side of the VerifyIT homepage hero section** to make it look like a polished, premium digital investigation interface.

Before changing anything, inspect the existing React components, Tailwind styles, and project structure. Find the component responsible for the homepage hero and its social media investigation preview.

### Main design direction
Keep the existing left-side hero, navigation, brand identity, text, colors, and overall layout. Focus primarily on redesigning the right-side visual.

The right side should communicate that VerifyIT helps students investigate suspicious online posts.

### 1. Redesign the investigation preview
- Create one cohesive, well-designed investigation card instead of several disconnected floating elements.
- Include a social media post with a profile icon, fictional account name, timestamp, and a clearly visible "FICTIONAL CASE" badge.
- Keep the sample headline and highlighted warning phrases.
- Replace the current empty blue image placeholder with a convincing locally created flood-scene illustration or a polished SVG/CSS illustration. Do not depend on a paid image API or external image service.
- Add a compact "Warning Signs Found" section containing three evidence rows:
  1. Image history: First appeared online in 2019.
  2. Account history: Account created 3 weeks ago.
  3. Urgent wording: The post pressures readers to share immediately.
- Each row should have a small Lucide icon, a short title, and a concise explanation.
- Make the distinction between illustrative clues and verified evidence clear wherever appropriate. Do not imply that the sample scenario is real.

### 2. Improve layout and spacing
- Keep the entire composition visually balanced within the right hero column.
- Prevent cards from being cut off by the hero container or viewport.
- Remove the existing overlapping clue cards, or reposition at most one or two subtle floating callouts so they do not cover important content.
- Use consistent padding, spacing, rounded corners, thin borders, and soft shadows.
- Add a subtle cyan/blue ambient glow behind the composition, but keep the overall background clean and light.
- Preserve enough whitespace around the main card so the right side does not feel crowded.
- Align the right-side composition vertically with the left-side headline and CTA buttons.

### 3. Add subtle interaction
- Use a gentle hover elevation for the main card.
- If appropriate, add a subtle scanning animation to the image preview or a small indicator. Keep it slow and restrained.
- Respect reduced-motion preferences.
- Avoid excessive floating, bouncing, spinning, or distracting animations.

### 4. Technical requirements
- Continue using the existing React, Vite, JavaScript/JSX, Tailwind CSS, React Router DOM, and Lucide React setup.
- Reuse existing components and styles where practical.
- Do not rebuild the homepage or modify unrelated pages.
- Do not remove existing functionality, routes, or responsive behavior.
- Do not add a backend, database, paid API, or unnecessary dependencies.
- Ensure the layout works on desktop, tablet, and mobile. On smaller screens, stack or simplify the evidence panel instead of allowing overlap or horizontal overflow.
- Maintain accessible contrast, semantic markup, and visible keyboard focus states.

First implement the redesigned right-side hero, then inspect it at desktop and mobile widths. Run the available build command and fix any errors introduced by the changes.

**Priority:** Improve composition, spacing, image quality, and evidence hierarchy. Do not add more decorative elements just to make the interface look complex.