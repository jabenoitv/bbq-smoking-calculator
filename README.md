# 🔥 BBQ Smoking Calculator

A **web app that calculates BBQ smoking times for perfect crust + red/juicy meat** (not overcooked grey meat).

**Live:** https://bbq-calc.netlify.app

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 What This Does

Instead of cooking BBQ until it's grey and "done," this calculator tells you:

> **"How long to renderize the crust while keeping the meat red/juicy at YOUR chosen temperature?"**

- **Input:** Meat type, weight, smoking temp → Desired red level (55-70°C)
- **Output:** Time to renderization, 3-phase timeline, doneness tips
- **Example:** Brisket 4.5kg @ 110°C
  - Old model: 18-20h to reach 96°C (grey, tough, dry) ❌
  - New model: 5.5h to reach 63°C (red, juicy, perfect bark) ✅

---

## 🧠 The Paradigm Shift

### Traditional BBQ (Doneness-Based)
```
Cook until meat is "done" (high internal temp)
Time goal: Reach 96°C (grey, overcooked)
Result: Safe, but often dry and tough
```

### This Calculator (Renderization-Based)
```
Renderize the crust while keeping meat juicy
Temperature goal: Reach user's desired red level (55-70°C)
Result: Perfect crust + juicy, flavorful interior
```

**Why?** The Maillard reaction (bark/crust) happens fast (~107°C smoker). Keeping the inside red keeps it juicy. You don't need to cook it grey.

---

## 🎛️ Features

### ✅ Dynamic Temperature Ranges
Each cut has its own range. You're not stuck at one temperature:

| Meat | Range | Use Case |
|------|-------|----------|
| **Picaña** | 50-68°C | Raro → Término Medio |
| **Brisket** | 55-80°C | Rojo Frío → Gris Claro |
| **Short Ribs** | 58-82°C | Rojo → Gris |
| **Pork Shoulder** | 55-75°C | Rojo Frío → Gris Claro |
| **Pork Ribs** | 60-76°C | Rosa → Término Medio |
| **Pollo** | 72-74°C | 🔒 Locked (food safety) |

### ✅ Standard Weights (Auto-Filled)
Select a meat → weight auto-fills based on typical cut:

- Brisket: 4.5kg
- Picaña: 2.5kg
- Pork Shoulder: 5.0kg
- Chicken: 1.8kg
- (etc.)

### ✅ Interactive Temperature Slider
- Slider min/max change per meat (not always 55-70°C)
- Poultry locked at food-safe temps
- Beef/Pork let you go from rare to grey
- Real-time calculation as you adjust

### ✅ 3-Phase Cooking Model
Every cook has 3 phases (regardless of meat):

1. **🌳 Bark Formation** (Ramp-up 25→62°C)
   - Fast, exterior gets color
   - ~30-45 min depending on size

2. **⏱️ Stall** (Plateau 62-68°C)
   - Slow, meat tenderizes
   - 30 min to several hours (cut/weight dependent)

3. **🔴 Renderización** (Push 68→Your Desired Red Temp)
   - Fast, crust finishes, meat reaches red level
   - 30 min to 2 hours (temp diff dependent)

### ✅ Smart Wrap Detection
- Wrapping @ 63°C reduces stall ~35%
- App suggests it if stall is predicted to be long
- You choose yes/no

### ✅ Mobile-First Design
- 48px+ touch targets
- Responsive charts & sliders
- Dark theme (easier on eyes during smoke sessions)

---

## 🚀 How to Use

### 1. Select Your Meat
Chose from 8 cuts:
- Brisket, Plateada, Picaña, Short Ribs, Pork Shoulder, Pork Ribs, Chicken, Turkey

Weight auto-fills based on typical cut size.

### 2. Set Smoking Temperature
Enter your smoker's temp (100-130°C typical).

### 3. Choose Red Level (Optional)
Drag the slider to your preferred red-ness:
- **Rojo Frío** (55°C) = Cold red, very juicy
- **Rojo Medio** (60-65°C) = Perfect middle ground
- **Rojo Cálido** (70°C) = Warmer pink, approaching grey

*Poultry can't be customized (food safety locked at 72-75°C)*

### 4. Wrap? (Optional)
Will you wrap the meat in foil @ 63°C to speed up the stall?

### 5. Calculate
Get your 3-phase timeline, estimated total time, and tips.

