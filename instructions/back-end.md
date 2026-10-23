# VERIFYIT — COMPLETE FULL-STACK BACKEND IMPLEMENTATION

Act as a senior full-stack engineer, backend architect, PostgreSQL database designer, and application security engineer.

Your task is to transform my existing VerifyIT application into a fully functional full-stack digital literacy platform.

## 1. EXISTING PROJECT AND TECHNOLOGY STACK

VerifyIT is an educational website called:

"VerifyIT: A Digital Literacy Campaign Against Online Misinformation"

Its purpose is to teach users how to identify misinformation, misleading headlines, manipulated images, AI-generated content, deepfakes, unreliable sources, and unsupported claims.

The existing frontend uses:

- React
- Vite
- JavaScript and JSX
- Tailwind CSS
- React Router DOM
- Lucide React

The required backend stack is:

- Node.js
- Express.js
- JavaScript ES modules
- Supabase Auth
- Supabase PostgreSQL
- Supabase JavaScript SDK
- Zod validation
- Helmet
- Express rate limiting
- dotenv
- PDFKit for certificate generation
- A QR-code library for certificate verification
- Vitest or another suitable existing test framework

Use compatible stable package versions. Reuse existing dependencies whenever possible.

Do not introduce TypeScript, a different frontend framework, a different database, or unnecessary libraries.

## 2. CRITICAL RULE: INSPECT BEFORE MODIFYING

Before changing any files, inspect the entire existing project structure.

Examine:

- package.json
- vite.config.js
- src/App.jsx
- src/main.jsx
- src/index.css
- src/components/
- src/data/
- src/hooks/
- src/pages/
- src/utils/
- Existing React Router configuration
- Existing quiz data and category identifiers
- Existing Investigation Lab cases and verdicts
- Existing lesson identifiers and completion logic
- Existing dashboard calculations
- Existing localStorage implementation
- Existing Git configuration and .gitignore

Identify which features already work and which currently use mock data, hardcoded values, or localStorage.

Run the existing application and build if possible. Record any pre-existing errors.

Then create a step-by-step implementation plan and immediately proceed with the implementation.

Do not stop after writing the plan unless you encounter a genuine blocker requiring credentials or a decision from me.

### Preservation requirements

- Do not rebuild the application from scratch.
- Do not remove or replace the existing visual design.
- Do not delete working pages, routes, components, lessons, quiz questions, or investigation scenarios.
- Do not replace existing data with random placeholder content.
- Do not rename identifiers without updating every reference.
- Do not break guest access.
- Do not modify unrelated components unnecessarily.
- Do not claim that Supabase works without actually testing the configured integration.
- Make incremental changes and inspect the result after each major phase.

The goal is to add a real backend to the existing application, not to create a different application.

# PHASE 1 — ARCHITECTURE

Implement this architecture:

Existing React frontend
    |
    | HTTPS requests and Supabase authentication JWT
    v
Node.js + Express API
    |
    | Authentication, authorization, validation,
    | application logic, scoring and certificate issuance
    v
Supabase PostgreSQL + Supabase Auth

Use a versioned API prefix:

/api/v1

The backend must be responsible for protected data operations, authoritative quiz scoring, saved progress, investigation attempts, dashboard aggregation, and certificate eligibility.

The frontend must never be trusted to determine a user's identity, quiz score, investigation correctness, or certificate eligibility.

Use the user's authenticated Supabase access token for protected API calls.

Verify tokens on the backend using supported Supabase authentication methods. Do not decode a JWT and treat the decoded claims as verified without validating its signature and validity.

Prefer user-scoped database access with RLS enforcement. If a privileged database operation is necessary, isolate it in a trusted service, validate authorization independently, and never expose service-role credentials.

# PHASE 2 — PROJECT STRUCTURE

Create a maintainable backend structure that fits the existing repository.

Suggested structure:

