# AGENTS.md — Working Rules for This Project

This is a professional Project & Task Management Portal. Treat the project as production-quality software. Everything must be correct, secure, maintainable, and consistent with the existing architecture.

## 1. Follow the User's Orders

* Do exactly what the user asks.
* Do not invent additional requirements.
* Do not perform unrelated refactoring.
* Do not remove existing functionality unless explicitly requested.
* Do not replace an existing implementation simply because another approach is possible.
* If the request is ambiguous and the ambiguity can materially affect the implementation, ask before changing anything.

## 2. Ask Before Making Changes

Before modifying code:

* Inspect the relevant existing implementation.
* Explain what you found.
* Explain what you intend to change.
* Explain why the change is needed.
* Identify any database, authentication, security, or existing-feature impact.
* Wait for approval when the requested change requires modifying an area protected by these rules.

Do not make assumptions about missing implementation details.

## 3. Never Modify UI Without Permission

Do not modify the UI, frontend styling, or visual design unless the user explicitly asks for it.

This includes:

* TSX layouts
* Components
* Tailwind classes
* CSS
* Design tokens
* Colors
* Typography
* Spacing
* Responsive behavior
* Existing forms
* Existing visual layouts
* Buttons
* Cards
* Navigation
* Dashboard appearance

Backend or authentication changes must not unnecessarily modify existing UI.

If a backend error needs to be displayed, use the existing error-display mechanism instead of redesigning the UI.

## 4. Existing Technology Stack

The project currently uses:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* Prisma 6
* PostgreSQL
* NextAuth/Auth.js v5
* JWT sessions
* Email/password authentication
* Google OAuth

Do not assume a different version of these technologies.

In particular:

* Do not apply Prisma 7 configuration or migration instructions.
* Do not replace NextAuth/Auth.js with another authentication library.
* Do not add Express unless explicitly requested.
* Do not introduce another backend server without explicit approval.

## 5. Next.js Architecture

Next.js is the full-stack framework for this application.

Use the appropriate Next.js mechanism for each responsibility.

### Server Components

Prefer Server Components for server-side data fetching and rendering when interactivity is not required.

Do not unnecessarily convert Server Components into Client Components.

### Client Components

Use Client Components when the component requires:

* Browser APIs
* User interaction
* React client state
* Event handlers
* Client-side effects
* Other functionality that requires the client

Do not use `"use client"` unnecessarily.

### Server Actions

Use Server Actions for appropriate server-side mutations and operations that fit the application's existing architecture.

Server Actions must:

* Validate input
* Authenticate the user when required
* Authorize the user
* Perform the appropriate server-side operation
* Return predictable results/errors

Never rely only on frontend validation or UI restrictions for security.

### Route Handlers

Use Next.js Route Handlers when an actual HTTP API endpoint is required.

Route Handlers may later be consumed by:

* The web application
* A React Native mobile application
* Other authorized clients

Do not add Express merely because the application needs APIs.

## 6. Authentication

Authentication is a critical part of the application.

The application supports:

* Email/password authentication
* Google OAuth
* JWT sessions
* Logout
* Protected application routes
* User profiles
* Google account linking

Existing authentication behavior must be preserved unless the user explicitly asks for changes.

Authentication must always be implemented server-side securely.

Never:

* Trust client-provided identity information
* Trust an email address supplied by the browser as proof of identity
* Expose authentication secrets
* Expose OAuth client secrets
* Expose password hashes
* Store plaintext passwords
* Bypass session verification
* Bypass authorization checks

## 7. Google OAuth

Google authentication and the application's User account are separate concepts.

A Google login authenticates the user's Google identity and then resolves that identity to an application User.

A new Google user should result in the appropriate application User and OAuth Account records.

An existing Google user must resolve to the existing application User.

Do not create duplicate application Users when the Google Account is already linked.

### Existing Email/Password User

If an existing application User already has an email/password account and the user attempts Google login with the same verified email:

* Do not silently create a duplicate User.
* Do not silently merge accounts.
* Handle the conflict safely.
* Tell the user that an account with that email already exists.
* Direct the user to sign in using the existing authentication method and then explicitly connect Google from account settings.

The exact implementation must follow the installed NextAuth/Auth.js v5 behavior.

Do not invent incompatible Auth.js callbacks or error handling.