---

## 📊 Example: Brisket 4.5kg @ 110°C @ 63°C (Red)

```
RAMP-UP:      25°C → 62°C     ~37 min  (bark forms)
STALL:        62°C plateau    ~180 min (terneza)
RENDERIZACIÓN: 68°C → 63°C    ~20 min  (crust finishes)
────────────────────────────────────────────────────
TOTAL:                        ~5.5 hours
```

**Rest:** 60 min wrapped in towel (juice redistribute)

**Result:** Perfect crust, red-pink interior, juicy, tender. Done.

---

## 🛠️ Technical Stack

- **Frontend:** HTML5 + Vanilla JS (no React needed)
- **Styling:** CSS3 (dark theme, responsive, gradient sliders)
- **Deployment:** Netlify (auto-builds from main branch)
- **Data:** All meat formulas in JavaScript (no backend needed)

**No external dependencies.** It's a single-page app that works offline once loaded.

---

## 📱 Project Structure

```
bbq-smoking-calculator/
├── bbq-calculator/
│   ├── index.html           # All-in-one app (HTML + JS + CSS)
│   ├── src/
│   │   ├── components/      # React components (optional, unused currently)
│   │   ├── utils/           # TypeScript utilities
│   │   └── App.tsx          # React wrapper
│   └── vite.config.ts       # Build config
├── CLAUDE.md               # Dev notes for Claude Code
├── README.md               # This file
└── netlify.toml            # Netlify deployment config
```

**Main app:** `bbq-calculator/index.html` (single HTML file, self-contained)

---

## 🔧 Development

### Quick Start

```bash
cd bbq-calculator
npm install
npm run dev         # Starts on http://localhost:3000
```

### Build for Production

```bash
npm run build       # Creates dist/ folder
npm run preview     # Test production build locally
```

### Type Checking

```bash
npx tsc --noEmit    # Strict TypeScript (no emit)
```

---

## 🌍 Deployment

Deployed automatically to **https://bbq-calc.netlify.app** whenever you push to `main` branch.

- **Build command:** `npm run build`
- **Publish dir:** `dist/`
- **Branch:** `main`

---

## 🎓 Cooking Philosophy

This calculator is built around the **BBQtrail Tenderness Index**, a model that recognizes:

1. **Bark formation** is fast (Maillard @ ~107°C smoker temp)
2. **Stall** is the slow part (62-68°C tenderness plateau)
3. **Renderization** = getting the crust done while meat stays juicy
4. **You don't need 96°C internal** for juicy, tender meat (that's overcooked)

The app automates the math so you can focus on monitoring the stall and enjoying the process.

---

## 📝 Meat Formula Structure

Each meat has:

```javascript
{
  name: "Tapapecho (Brisket)",
  desiredRedTempC: 63,        // Target red/juicy temp
  tempRange: { min: 55, max: 80 },  // Your slider range
  standardWeightKg: 4.5,      // Auto-fill weight
  rampUpRate: 0.35,           // °C/min in Phase 1
  stallBaseHours: 4.0,        // Stall duration @ 1kg
  pushUpRate: 0.25,           // °C/min in Phase 3
  wrapDecisionTempC: 63,      // Wrap at this temp
  holdingMin: 60              // Rest time minutes
}
```

---

## 🐛 Troubleshooting

### "Why does my time seem short?"
Because you're targeting red (63°C), not grey (96°C). That's the whole point! The crust is done, the meat is juicy. Stop there.

### "Can I go higher than the slider allows?"
For beef/pork: drag the slider! It goes up to 80°C. For poultry: no, it's locked at 72-75°C for food safety.

### "What if my actual time differs?"
This assumes even heat distribution. Real stalls vary by:
- Exact smoker placement (hot/cold spots)
- Ambient temperature (cold days = longer cooks)
- Smoke density & wood type

**Always trust the thermometer, not just time.**

---

## 📚 Learn More

- [CLAUDE.md](./CLAUDE.md) — Developer guide & architecture
- [bbq-calculator/index.html](./bbq-calculator/index.html) — Source code (all in one file)

---

## 🤝 Contributing

Have a cut of meat or recipe to add? Found a better formula?

Contact: jabenoitv@gmail.com

---

## 📄 License

MIT

---

**Happy smoking! 🔥🥩**