server/
  src/
    app.js
    server.js
    config/
      env.js
      supabase.js
    middleware/
      authenticate.js
      validate.js
      errorHandler.js
      notFound.js
    routes/
      health.routes.js
      profile.routes.js
      lessons.routes.js
      quizzes.routes.js
      investigations.routes.js
      toolkit.routes.js
      dashboard.routes.js
      certificates.routes.js
    controllers/
    services/
      profile.service.js
      lessons.service.js
      quizzes.service.js
      investigations.service.js
      dashboard.service.js
      certificates.service.js
      pdf.service.js
    validators/
    data/
      lessons.js
      quizzes.js
      investigations.js
    utils/
  tests/
  package.json
  .env.example

supabase/
  migrations/

Adapt the structure to the existing application. Avoid empty files and unnecessary abstraction.

Keep the frontend and backend package configurations compatible. Add root-level development scripts only if doing so preserves the existing commands.

# PHASE 3 — DATABASE SCHEMA AND MIGRATIONS

Create version-controlled SQL migrations for a fresh Supabase project.

Use UUID primary keys where appropriate, foreign keys, timestamps, indexes, uniqueness constraints, and validation constraints.

Create and document the following tables.

## A. profiles

Fields:
- id UUID referencing auth.users
- display_name
- created_at
- updated_at

Create profiles safely for new users using an appropriate database trigger or registration workflow.

Handle display-name updates and missing profiles.

Never store passwords in this table.

## B. lesson_progress

Fields:
- id
- user_id
- lesson_id
- completed
- completed_at
- updated_at

Require a unique combination of user_id and lesson_id.

Only valid, known lesson IDs can count toward certificate eligibility.

## C. quiz_attempts

Fields:
- id
- user_id
- category
- score
- total_questions
- completed_at

Validate that the score is between zero and the total number of questions and that the total is positive.

## D. quiz_answer_results

Fields:
- id
- attempt_id
- question_id
- selected_answer
- is_correct
- confidence_rating
- created_at

Confidence ratings must be integers from 1 to 5 when supplied.

Associate answer records with the correct quiz attempt and enforce ownership through secure policies or trusted backend operations.

## E. investigation_attempts

Fields:
- id
- user_id
- case_id
- selected_verdict
- is_correct
- confidence_rating
- submitted_at

Use actual existing investigation case identifiers and verdict options.

Allow repeated attempts if the existing experience supports them, but count a case as completed only once.

## F. toolkit_progress

Fields:
- id
- user_id
- item_id
- checked
- updated_at

Require uniqueness for user_id and item_id.

## G. certificates

Fields:
- id UUID primary key
- user_id UUID referencing auth.users
- certificate_number unique, cryptographically random and non-sequential
- certificate_type
- recipient_name
- issued_at
- status, supporting active and revoked
- created_at

Prevent duplicate active certificates for the same user and certificate type through an appropriate database constraint or a transaction-safe issuance strategy.

## H. Supporting data

Create additional tables only when necessary for reliable functionality.

If quiz questions or investigation cases need server-authoritative answer keys, store their trusted definitions in a server-side catalog or suitable database tables.

Keep all existing question and case IDs consistent with the frontend.

Do not store correct answers in a public API response before a submission.

Do not create duplicate schema tables when equivalent tables already exist. Inspect and migrate existing schema where applicable.

## Database requirements

- Enable RLS on all user-owned tables.
- Users can only access their own profiles, progress, attempts, and certificates.
- Enforce ownership of related records.
- Prevent one user from inserting records for another user.
- Protect answer keys and privileged certificate operations.
- Use appropriate foreign-key deletion behavior.
- Add indexes for frequent user_id, category, case_id, and certificate_number lookups.
- Add updated_at triggers where appropriate.
- Ensure database constraints prevent invalid data.
- Provide a safe migration and setup procedure.
- Never assume database tables exist simply because frontend code references them.

# PHASE 4 — AUTHENTICATION

Implement Supabase Auth using email and password.

Add login, registration, logout, session restoration, and password-reset functionality if missing.

Preserve the existing design. Integrate authentication pages and controls into the current interface instead of redesigning the entire website.

Requirements:

1. Users can register.
2. Users can log in.
3. Users can log out.
4. Sessions persist appropriately.
5. Expired sessions are handled.
6. Protected API routes reject missing or invalid authentication.
7. Users can update their display name.
8. The frontend sends the current access token to protected Express endpoints.
9. The backend validates the token before performing protected operations.
10. Loading, validation, network, and authentication errors are displayed clearly.

Use Supabase's built-in password security.

Never store passwords in localStorage, PostgreSQL application tables, or logs.

Do not implement custom password hashing or authentication.

# PHASE 5 — GUEST MODE AND PROGRESS SYNCHRONIZATION

Preserve the existing guest experience.

Users must still be able to read learning materials, take quizzes, use the Investigation Lab, and interact with the Verification Toolkit without creating an account, wherever the current application permits.

For guests:
- Preserve localStorage functionality.
- Store only the local progress needed for the existing experience.
- Explain that guest progress is stored locally and does not automatically synchronize across devices.
- Do not show a fake server-persisted success state.

For authenticated users:
- Load their saved progress from Supabase.
- Save new progress through the Express API.
- Display actual saved quiz and investigation history.
- Keep guest progress until synchronization succeeds.
- Merge progress without creating duplicate records or duplicate quiz attempts.
- Do not overwrite newer saved data with older local state.
- Make synchronization retryable.
- Do not silently discard local data after a network error.

Never trust a guest's localStorage data as proof of eligibility for a verified certificate.

If guest progress is imported, validate the records and require any necessary lesson or investigation completion to be confirmed by trusted server-side operations before issuing a certificate.

# PHASE 6 — EXPRESS API ENDPOINTS

Implement these endpoints under /api/v1.

## Health

GET /api/v1/health

Return a minimal service-health response without exposing secrets or infrastructure details.

## Profile

GET /api/v1/me

PATCH /api/v1/me

Return the authenticated user's profile and allow safe display-name updates.

Ignore or reject any user_id supplied as the authority for ownership.

## Lessons

GET /api/v1/lessons

GET /api/v1/lessons/progress

PUT /api/v1/lessons/progress/:lessonId

Return public lesson metadata and the authenticated user's progress.

Allow an authenticated user to mark a known lesson complete through the server.

Do not accept arbitrary lesson IDs as completed lessons.

Use upserts or equivalent logic to prevent duplicate progress records.

## Quizzes

GET /api/v1/quizzes/categories

GET /api/v1/quizzes/:category/questions

POST /api/v1/quizzes/:category/attempts

GET /api/v1/quizzes/attempts

GET /api/v1/quizzes/attempts/:attemptId

Preserve these existing categories:

1. AI-Generated Image Detection
2. Misleading Information
3. Source Credibility
4. Image Manipulation and Missing Context
5. Deepfakes and AI-Generated Content
6. Fact-Checking and Evidence Verification
7. Mixed Challenge

Use the existing category identifiers if they differ from these display labels.

### Quiz integrity

The frontend submits:
- Question IDs
- Selected answers
- Optional confidence ratings

The server validates the category and question IDs, calculates correctness using trusted answer keys, calculates the final score, and stores the attempt.

Do not accept a client-provided score, correctness flag, or user ID as authoritative.

Do not return correct answers through the question-loading endpoint.

After submission, return the result, score, explanations, and feedback required by the existing interface.

Validate duplicate question submissions and malformed payloads.

Preserve all current quiz questions, answer choices, explanations, and category-specific behavior.

If questions currently exist only in frontend data files, move or mirror the necessary trusted question definitions to the server while preserving IDs and content. Keep answer keys server-side.

If the current quiz architecture cannot safely support server-side scoring without a migration, implement the migration rather than silently retaining client-trusted scoring.

## Investigation Lab

GET /api/v1/investigations/cases

GET /api/v1/investigations/progress

POST /api/v1/investigations/:caseId/attempts

GET /api/v1/investigations/attempts

Validate case IDs and allowed verdict values.

Determine correctness using trusted case definitions on the server.

Save submissions only after validation and successful database operations.

Preserve existing investigation explanations, evidence clues, and feedback.

Do not fabricate external source verification.

Do not automatically treat a case as completed just because its page was opened.

