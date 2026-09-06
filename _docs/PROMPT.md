# D&D Realtime Map — POC

One-off prompt to generate it all.

---

## Lovable Prompt — D&D Vibe Coding Tech Demo

### Goal

Initialize a fully working **desktop-only D&D Game Master application** whose primary purpose is to demonstrate the complete requested technology stack in one coherent product.

The app should feel like a polished, modern fantasy PC game interface rather than a generic SaaS dashboard.

Use a dark, atmospheric visual language inspired by classic PC RPG interfaces such as _Diablo II_:

- Refined fantasy aesthetics
- Rich but restrained colors
- Gradients and shadows
- Subtle glow
- Depth
- Soft animations
- Strong visual hierarchy

Avoid:

- Sci-fi UI
- Generic SaaS dashboard aesthetics

### Story Premise

The application is a D&D scenario with a hidden twist:

> Players initially believe they are in a medieval fantasy world, but gradually discover that it is actually a forgotten post-apocalyptic world where magic and technology coexist.

The **map is the primary UI focus**. Supporting story, characters, chat, and game mechanics live around it.

## Core Product

### 1. Map

Create a large, top-down game map area.

- World
- City
- Dungeon

Use generated SVG/mock maps or safe placeholder assets.

- GM can switch between maps.
- Each character has an independent position on every map.
- Characters can be freely dragged using a modern drag-and-drop library.
- Character positions persist per map.
  Add a simple configurable grid:

- Squares or hexagons
- Grid should be integrated naturally into the map UI

#### Fog of War

Implement fog of war:

- GM can see the complete map.
- Players see unexplored areas darkened.
- Previously discovered areas remain permanently revealed.
- Fog/discovery state persists independently for each map.

#### Lighting

Add a subtle candle/light effect following the GM's mouse cursor.

#### Characters on the Map

Characters should visually resemble small 3D tabletop figures.

### 2. Characters

Show characters around/on the map.
Clicking a character opens its details:

- Name
- Portrait/model
- HP/stat information
- Inventory
- Temporary buffs/debuffs

---

### 3. Story

Provide a story sidebar containing editable GM text.

Display:

- Current chapter
- Current mission
- Mission progress
- Story text
- Recent magical events/cards

The GM can edit story content and save it.

---

### 4. Card Mechanic

When a magical event is generated:

1. Generate/display three random cards.
2. Each card contains:
   - Short story effect
   - Random icon
   - Random but harmonious color/theme
3. GM selects a card.
4. The selected card is added to the story.
5. The card visually flies/moves into a small persistent deck.
6. The deck remains available for the rest of the game.

Do not implement complicated automatic card-game rules.

Create a GM-only interaction for a magical dice roll.

The GM can:

- Enter an optional short prompt.
- Click a button such as **Roll the Fate Dice**.

#### Behaviour

- Generate a random event/dice result.

Structure the implementation so an **OpenAI-compatible endpoint** can be plugged in later.

Therefore:

- Use approximately 10 high-quality predefined mock AI responses.
- Make the mock layer explicit and replaceable.
- The response should influence the story.
- The response should trigger the three-card mechanic.

---

### 6. Authentication

Demonstrate working authentication.

#### Preferred Approach

- OAuth using a free/common provider where supported.
- Use Supabase Auth where practical.
- Use JWT-based authenticated sessions.
- Include authenticated/unauthenticated handling.

#### Authorization

Privileged GM actions must be authorized **server-side**.

Do not rely on hiding UI controls as authorization.

If OAuth/JWT requirements overlap because the chosen authentication provider already uses JWT-backed sessions, use the real provider architecture rather than implementing a redundant second authentication system.

Use dummy/demo configuration where external credentials are required and clearly document setup requirements.

Create realistic relational data for at least:

- Items
- Story/chapter/mission data
- Cards
- Chat messages

- Relationships
- CRUD
- Persistence
- Server-side validation
- Appropriate database constraints

Do not duplicate database access unnecessarily between Supabase client APIs and Prisma.

Use:

### 8. State Management

Use **Zustand** for meaningful client state.

Demonstrate it with actual application state such as:

- Active map
- Selected character
- Map UI state
- GM/player mode
- Dark mode
- Selected card
- Temporary UI state

Include a working dark-mode switcher while keeping dark mode as the default.

Do not put all server/database state into Zustand unnecessarily.

Implement realtime communication.

All demo users can use the same game/session URL.

Include a simple open chat:

- Send messages
- All connected users see the same chat
- Persist messages where practical

Use a **Node.js native WebSocket implementation** where the environment supports it.

If the Lovable runtime/deployment environment cannot provide a persistent native WebSocket server:

- Implement the closest functional compatible approach.
- Document the limitation in `RESULT.MD`.

### 10. GM Mode

#### Behaviour

- Any authenticated player can claim the GM role.

#### GM Can

- Edit story
- Generate AI events
- Select cards

#### Other Players

- Cannot control GM-only actions.

### 11. Offline / PWA

Implement a real PWA demonstration.

#### Requirements

- Service worker/web worker as appropriate.
- Cache at least one useful application resource.
- Demonstrate offline detection/state.
- Allow a limited set of core GM work to continue offline.
- At minimum, offline story editing and/or map-position changes should persist locally.

