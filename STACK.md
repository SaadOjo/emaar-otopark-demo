# Emaar Otopark Demo — Stack Decision

## Candidate Tracker findings

- React + TypeScript + Vite single-page app.
- React Router handles pages/routes.
- `lucide-react` is used for icons.
- Plain CSS is used for styling; no UI framework.
- Data access goes through a repository interface.
- Mock data is isolated under `src/data/mock/`.
- Product types live under `src/domain/`.
- Screens are grouped by feature under `src/features/`.
- Reusable UI/layout components live under `src/components/`.
- Demo-only state uses component state and `localStorage`.
- No backend, database, auth service, or external integrations in the prototype.

## Stack to use for this demo

Use the same stack/pattern:

- React 19
- TypeScript
- Vite
- React Router
- lucide-react
- Plain CSS
- Mock repository layer
- Browser `localStorage` only for small demo interactions

## Do not add for the first demo

- Backend/API server
- Database
- Auth provider
- Next.js
- Tailwind/MUI/shadcn
- Redux/Zustand
- Real parking hardware/payment integrations
- Map SDK unless the demo explicitly needs it

## Project structure

```txt
src/
  App.tsx
  main.tsx
  styles/
    app.css
  domain/
    types.ts
    labels.ts
  data/
    repository.ts
    repositories/
      otoparkRepository.ts
    mock/
      mockData.ts
      mockOtoparkRepository.ts
  components/
    layout/
    ui/
  features/
    locations/
    parking/
    vehicles/
    validations/
    reports/
```

## Repository pattern

All screens should read data through `src/data/repository.ts` only.

Start with a mock implementation:

```txt
src/data/repositories/otoparkRepository.ts
src/data/mock/mockOtoparkRepository.ts
src/data/mock/mockData.ts
src/data/repository.ts
```

If a backend is added later, implement the same repository interface and swap the export in `src/data/repository.ts`.

## Initial routes

```txt
/                         -> redirect to /locations
/locations                -> parking locations/projects list
/locations/:locationId    -> location operations dashboard
/locations/:locationId/sessions
/locations/:locationId/sessions/:sessionId
/validations
/reports
```

## NPM scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## Decision

Build this as a frontend-only clickable demo first. Keep the architecture backend-ready through the repository interface, but do not implement backend concerns until the demo workflow is validated.