## 8. Google Account Linking

Google account linking is an explicit account-management operation.

The intended behavior is:

Existing application account
→ User signs in
→ Account settings
→ Connect Google
→ Google OAuth
→ Verify Google identity
→ Link Google Account to the existing User

After successful linking, the same application User may have:

* Email/password authentication
* Google authentication

Do not automatically merge accounts without explicit and secure account-linking behavior.

## 9. Sessions and Logout

Authenticated users must have a valid application session.

Protected application functionality must verify the session server-side.

Logout must terminate the application's session.

Logging out of the application does not mean logging the user out of their Google account.

Do not implement Google-account logout when the user only requested application logout.

## 10. Account Deletion

Users may delete their application account where the existing account-management functionality supports it.

Deleting an application account means deleting or deactivating the user's account within this application according to the application's data-retention rules.

It must never attempt to delete the user's actual Google account.

Before modifying account deletion:

* Inspect Prisma relationships.
* Inspect related Account records.
* Inspect Session records.
* Inspect workspace memberships.
* Inspect projects/tasks.
* Inspect conversations/messages.
* Determine existing cascade/relation behavior.

Do not introduce destructive cascading behavior without understanding its impact.

Do not delete user data blindly.

## 11. Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> Is this user allowed to access this resource?

Both are required.

Being logged in does not automatically give a user access to every project, task, workspace, conversation, or message.

Workspace-related resources must verify workspace membership and applicable permissions on the server.

Never rely only on:

* Hidden UI
* Disabled buttons
* Client-side checks
* Route visibility
* Browser state

For protected operations, server-side authorization is mandatory.

## 12. Workspace Isolation

Workspace data must be isolated between users and workspaces.

A user must not be able to access another workspace's data simply by changing an ID in:

* URL parameters
* Request bodies
* Search parameters
* API requests
* Server Action inputs

Always verify that the authenticated user has the required relationship with the requested workspace/resource.

## 13. Projects and Tasks

Projects and tasks belong to the application's workspace/project system.

Operations such as:

* Create
* Read
* Update
* Delete
* Search
* Filter

must respect authentication and workspace/project authorization.

Do not allow users to modify resources merely because they know the resource ID.

Task operations must validate:

* User authentication
* Workspace/project membership
* Resource ownership/permissions where applicable
* Input data

## 14. Forms and Validation

Use the project's existing form architecture.

Where React Hook Form and Zod are already part of the project design:

* Use React Hook Form for complex client-side forms where appropriate.
* Use Zod for schema validation.
* Do not rely exclusively on client-side validation.
* Validate important input again on the server.

Never assume data coming from the browser is trustworthy.

## 15. Search and Filtering

Where search and filtering are part of the application's existing design:

* Preserve URL-based filtering where already implemented.
* Keep filter state predictable and shareable.
* Validate URL parameters on the server where they affect protected data.
* Do not fetch unrestricted data and merely hide it on the client.

## 16. State Management

Use the appropriate state-management mechanism for the type of state.

Do not use global client state for data that should remain server-owned.

Use existing Zustand/Redux architecture where already established.

Do not introduce another state-management library without explicit approval.

## 17. Caching and Revalidation

Use Next.js caching and revalidation intentionally.

Do not add caching blindly to authenticated or user-specific data.

User-specific and workspace-specific data must not accidentally be shared between users through incorrect caching.

When modifying caching behavior, verify:

* Authentication boundaries
* Workspace boundaries
* Data freshness
* Revalidation behavior
* Server/client data flow

## 18. Loading, Error, and Not-Found Behavior

The application should handle:

* Loading states
* Errors
* Missing resources
* Unauthorized access
* Forbidden access
* Failed mutations
* Failed authentication
* Failed API requests

Do not expose raw database errors, stack traces, secrets, or internal implementation details to users.

Use the existing application's error-handling approach.

## 19. Chat

The application supports workspace-based communication.

Chat functionality may include:

* Individual conversations
* Group conversations
* Conversation members
* Messages
* Workspace-based access control

A user must not be able to access a conversation simply by knowing its ID.

Verify conversation membership and applicable workspace authorization on the server.

Realtime messaging may be added separately.

Do not introduce WebSockets, third-party realtime services, or another realtime architecture unless explicitly requested.

## 20. Mobile API Compatibility

