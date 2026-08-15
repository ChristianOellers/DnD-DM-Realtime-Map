# DnD Realtime map - POC

Lovable Prompt — D&D Vibe Coding Tech Demo

Goal

Initialize a fully working desktop-only D&D Game Master application whose primary purpose is to demonstrate the complete requested technology stack in one coherent product.

The app should feel like a polished modern fantasy PC game interface rather than a generic SaaS dashboard. Use a dark, atmospheric visual language inspired by classic PC RPG interfaces such as Diablo II: refined fantasy aesthetics, rich but restrained colors, gradients, shadows, subtle glow, depth and soft animations. Do not use stereotypical cyberpunk neon or sci-fi UI.

The application is a D&D scenario with a hidden twist: players initially believe they are in a medieval fantasy world, but gradually discover that it is actually a forgotten post-apocalyptic world where magic and technology coexist.

The map is the primary UI focus. Supporting story, characters, chat and game mechanics live around it.

Core Product

Map

Create a large top-down game map area.

GM can use multiple maps:

World

City

Dungeon

Use generated SVG/mock maps or safe placeholder assets.

GM can switch between maps.

Each character has an independent position on every map.

Drag characters freely using a modern drag-and-drop library.

Character positions persist per map.

Characters can be dragged outside the map when they should not be visible.

Add a simple configurable grid, preferably squares or hexagons.

Add fog of war:

GM can see the complete map.

Players see unexplored areas darkened.

Previously discovered areas remain permanently revealed.

Fog/discovery state persists independently for each map.

Add a subtle candle/light effect following the GM mouse cursor.

Characters should visually resemble small 3D tabletop figures.

Use Three.js for the map/figure rendering and demonstrate at least one shader effect.

Keep the 3D implementation technically meaningful but pragmatic; do not build an unnecessarily complex game engine.

Characters

Show characters around/on the map.

Clicking a character opens its details:

Name

Portrait/model

HP/stat information

Inventory

Temporary buffs/debuffs

Custom notes

Items with visual mockups

Use realistic fantasy/game terminology and dummy data.

Story

Provide a story sidebar containing editable GM text.

Display:

Current chapter

Current mission

Mission progress

Story text

Recent magical events/cards

The GM can edit story content and save it.

Card Mechanic

When a magical event is generated:

Generate/display three random cards.

Cards contain:

Title

Short story effect

Random icon

Random but harmonious color/theme

GM selects a card.

Selected card is added to the story.

Card visually flies/moves into a small persistent deck.

Deck remains available for the rest of the game.

This is primarily a visual/storytelling mechanic.

Do not implement complicated automatic card-game rules.

AI Event Demo

Create a GM-only interaction for a magical dice roll.

The GM can enter an optional short prompt and click a button such as Roll the Fate Dice.

Behaviour:

Generate a random event/dice result.

50% chance: generate a magical AI response.

50% chance: no magical response/event.

The backend must expose this through an API/server route.

Structure the implementation so an OpenAI-compatible endpoint can be plugged in later.

No API key is currently available.

Therefore use approximately 10 high-quality predefined mock AI responses.

Make the mock layer explicit and replaceable.

The response should influence the story and trigger the three-card mechanic.

Do not expose API keys or provider credentials to the browser.

Authentication

Demonstrate working authentication.

Preferred approach:

OAuth using a free/common provider where supported.

Use Supabase Auth where practical.

Use JWT-based authenticated sessions.

Demonstrate authentication state in the application.

Include authenticated/unauthenticated handling.

Privileged GM actions must be authorized server-side.

Do not rely on hiding UI controls as authorization.

If OAuth/JWT requirements overlap because the chosen authentication provider already uses JWT-backed sessions, use the real provider architecture rather than implementing a redundant second authentication system.

Use dummy/demo configuration where external credentials are required and clearly document setup requirements.

Persistence / Database

Use Supabase PostgreSQL as the persistent database.

Use Prisma ORM for database access where technically compatible.

Create realistic relational data for at least:

users/profiles

game sessions

maps

characters

character-map positions

fog/discovery state

items

story/chapter/mission data

cards

chat messages

Demonstrate:

Relations

CRUD

Persistence

Loading data after page reload

Server-side validation

Appropriate database constraints

Do not duplicate database access unnecessarily between Supabase client APIs and Prisma.

