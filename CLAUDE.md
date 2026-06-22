# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

The main application is in the `bbq-calculator/` directory. It's a React 18 + TypeScript + Vite SPA for calculating BBQ smoking times.

> **📍 Empieza por aquí si vas a editar:** lee primero estos dos documentos, que explican el estado real y dónde está cada cosa:
> - `bbq-calculator/MAPA_CONCEPTUAL.md` — overview + diagramas (capas, flujo de datos, mapa de archivos, reglas para editar)
> - `bbq-calculator/MODULAR_ARCHITECTURE.md` — referencia detallada módulo por módulo (13 módulos, 240 tests)
>
> **Importante:** existe un refactor modular completo (Fases 1-4) en `src/{core,viz,state,ui}/` con estrategia de "módulo congelado" (un módulo testeado no se vuelve a tocar; nueva funcionalidad = módulo nuevo). El `index.html` monolítico sigue en producción hasta que el orquestador `App.integrated.js` (M13) se cablee. No dupliques lógica que ya viva en un módulo Core.

### Common Commands

**Development:**
```bash
cd bbq-calculator
npm install
npm run dev         # Start dev server on port 3000 (opens automatically)
```

**Building:**
```bash
npm run build       # TypeScript compile + Vite bundle → dist/
npm run preview     # Preview production build locally
```

**Linting & Type Checking:**
```bash
npx tsc --noEmit    # Type check without emitting (strict mode enabled)
```

## Architecture

### Project Structure

```
bbq-calculator/
├── src/
│   ├── components/
│   │   └── BBQCalculator.tsx    # Main component: input form, calculations, results display
│   │   └── BBQCalculator.css    # Component styles (dark theme)
│   ├── utils/
│   │   └── bbqFormulas.ts       # Core logic: meat formulas, temp conversions, calculations
│   ├── App.tsx                  # Root component (wraps BBQCalculator)
│   ├── App.css                  # App-level styles
│   └── main.tsx                 # React DOM entry point
├── index.html                   # Standalone static HTML (self-contained, no build needed)
├── vite.config.ts              # Vite config with React plugin, dev port 3000
├── tsconfig.json               # Strict TypeScript settings, target ES2020
└── package.json                # Dependencies: React 18, Vite, TypeScript
```

### Key Concepts

**Calculation Engine (`bbqFormulas.ts`):**
- `MEAT_FORMULAS`: Dictionary of meat types with cooking ratios (hours per pound/kg), internal temps, and holding durations
- `calculateCookingTime()`: Main function that takes meat type, weight, unit, and smoking temp → returns `CookingResult` with estimated cooking time, internal temps, and temperature progression stages
- `celsiusToFahrenheit()` / `fahrenheitToCelsius()`: Unit conversion helpers
- Temperature progression: Divides the range from min to optimal internal temp into stages ("Cociendo" → "Cocimiento avanzado" → "Casi listo" → "Listo")

**UI Component (`BBQCalculator.tsx`):**
- State: meatType, weight, isKg (unit toggle), tempUnit, smokingTemp
- User selects meat, enters weight/temp, clicks "Calcular"
- On calculate: converts units if needed, calls `calculateCookingTime()`, displays results
- Results show: estimated cooking time (hours/minutes), internal temp ranges, holding time recommendations

**Styling:**
- CSS modules (`.css` files imported as scoped styles)
- Dark theme with gradients
- Responsive design (works on mobile and desktop)

### Data Flow

1. User inputs meat type, weight, temp → state updates
2. Click "Calcular" → `handleCalculate()`
3. Convert units to standard (°F, lbs) → call `calculateCookingTime()`
4. Receive `CookingResult` → set state → re-render results section

## Build & Deployment

- **Build Tool:** Vite (fast ESM-based bundler)
- **Target:** ES2020 (modern browsers)
- **Output:** `dist/` folder (ready for static hosting)
- **Deployment:** Netlify (see `DEPLOYMENT.md` for detailed instructions)
  - Base directory: `bbq-calculator/`
  - Build command: `npm run build`
  - Publish directory: `dist/`
- **Alt Deployment:** Static `index.html` (standalone, no build needed)

## Type Safety

TypeScript strict mode enabled (`tsconfig.json`):
- `noImplicitAny`: true
- `strictNullChecks`: true
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noImplicitReturns`: true

Custom types defined in `bbqFormulas.ts`:
- `MeatType`: union of meat values (`'brisket' | 'pork_butt' | ...`)
- `MeatFormula`: structure for meat cooking metadata
- `CookingResult`: structure for calculation output

## Testing

No test suite currently configured. To add tests:
- Install: `npm install --save-dev vitest @testing-library/react`
- Create `.test.tsx` files alongside components
- Run: `npm run test`

## Notes for Future Work

- **Curing features:** Recent commits added curing calculators (Pastrami, Corned Beef, Bacon) in separate components — integrate with main calculator if needed
- **UI improvements:** Recent refactor added dark theme, tabs, and curing tracker — ensure consistency when adding features
- **Temperature adjustment formula:** Currently uses `(smokingTempF - 225) / 25` ratio — may need refinement based on user feedback
- **Offline support:** App uses browser storage (localStorage) for persistence
