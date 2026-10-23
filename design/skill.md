# SKILL: Enterprise Node.js Backend Architecture Enforcer (Pure JS)
# Activated: Whenever Node.js, JavaScript, Express, Fastify, Databases, or API design is requested.

## 1. ANTI-SLOP CODE QUALITY RULES
- STRUCTURAL VALIDATION: Because there are no compile-time types, runtime data validation is mandatory. Every payload (`req.body`, `req.query`) must be rigorously vetted using validation engines like Jite or Zod.
- NO SILENT FAILURES: Ban empty catch blocks or generic `console.error(e)`. Every catch block must log structured errors with explicit context metrics and forward to a global error handler middleware.
- NO HARDCODED SECRETS: Enforce strict environment configuration validation on boot using environment validation scripts.

## 2. API DESIGN & ENVIRONMENT STANDARDS
- EXPLICIT HTTP STATUS CODES: Never default to standard `200` or `500` codes. Use `201 Created` for creations, `400 Bad Request` for validation failures, `401/403` for auth/permissions, and `422 Unprocessable Entity` for domain logic blocks.
- DEFENSIVE PROGRAMMING: Explicitly check for `null`, `undefined`, or missing object paths using optional chaining (`?.`) and nullish coalescing (`??`) to prevent runtime crashes.

## 3. REQUIRED PRE-CODE ARCHITECTURE STEP
Before generating any backend endpoints, routes, or queries, output this exact design header block:
/* 
  ⚡ LAYER: [Controller / Service / Data Access]
  🔒 SECURITY: [Authentication Strategy & Input Schema Check]
  🚨 ERROR HANDLING: [Explicit Try/Catch Mapping to Status Codes]
*/