## Verification Toolkit

GET /api/v1/toolkit/progress

PUT /api/v1/toolkit/progress

Persist the authenticated user's checklist state.

Support safe bulk updates if appropriate.

## Dashboard

GET /api/v1/dashboard

Return actual saved statistics:

- Completed lessons
- Total required lessons
- Latest quiz attempts
- Best quiz scores by category
- Total quiz attempts
- Investigation cases completed
- Investigation attempt history
- Confidence versus accuracy, when available
- Verification Toolkit completion
- Certificate eligibility and issuance status

Use server-side aggregation or reliable queries.

Handle new users with no history.

Never invent scores or expose another user's statistics.

# PHASE 7 — DIGITAL LITERACY CERTIFICATE

Implement a complete certificate-of-completion system integrated with authentication, PostgreSQL, the dashboard, and the Investigation Lab.

Certificate title:

CERTIFICATE OF COMPLETION

Awarded for completing:

DIGITAL LITERACY AND ONLINE MISINFORMATION AWARENESS

The certificate is issued by the VerifyIT educational project.

Do not claim government endorsement, external accreditation, professional licensing, or certification by an institution that has not actually granted it.

## Eligibility rules

A user qualifies only when both conditions are true:

1. Every required learning module is marked complete in trusted server-side records.
2. Every required Investigation Lab case has at least one valid, saved submission.

Determine the required module and case IDs from the existing project.

Maintain one canonical server-side list or catalog of required items. If the project adds new required modules or cases, eligibility must account for them.

Do not hardcode guessed totals.

Completion does not require a perfect quiz score unless the existing project explicitly defines such a requirement.

An investigation submission does not have to be correct for a completion certificate unless the project explicitly specifies otherwise.

Calculate eligibility on the server immediately before issuance.

Never allow the frontend to submit an eligibility flag or bypass requirements.

## Certificate endpoints

GET /api/v1/certificates/eligibility

Return:
- eligible
- completedLessons
- requiredLessons
- completedCases
- requiredCases
- remainingRequirements
- existingCertificate, if present

POST /api/v1/certificates/issue

Require authentication.

Recalculate eligibility from trusted persisted records.

Require a valid recipient display name.

Generate a secure, unique, non-sequential certificate number.

Store the recipient name and issue timestamp as a certificate snapshot.

Use transaction-safe or database-enforced idempotency to prevent duplicate issuance, including simultaneous requests.

If a valid certificate already exists, return that certificate rather than creating another one.

GET /api/v1/certificates/my

Return only the authenticated user's certificate records.

GET /api/v1/certificates/:id/pdf

Verify certificate ownership and active status before generating or returning the PDF.

Never allow a user to download another user's private certificate by changing the ID.

GET /api/v1/certificates/verify/:certificateNumber

Provide public certificate verification.

Return only:
- Validity status
- Certificate title
- Recipient name as printed
- Certificate number
- Issue date
- Completion description
- Revocation status when relevant

Do not expose emails, user IDs, authentication details, progress records, or private profile data.

Return an invalid status for missing, nonexistent, or revoked certificates.

## PDF generation

Generate the certificate on the backend using PDFKit.

Use a professional A4 landscape layout.

Include:
- VerifyIT branding
- Certificate of Completion
- Digital Literacy and Online Misinformation Awareness
- Recipient name in prominent typography
- Completion statement
- Issue date
- Unique certificate number
- Actual certificate verification URL
- QR code pointing to that verification URL
- Small statement identifying this as a VerifyIT project-issued certificate

Use navy-blue typography, subtle cyan accents, clean spacing, and elegant borders.

Ensure the PDF prints correctly and does not clip text.

Use environment configuration for the public frontend URL. Do not hardcode localhost into production certificate files.

Set correct content type and download filename.

Do not return a broken PDF when generation fails.

## Certificate frontend

Add a Certificate page or section consistent with the existing UI.

Before eligibility:
- Show a locked certificate preview.
- Show the actual lesson completion count.
- Show the actual Investigation Lab completion count.
- Explain remaining requirements.
- Provide links to incomplete learning modules or cases.