The Next.js application may provide APIs that can later be consumed by a React Native/Android application.

The architecture can support:

Web application
→ Next.js API

React Native application
→ Next.js API

A mobile application does not automatically require Express.

Do not add Express solely because an APK may consume the API.

If a separate backend is proposed, explain why it is needed and wait for approval.

## 21. Database

The current database stack is:

PostgreSQL
→ Prisma 6

Before modifying the database schema:

1. Inspect the existing schema.
2. Understand existing relations.
3. Identify affected data.
4. Explain the proposed change.
5. Obtain approval when required.
6. Use a safe migration.
7. Never reset production or existing development data without explicit approval.

Never run destructive commands such as database resets without explicit permission.

Do not delete existing data to make a migration pass.

## 22. Prisma

Use the Prisma version already installed in the project.

Do not apply Prisma 7 configuration or syntax to this Prisma 6 project.

Before changing Prisma models:

* Check existing relations.
* Check foreign keys.
* Check indexes.
* Check unique constraints.
* Check cascading behavior.
* Check existing migrations.

Do not create duplicate models or relationships when an existing model already serves the purpose.

## 23. Environment Variables and Secrets

Never expose:

* Database passwords
* OAuth client secrets
* Auth secrets
* API keys
* Private tokens
* Access tokens
* Session secrets

Never commit secrets to Git.

Ask before modifying `.env`.

When asking the user to provide environment information, request variable names or redacted values only.

## 24. No Express by Default

The project does not use Express.

Do not install or introduce Express unless the user explicitly requests it.

Next.js can provide:

* Server-side logic
* Server Actions
* Route Handlers
* APIs
* Authentication integration
* Database access through Prisma

A separate Express backend is an architectural decision, not a requirement for mobile apps or large applications.

## 25. No Unnecessary Dependencies

Do not install packages simply because they are popular or convenient.

Before adding a dependency:

* Check whether the project already provides the functionality.
* Explain why the dependency is necessary.
* Explain its impact.
* Wait for approval when the addition is not explicitly requested.

Do not introduce duplicate libraries for the same responsibility.

## 26. Preserve Existing Work

This project contains previously implemented functionality.

Before modifying an existing feature:

* Inspect it.
* Understand how it currently works.
* Preserve behavior that is not part of the requested change.
* Make the smallest safe change necessary.

Do not rewrite working authentication, database, dashboard, project, task, profile, or Google-linking functionality unnecessarily.

## 27. Git Safety

Do not:

* Delete branches
* Force-push
* Rewrite history
* Reset user work
* Delete uncommitted changes

unless explicitly requested.

Do not commit secrets.

Before destructive Git operations, ask for explicit approval.

## 28. Verification

After approved code changes, verify the implementation.

At minimum, for changed TypeScript/TSX code:

```bash
npx tsc --noEmit
```

Run ESLint against changed files:

```bash
npx eslint <changed files>
```

When appropriate, also run:

```bash
npm run build
```

For Prisma changes, run the appropriate non-destructive Prisma validation/generation commands for Prisma 6.

Do not claim that something works if verification failed or was not performed.

If a verification command fails:

* Report the exact failure.
* Identify whether it is caused by the changes.
* Do not hide or ignore the failure.

## 29. Before and After Every Change

Before implementation:

* Inspect.
* Explain.
* Ask for approval when required.

After implementation:

* List changed files.
* Explain what changed.
* Explain why it changed.
* Explain database/auth/security impact.
* List verification commands.
* Report their actual results.
* Mention remaining manual steps.
* Mention any known limitations.

## 30. Professional Standard

Prefer:

* Simple architecture
* Type safety
* Secure server-side authorization
* Clear separation of responsibilities
* Reusable code
* Minimal duplication
* Predictable behavior
* Maintainability
* Explicit error handling
* Safe database operations
* Existing project conventions

Avoid:

* Quick hacks
* Duplicated logic
* Unnecessary abstractions
* Unnecessary dependencies
* Silent behavior changes
* Unverified fixes
* Security shortcuts
* Client-only authorization
* Destructive database operations
* Unrelated refactoring

The goal is not merely to make the code run. The goal is to keep the Project & Task Management Portal secure, maintainable, predictable, and production-quality while respecting the existing architecture and the user's explicit decisions.
