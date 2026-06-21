# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

The main application is in the `bbq-calculator/` directory. It's a React 18 + TypeScript + Vite SPA for calculating BBQ smoking times.

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

### Paradigm: Renderization vs Temperature

**Important:** This calculator uses a **RED/JUICY paradigm**, not traditional doneness levels.

- **Old Model (Obsolete):** Cook until grey/overcooked (96°C for brisket)
- **New Model (Active):** Renderize the crust while keeping meat red/juicy (55-70°C)

The app targets the **Maillard reaction (crust)** at optimal low internal temps, not full meat doneness. Users choose how red they want their meat, and the calculator computes time to reach that renderization point—not time to cook through.

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

**Calculation Engine (index.html BBQEngine class):**
- `getMeatFormulas()`: Dictionary of 8 meat types, each with:
  - `desiredRedTempC`: Target red/juicy internal temp (55-70°C, except poultry 72-75°C)
  - `tempRange`: {min, max} dynamic range per cut (e.g., Brisket 55-80°C, Picaña 50-68°C)
  - `standardWeightKg`: Typical cut weight (auto-populated in UI)
  - `rampUpRate`, `stallBaseHours`, `pushUpRate`: 3-phase cooking model params
  - `holdingMin`: Resting time in minutes
- `calculateCookingWithTenderness()`: Takes meat, weight, smoking temp, user-selected desired temp (optional) → returns `CookingResult`
  - **Phase 1 (Ramp-up):** 25°C → 62°C (bark formation, ~37 min)
  - **Phase 2 (Stall):** 62-68°C (tenderness plateau, ~1-4 hours depending on cut)
  - **Phase 3 (Renderización):** 68°C → user's desired red temp (crust while keeping meat red)
- `celsiusToFahrenheit()` / `fahrenheitToCelsius()`: Unit conversion helpers
- Temperature progression: Divides 25°C → desired temp into 8 visual stages for charts

**UI Component (Wizard 4-Step):**
- **Step 1:** Select meat type → auto-updates temp range slider + weight
- **Step 2:** Enter weight (kg/lbs toggle)
- **Step 3:** Set smoking temperature + **[NEW] choose desired red level** (55-70°C slider, dynamic range per cut)
- **Step 4:** Wrap? (Yes/No) → Calculate
- **Results:** Shows time to renderization, target red temp, 3 phases, timeline, tips

**Dynamic Temperature Selector (Phase 4):**
- Slider min/max update based on selected meat type
- Poultry (Chicken/Turkey) locked at 72-74°C and 73-75°C (food-safety guardrails)
- Beef/Pork allow full range (50-82°C spectrum across all cuts)
- User selection stored as `calculator.userDesiredRedTemp`
- Calculation uses `userDesiredRedTemp` if set, else `formula.desiredRedTempC`

**Styling:**
- CSS in index.html (inline styles)
- Dark theme: --primary #e25822 (burnt orange), --text #f5ebe0
- Responsive: Mobile-first, 48px+ touch targets
- Gradient sliders, collapsible sections, progress indicators

### Data Flow

1. **User selects meat** → `updateTempSelector()` fires
   - Slider min/max set to cut's range (e.g., 55-80 for brisket)
   - Weight input pre-filled (e.g., 4.5kg for brisket)
   - Temperature state label ("Rojo Frío/Medio/Cálido") updates
2. **User adjusts temp slider** (optional) → `userDesiredRedTemp` stored
3. **Click "Calcular"** → `calculateCookingWithTenderness()` called with:
   - meatType, weight, smokingTemp
   - userDesiredRedTemp (if user customized)
4. **Calculation:**
   - Phase 1: Ramp-up time to 62°C
   - Phase 2: Stall duration (based on cut, weight, smoking temp)
   - Phase 3: Push time to desired red temp (not grey!)
   - Total = Phase 1 + Phase 2 + Phase 3
5. **Results display:**
   - Shows target red temp with "🔴 Temp. Rojo/Jugoso" label
   - "personalizado" badge if user customized temp
   - Graph scales 0-100% from 25°C → desired temp (not 96°C!)
   - Timeline with Bark → Stall → Renderización phases
   - Tips emphasize stopping at red, not overcooking

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

## Notes & Implementation Status

### ✅ Completed Features (Phases 1-4)

**Phase 1: Data Layer (Paradigm Shift)**
- ✅ Replaced `optimalTempC` (96°C grey) with `desiredRedTempC` (55-70°C red)
- ✅ All 8 meats have red/juicy target temps
- ✅ Poultry locked at food-safe temps (72-75°C)

**Phase 2: Calculation Engine**
- ✅ `calculateCookingWithTenderness()` targets red temps
- ✅ Phase 3 renamed "Renderización" (crust while keeping meat red)
- ✅ Time calculation is now to renderization point, not grey doneness
- ✅ Example: Brisket 3kg @ 110°C = 5.5h to red (was 18-20h to grey)

**Phase 3: Display & UI**
- ✅ "🔴 Temp. Rojo/Jugoso" card replaces "Temp. Objetivo"
- ✅ **Fixed inverted graph scales** (now 25°C → 63°C, not 25°C → 96°C)
- ✅ Tips section emphasizes renderization ("¡RETIRA AQUÍ!")
- ✅ Dynamic graph endpoints based on desired temp

**Phase 4: Optional Temperature Selector**
- ✅ Dynamic slider per cut (50-82°C spectrum)
- ✅ Standard weights auto-populated per meat type
- ✅ Poultry locked with food-safety warnings
- ✅ Real-time calculation updates as user adjusts
- ✅ "personalizado" badge when user customizes temp

### 📋 Future Enhancements

- [ ] **Temperature memory:** Save user's preferred temps per cut to localStorage
- [ ] **Multiple smoker presets:** Store user's favorite smoker temps/wrapping combos
- [ ] **Advanced stall detection:** Predict stall onset and suggest wrapping at optimal time
- [ ] **Mobile app version:** React Native for iOS/Android with offline support
- [ ] **Real-time thermometer sync:** Bluetooth integration with meat thermometers
- [ ] **Historical cooking data:** Track past cooks, compare actuals vs estimates
- [ ] **Recipe sharing:** Export/import cooking profiles as JSON/QR codes
- [ ] **Internationalization:** Spanish, Portuguese, French, German support
- [ ] **Curing calculator enhancements:** Expand from Bacon/Pastrami to 10+ brines

### 🐛 Known Issues / Limitations

- None currently. All core features stable.