The offline implementation should be realistic and limited in scope.

---

## UI / CSS Technology Demonstrations

Use:

The interface should be:

- Desktop-only
- Excellent spacing
- Professional typography
- Serif + sans-serif pairing where appropriate

### Avoid

- Excessive glassmorphism
- Cyberpunk neon
- Excessive gradients
- Huge decorative elements
- Poor readability

### Mobile / Tablet

## Three.js

Use **Three.js meaningfully**.

- Basic lighting
- At least one shader effect
- Mouse-following candle/light effect
- Appropriate camera and rendering setup

- Simple procedural geometry
- Placeholder 3D assets
- Safe external assets where appropriate

Keep rendering performant.

Do not build unnecessary:

Include:

- Several maps
- Items
- Character stats
- Inventory
- Story chapters
- Missions
- Cards
- Chat messages
- Fog/discovery state

Content should hint at the hidden technology/post-apocalypse twist without revealing it immediately.

---

Provide at least two meaningful demonstrations:

1. Resource/data fetching behaviour
2. Zustand state management behaviour

Tests should verify actual application behaviour rather than implementation details.

Keep tests:

Keep the architecture simple and feature-oriented.

Separate:

- UI/components
- Domain/application logic
- Client state
- Server/API logic
- Database access
- Realtime
- Authentication

Follow:

- DRY
- SRP
- High cohesion
- Low coupling
- Explicit naming
- No dead code
- No unnecessary wrappers
- Technologies actually implemented
- Where each requested technology is demonstrated
- Authentication architecture
- Database architecture
- Realtime architecture
- Technologies that could not be integrated
- What would be required to implement it in a production deployment

Do not claim a technology is implemented if it is only mocked or superficially referenced.

Clearly distinguish:

- **Fully implemented**
- **Functional proof of concept**
- **Mocked**
- Prevent XSS.
- Avoid unsafe HTML injection.
- Protect state-changing operations against CSRF where applicable.
- Keep secrets server-side.
- Never expose service-role/database credentials.

### Maintainability

Follow clean-code and maintainability principles:

- Clear separation of concerns

### Accessibility

Ensure:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Appropriate labels
- Sufficient contrast
- ARIA only where necessary

---

## Implementation Rules

### Before Implementation

1. Inspect the generated project structure and available Lovable/runtime capabilities.
2. Identify which requested technologies are actually compatible.
3. Decide the smallest architecture that can demonstrate the full stack.
4. Implement incrementally.
5. Validate each major feature before moving on.
6. Keep the application runnable throughout development.

Because this is a new project initialization, installing dependencies required by the explicitly requested stack is allowed.
Do not add unrelated libraries merely for convenience.

Do not replace requested technologies with alternatives unless compatibility makes that necessary.

### Incompatible Technologies

If a requested technology cannot realistically work in the Lovable environment: 3. Document the limitation and reason in `RESULT.MD`.

---

The project is complete only when:

### Application

### Authentication & Authorization

- [ ] Supabase PostgreSQL persistence works.
- [ ] Prisma is meaningfully integrated where compatible.
- [ ] Relational dummy data loads and persists.
- [ ] Maps can be switched.
- [ ] Characters can be dragged.
- [ ] Character positions persist per map.

### Story & Cards

- [ ] Cards animate into the persistent deck.

### State & UI

- [ ] Dark-mode switch works.
- [ ] CSS Grid + Subgrid are meaningfully demonstrated.

- [ ] GM mode works.
- [ ] Player/passive mode works.
- [ ] Realtime chat works.

- [ ] Offline changes can synchronize where implemented.

### Testing

- [ ] Vitest contains tests for resource fetching.
- [ ] Vitest contains tests for Zustand state.

### Documentation & Quality

- [ ] `RESULT.MD` accurately documents the implementation and limitations.
- [ ] No critical security or build errors remain.

---

## Final Validation

Before finishing:

1. Run the build.
2. Run the test suite.
3. Run lint/type validation where configured.
4. Verify authentication.
5. Verify database persistence after reload.
6. Verify map-specific character positions.
7. Verify fog-of-war persistence.
8. Verify realtime chat.
9. Verify offline behaviour.
10. Verify AI mock event generation.
11. Verify card selection/deck animation.
12. Verify Three.js rendering and shader effect.
13. Check for console errors.
14. Check for obvious accessibility issues.
15. Check that no secrets are exposed to the client.
16. Review the implementation against every item in the Success Criteria.
17. Update `RESULT.MD` with the actual final state.
18. Do not leave the application in a partially working state.

---

## Execution

Fully auto-code it at your own discretion and creativity.

**No questions to ask. No feedback needed.**

## Build what you can and like. Ignore what is impossible, but document it clearly in `RESULT.MD`.

## Lovable

This project was built with [Lovable](https://lovable.dev).

### Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/36109201-1986-4f3c-b358-e9699b8c50e3).

- **Ship faster** — Describe what you want to build and Lovable handles the code.
- **Stay in sync** — Every change made in Lovable is committed straight to this repository.
- **Full ownership** — This code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

### Development

Prefer working locally?

You need Node.js and npm. Install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>

npm i
npm run dev
```