Use Supabase directly where its platform functionality is appropriate, and Prisma for the ORM demonstration.

Document the final database architecture clearly.

State Management

Use Zustand for meaningful client state.

Demonstrate it with actual application state such as:

active map

selected character

map UI state

GM/player mode

dark mode

selected card

temporary UI state

Include a working dark-mode switcher, while keeping dark mode as the default.

Do not put all server/database state into Zustand unnecessarily.

Realtime / WebSockets

Implement realtime communication.

All demo users can use the same game/session URL.

Include a simple open chat:

Send message

Receive messages in realtime

All connected users see the same chat

Persist messages where practical

Use a Node.js native WebSocket implementation where the environment supports it.

If the Lovable runtime/deployment environment cannot provide a persistent native WebSocket server, implement the closest functional compatible approach and document the limitation in RESULT.MD.

Do not fake realtime behaviour with periodic polling.

GM Mode

Provide a prominent but polished action such as:

Take the GM Role

Behaviour:

Any authenticated player can claim the GM role.

Only one active GM exists in the current demo session.

Clicking the action immediately switches GM control to that player.

No voting or additional permissions workflow is required.

GM can:

Move characters

Edit story

Generate AI events

Select cards

Other players:

Cannot control GM-only actions

Can see the game state

Can use chat

Enforce important permissions server-side.

Offline / PWA

Implement a real PWA demonstration.

Requirements:

Service worker/web worker as appropriate.

Cache at least one useful application resource.

Demonstrate offline detection/state.

Allow a limited set of core GM work to continue offline.

At minimum, offline story editing and/or map-position changes should persist locally.

Synchronize pending changes when connectivity returns.

Handle basic conflict behaviour deterministically.

Do not attempt to make every realtime feature fully offline.

The offline implementation should be realistic and limited in scope.

UI / CSS Technology Demonstrations

Use:

Tailwind CSS

shadcn/ui

CSS Grid

CSS Subgrid

Create at least one real UI section where Grid + Subgrid provides aligned card layouts/heights.

Do not create artificial demo pages solely to show these technologies. Integrate them naturally into the game UI.

The interface should be:

Desktop-only

Dark by default

Highly polished

Minimal but atmospheric

Playful and game-like

Readable

Strong visual hierarchy

Smooth subtle animations

Excellent spacing

Professional typography

Serif + sans-serif pairing where appropriate

Avoid:

Generic SaaS dashboards

Excessive glassmorphism

Generic AI-generated UI

Cyberpunk neon

Excessive gradients

Huge decorative elements

Poor readability

On mobile/tablet:

Simply show a clear desktop-only message.

Do not spend implementation effort on responsive mobile layouts.

Three.js

Use Three.js meaningfully.

Demonstrate:

Top-down map view

3D character figures/assets

Basic lighting

At least one shader effect

Mouse-following candle/light effect

Appropriate camera and rendering setup

Assets may be:

Generated SVGs

Simple procedural geometry

Placeholder 3D assets

Safe external assets where appropriate

Keep rendering performant.

Do not build unnecessary physics, animation systems or game-engine functionality.

Dummy Data

Create coherent medieval-fantasy/post-apocalyptic dummy content.

Include:

Several characters

Several maps

Items

Character stats

Inventory

Story chapters

Missions

Cards

Chat messages

Fog/discovery state

Content should hint at the hidden technology/post-apocalypse twist without revealing it immediately.

Testing

Use Vitest.

Provide at least two meaningful demonstrations:

Resource/data fetching behaviour.

Zustand state management behaviour.

Tests should verify actual application behaviour rather than implementation details.

Keep tests:

Fast

Deterministic

Isolated

Readable

Architecture

Keep the architecture simple and feature-oriented.

Separate:

UI/components

Domain/application logic

Client state

Server/API logic

Database access

Realtime

Authentication

AI provider/mock

Offline synchronization

Avoid unnecessary abstractions.

Use TypeScript strictly.

Use small, focused modules and components.

Follow clean-code principles:

KISS

DRY

SRP

High cohesion

Low coupling

Explicit naming

No dead code

No unnecessary wrappers

No magic values where constants are appropriate

No business logic hidden inside presentational components

Prefer simple code that is easy to remove or replace.

Project Documentation

Create RESULT.MD in the project root.

It must document:

Final architecture