When eligible:
- Show "Eligible for Certificate".
- Display a certificate preview.
- Ask for a display name if the profile does not have one.
- Provide a "Claim Certificate" button.
- Show loading and error states.

After issuance:
- Display the recipient name, issue date, certificate number, and certificate status.
- Provide a "Download PDF" button.
- Provide a "Verify Certificate" link.
- Allow the owner to access the certificate again after logging out and back in.

Do not show a certificate as officially issued until the backend confirms issuance.

Guests who complete activities locally must be asked to sign in or register to claim a verified certificate. Preserve their progress and provide a safe synchronization or confirmation flow.

## Public verification page

Add a route:

/verify-certificate/:certificateNumber

This page must work without login.

Call the public verification endpoint and show a clear valid or invalid result.

For valid certificates, show the certificate title, recipient name, issue date, and certificate number.

For invalid or revoked certificates, clearly display the status.

Include loading, network-error, and not-found states.

Never trust the URL identifier alone as proof of validity.

# PHASE 8 — SECURITY

Implement all of the following.

## Environment variables

Backend environment file:

PORT=
NODE_ENV=
FRONTEND_URL=
PUBLIC_APP_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

Frontend environment file:

VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Use supported publishable/anon key configuration and document the naming consistently.

Create .env.example files containing placeholders only.

Ensure real .env files are ignored by Git.

Never put a service-role key, database password, JWT secret, or private credential in frontend code or any VITE_ variable.

## API security

- Configure Helmet.
- Restrict CORS to configured origins.
- Use request validation with Zod.
- Add rate limiting.
- Limit request body sizes.
- Use safe database operations.
- Validate all IDs, categories, verdicts, and query parameters.
- Protect all user-specific routes with authentication.
- Enforce ownership and RLS.
- Prevent cross-user access.
- Prevent unauthorized certificate issuance.
- Never expose correct answers before quiz submission.
- Avoid logging access tokens, passwords, or secrets.
- Return generic production errors without stack traces.
- Handle database failures safely.
- Use appropriate HTTP status codes.
- Do not trust frontend-only validation.
- Do not return sensitive data in public verification responses.

Use a centralized error handler and a consistent API response structure.

# PHASE 9 — FRONTEND INTEGRATION

Create reusable API and Supabase utilities, adapting to the existing project.

Possible files:

src/lib/api.js
src/lib/supabase.js
src/hooks/useAuth.js
src/context/AuthContext.jsx

Do not create duplicate utilities if equivalents already exist.

Connect all existing features to the backend:

- Authentication
- Profile
- Lesson progress
- Quiz submission and results
- Investigation submissions
- Verification Toolkit
- Dashboard
- Certificate eligibility
- Certificate issuance
- PDF download
- Public verification

Keep existing styling, navigation, routes, responsive behavior, and content.

Implement proper loading, success, empty, offline, and error states.

Disable repeated submissions while requests are in progress.

Do not show success until the backend confirms it.

Do not silently discard progress when requests fail.

Keep guest mode functional.

# PHASE 10 — TESTS

Write automated tests appropriate to the existing project.

Test at least:

## Authentication and authorization
- Invalid tokens are rejected.
- Protected routes reject unauthenticated requests.
- A user cannot access another user's records.
- RLS prevents cross-user data access.

## Lessons and quizzes
- Known lessons can be completed.
- Unknown lesson IDs are rejected.
- Every existing quiz category is preserved.
- Invalid categories are rejected.
- Correctness is calculated server-side.
- Client-submitted scores cannot be trusted.
- Confidence values outside 1-5 are rejected.
- Quiz history belongs to the authenticated user.

## Investigation Lab
- Valid cases accept allowed verdicts.
- Invalid cases and verdicts are rejected.
- Correctness comes from trusted server-side definitions.
- Completion is based on a saved submission.

## Dashboard
- New users receive valid empty-state statistics.
- Scores and completion totals match saved records.
- Data from other users is never included.

