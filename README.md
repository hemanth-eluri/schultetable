# Schulte Table

A clean, distraction-free Schulte table web application designed for peripheral vision expansion, speed reading practice, and mental focus training.

## Features

- **Grid Sizes (3×3 to 7×7)**: Switch between 3×3 (9 numbers), 4×4 (16 numbers), 5×5 (25 numbers), 6×6 (36 numbers), and 7×7 (49 numbers).
- **Fisher-Yates Randomization**: Grid numbers are randomly shuffled using the Fisher-Yates algorithm upon every new game or size change.
- **Accurate Timer**: Timer starts automatically on the first correct tap (`1`) using monotonic `performance.now()` to ensure zero drift.
- **Sequential Gameplay**: Find and tap numbers in ascending order. Correct taps get a subtle blue accent highlight; wrong taps do nothing.
- **Best Record Tracking**: Local personal best times are tracked and persisted in `localStorage` individually for each grid size, indicating when a new record is achieved.
- **Accessibility & Keyboard Navigation**: Full ARIA grid semantics, live regions that avoid screen reader spam, and keyboard support (Arrow keys, Home, End, Space, Enter) with high-contrast focus rings.
- **Mobile-First Design**: Optimized for touchscreens with disabled double-tap zoom, prevented text selection, large tap targets, and crisp 1px borders.
- **Minimalist Aesthetic**: Pure white background, black text, single blue accent, system-ui typography, no gradients, no shadows, and no decorative animations.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Compile and bundle the project for production:

```bash
npm run build
```

The output will be generated in the `dist` directory.

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

### Type Checking & Linting

Run TypeScript validation:

```bash
npm run lint
```

## How to Practice

1. Focus your gaze on the center square of the table.
2. Without moving your eyes across the grid, use your peripheral vision to find each number in ascending order (starting with 1).
3. Tap or click each number as you locate it.
4. Try to improve your reaction speed and peripheral awareness with consistent daily practice.
