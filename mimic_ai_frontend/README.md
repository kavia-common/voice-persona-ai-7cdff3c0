# Mimic.AI-M1 Frontend (React)

A modern, minimalistic web UI for Mimic.AI-M1. It provides:
- Real-time voice input/output (browser speech recognition + TTS fallback)
- Persona-simulated, adaptive chat experience (stubs for backend LLM)
- Emotion analytics and behavioral insights dashboard
- User profile management modal
- Voice setup and cloning modal with enrollment flow (stubbed)

Color palette:
- Primary: `#2F80ED`
- Secondary: `#6C63FF`
- Accent: `#21E6C1`
Theme: light (with dark mode toggle for UI preview)

## Quick Start

- Install: `npm install`
- Run dev server: `npm start` (http://localhost:3000)
- Tests: `npm test`
- Production build: `npm run build`

## Environment Variables

Copy `.env.example` to `.env` and set values:
- `REACT_APP_API_BASE_URL`: Base URL of backend REST APIs
- `REACT_APP_SITE_URL`: Public site URL for email link redirects (if needed)

Note: Do not commit secrets. The orchestrator configures the actual `.env`.

## Project Structure

- `src/App.js`: Main dashboard layout (sidebar, chat pane, analytics, behavior cards, modals)
- `src/components/ChatPane.*`: Conversation UI, voice input, playback, persona+emotion reply stub
- `src/components/EmotionAnalytics.*`: Graph-style bars for emotion scores
- `src/components/BehaviorSummary.*`: Summary cards for behavior KPIs
- `src/components/VoiceSetupModal.*`: Voice recording and stubbed enrollment
- `src/components/UserProfile.*`: Modal to view/edit user profile
- `src/services/api.js`: Integration-ready API client stubs reading env vars

## Integration Points (REST APIs)

The app is wired with stubs to simplify backend integration:
- User profile:
  - `getCurrentUser()`
  - `updateUserProfile(patch)`
- Chat:
  - `sendChatMessage(history, userText, context)`
- Voice:
  - `enrollVoiceSample(formData)`
  - `synthesizeTTS(enrollmentId, text)`
- Insights:
  - `getBehaviorInsights()`

Update these in `src/services/api.js` to call your backend:
- Base URL: `REACT_APP_API_BASE_URL`
- Endpoints are grouped: `/user`, `/chat`, `/voice`, `/insights`

## Layout

- Sidebar navigation: profile, voice setup, docs link, theme toggle
- Main content:
  - Left: real-time conversation pane
  - Right: emotion analysis + behavior summary cards
- Modals: voice setup cloning, user profile edit

## Notes

- Voice input uses Web Speech API (browser support varies).
- TTS uses system speech synthesis for fallback; replace with backend TTS in `api.js` when available.
- Components are written with no heavy UI framework, using CSS only.

Learn React: https://react.dev/