## Certificates
- No completed lessons means ineligible.
- All lessons but incomplete cases means ineligible.
- All cases but incomplete lessons means ineligible.
- Full completion means eligible.
- Missing display name prevents issuance until supplied.
- Ineligible users cannot issue certificates.
- Repeated issuance does not create duplicates.
- Unauthenticated users cannot issue certificates.
- Users cannot download other users' certificates.
- Public verification works for valid certificates.
- Invalid certificates are not reported as valid.
- Revoked certificates are not reported as valid.
- PDFs contain the correct recipient name, issue date, certificate number, and verification URL.
- Public verification reveals no private user data.

## Regression tests
Verify:
- Homepage and navigation
- Learning modules
- All quiz categories
- Quiz feedback and scores
- Investigation Lab
- Verification Toolkit
- Dashboard
- Guest mode
- Login and registration
- Certificate page
- Public certificate verification
- Responsive layouts

Use mocked Supabase responses for isolated tests where appropriate. Clearly identify which tests require a configured Supabase project.

# PHASE 11 — DOCUMENTATION AND DEVELOPER EXPERIENCE

Update README.md with:

1. Required Node.js version.
2. Dependency installation.
3. Supabase project creation.
4. Authentication configuration.
5. Environment variables.
6. SQL migration instructions.
7. RLS configuration.
8. Frontend startup.
9. Backend startup.
10. API health check.
11. Registration and login testing.
12. Testing database persistence.
13. Certificate eligibility and issuance.
14. PDF downloading and public verification.
15. Troubleshooting CORS, database errors, authentication, and environment variables.

Provide root scripts or a convenient development workflow if appropriate.

Preserve existing useful documentation.

Do not run destructive database commands against an existing production project.

Do not automatically deploy the application or run migrations against a remote database without explicit authorization.

# PHASE 12 — IMPLEMENTATION AND FINAL VERIFICATION

Work incrementally:

1. Inspect the project and document the baseline.
2. Implement backend configuration and health endpoint.
3. Create SQL migrations and RLS policies.
4. Implement authentication and profile APIs.
5. Implement lesson progress APIs.
6. Implement authoritative quiz scoring.
7. Implement Investigation Lab persistence.
8. Implement Verification Toolkit persistence.
9. Implement dashboard aggregation.
10. Implement certificate eligibility and issuance.
11. Implement PDF generation and public verification.
12. Connect the existing frontend.
13. Preserve guest mode and synchronize progress safely.
14. Add automated tests.
15. Run the frontend build and backend tests.
16. Fix regressions and verify the existing interface.

Do not skip ahead by creating placeholder endpoints that return fake data.

Do not pretend a feature is complete if it only has a UI without working persistence.

If a feature requires missing Supabase credentials, implement what can be implemented locally and clearly explain the remaining manual configuration.

## FINAL ACCEPTANCE CRITERIA

The implementation is considered complete when:

- The existing React application still works.
- The Express server starts.
- Supabase Auth works after configuration.
- SQL migrations create the required schema.
- RLS policies enforce user ownership.
- Authenticated users can save and retrieve their own records.
- Guest mode remains usable.
- Quiz scores are calculated authoritatively.
- Investigation attempts are persisted.
- The dashboard displays saved data.
- Certificates are issued only after all required learning modules and investigation cases are completed.
- Certificates are stored in PostgreSQL and cannot be duplicated by repeated requests.
- Certificate PDFs download correctly.
- Public certificate verification works.
- Private user information is not exposed.
- Existing content and routes are preserved.
- The frontend build and available tests pass.

At the end, provide an implementation report listing:

1. Files added and modified.
2. Database tables and migrations.
3. RLS policies and security measures.
4. Implemented API endpoints.
5. Frontend integrations.
6. Environment variables requiring configuration.
7. Commands to run the application.
8. Build and test results.
9. Manual Supabase setup still required.
10. Any known limitations or unfinished work.

**FINAL INSTRUCTION:** Inspect the existing code before making changes. Preserve the existing application. Implement real functionality rather than mock endpoints. Prioritize security, data integrity, maintainability, and backward compatibility. Do not expose secrets, fabricate test results, or claim that deployment has occurred when it has not.