Technologies actually implemented

Where each requested technology is demonstrated

Authentication architecture

Database architecture

Realtime architecture

Offline architecture

AI mock architecture

Testing

Important assumptions

Limitations

Technologies that could not be integrated

Exact reason why each impossible/incompatible technology was skipped

What would be required to implement it in a production deployment

Do not claim a technology is implemented if it is only mocked or superficially referenced.

Clearly distinguish:

Fully implemented

Functional proof of concept

Mocked

Environment-dependent

Not possible in the current Lovable environment

Security & Quality

Apply secure-by-default practices throughout.

Follow current OWASP, BSI, NIST and ENISA-aligned principles.

Specifically:

Validate all external input.

Never trust client-side authorization.

Enforce authorization server-side.

Use parameterized database queries/ORM safely.

Prevent XSS.

Avoid unsafe HTML injection.

Protect state-changing operations against CSRF where applicable.

Keep secrets server-side.

Never expose service-role/database credentials.

Use secure authentication/session handling.

Apply least privilege.

Use secure error handling without leaking internals.

Add appropriate security headers/CSP where the deployment environment permits.

Avoid unnecessary PII.

Do not put sensitive information into logs.

Keep dependencies justified and current.

Do not introduce known vulnerable dependencies.

Follow clean-code and maintainability principles:

Small focused components/modules

Strong typing

No unnecessary global state

No dead code

No duplicated implementations

No needless abstractions

Clear separation of concerns

Test important behaviour

Accessibility:

Semantic HTML

Keyboard-accessible controls

Visible focus states

Appropriate labels

Sufficient contrast

ARIA only where necessary

Implementation Rules

Before implementation:

Inspect the generated project structure and available Lovable/runtime capabilities.

Identify which requested technologies are actually compatible.

Decide the smallest architecture that can demonstrate the full stack.

Implement incrementally.

Validate each major feature before moving on.

Keep the application runnable throughout development.

Because this is a new project initialization, installing dependencies required by the explicitly requested stack is allowed.

Do not add unrelated libraries merely for convenience.

Do not replace requested technologies with alternatives unless compatibility makes that necessary.

If a requested technology cannot realistically work in the Lovable environment:

Do not create a fake implementation.

Use the closest meaningful proof of concept if possible.

Document the limitation and reason in RESULT.MD.

Success Criteria

The project is complete only when:

The application starts and builds successfully.

The primary game UI is polished and functional.

Authentication works or has a clearly documented functional demo path.

JWT-backed authentication is demonstrated.

Supabase PostgreSQL persistence works.

Prisma is meaningfully integrated where compatible.

Relational dummy data loads and persists.

Maps can be switched.

Characters can be dragged.

Character positions persist per map.

Fog of war works and persists per map.

Three.js renders the map/3D figures.

Shader/candle-light effect works.

Story/chapter/mission UI works.

Zustand is used for meaningful application state.

Dark mode switch works.

GM mode works.

Player/passive mode works.

Realtime chat works.

PWA/offline functionality has at least one genuinely working offline feature.

Offline changes can synchronize where implemented.

AI event endpoint works with the mock response provider.

Three-card mechanic works.

Cards animate into the persistent deck.

CSS Grid + Subgrid are meaningfully demonstrated.

Vitest contains tests for resource fetching and Zustand state.

Desktop-only behaviour is implemented.

RESULT.MD accurately documents the implementation and limitations.

No critical security or build errors remain.

Final Validation

Before finishing:

Run the build.

Run the test suite.

Run lint/type validation where configured.

Verify authentication.

Verify database persistence after reload.

Verify map-specific character positions.

Verify fog-of-war persistence.

Verify GM role switching.

Verify realtime chat.

Verify offline behaviour.

Verify AI mock event generation.

Verify card selection/deck animation.

Verify the Three.js rendering and shader effect.

Check for console errors.

Check for obvious accessibility issues.

Check that no secrets are exposed to the client.

Review the implementation against every item in the Success Criteria.

Update RESULT.MD with the actual final state.

Do not leave the application in a partially working state.

___

Fully auto-code it at your own discretion and creativity. No questions to ask, no feedback needed. Build what you can and like, ignore what is impossible (just write it down please), have fun and I am excited to see an amazing result!

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/36109201-1986-4f3c-b358-e9699b8c50e3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
