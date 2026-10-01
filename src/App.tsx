/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZES = [3, 4, 5, 6, 7] as const;
type GridSize = (typeof GRID_SIZES)[number];

function shuffleNumbers(size: number): number[] {
  // Fisher-Yates shuffle of numbers 1 to (size * size)
  const total = size * size;
  const array = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    const secStr = seconds < 10 ? `0${seconds.toFixed(2)}` : seconds.toFixed(2);
    return `${minutes}:${secStr}s`;
  }
  return `${seconds.toFixed(2)}s`;
}

function getBestTimeKey(size: number): string {
  return `schulte_best_time_${size}x${size}_ms`;
}

function getCellFontSize(size: number): string {
  switch (size) {
    case 3:
      return 'text-3xl sm:text-4xl';
    case 4:
      return 'text-2xl sm:text-3xl';
    case 5:
      return 'text-xl sm:text-2xl';
    case 6:
      return 'text-base sm:text-lg';
    case 7:
      return 'text-sm sm:text-base';
    default:
      return 'text-xl';
  }
}

export default function App() {
  const [gridSize, setGridSize] = useState<GridSize>(5);
  const totalNumbers = gridSize * gridSize;

  const [grid, setGrid] = useState<number[]>(() => shuffleNumbers(5));
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const [bestTime, setBestTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(getBestTimeKey(5));
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  // Precise timing refs to eliminate timer drift and closure lag
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const nextNumberRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // References for keyboard grid navigation
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const newGameBtnRef = useRef<HTMLButtonElement | null>(null);

  // High-precision timer loop using performance.now and requestAnimationFrame
  useEffect(() => {
    const tick = () => {
      if (startTimeRef.current !== null && !isFinishedRef.current) {
        setElapsedMs(performance.now() - startTimeRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (startTimeRef.current !== null && !isFinished) {
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isFinished]);

  // Focus completion button when game ends
  useEffect(() => {
    if (isFinished && newGameBtnRef.current) {
      newGameBtnRef.current.focus();
    }
  }, [isFinished]);

  const startNewGame = useCallback((size: GridSize = gridSize) => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    startTimeRef.current = null;
    isFinishedRef.current = false;
    nextNumberRef.current = 1;

    setGrid(shuffleNumbers(size));
    setNextNumber(1);
    setElapsedMs(0);
    setIsFinished(false);
    setIsNewRecord(false);

    try {
      const saved = localStorage.getItem(getBestTimeKey(size));
      setBestTime(saved ? Number(saved) : null);
    } catch {
      setBestTime(null);
    }
  }, [gridSize]);

  const handleGridSizeChange = (newSize: GridSize) => {
    if (newSize === gridSize) return;
    setGridSize(newSize);
    startNewGame(newSize);
  };

  const handleCellClick = (val: number) => {
    // Prevent any tap processing after game ends or if cell is already completed
    if (isFinishedRef.current || nextNumberRef.current > totalNumbers) return;

    if (val === nextNumberRef.current) {
      // First tap starts the timer with high-precision performance.now()
      if (val === 1) {
        const now = performance.now();
        startTimeRef.current = now;
        nextNumberRef.current = 2;
        setNextNumber(2);
        setElapsedMs(0);

        if (animFrameRef.current === null) {
          const tick = () => {
            if (startTimeRef.current !== null && !isFinishedRef.current) {
              setElapsedMs(performance.now() - startTimeRef.current);
              animFrameRef.current = requestAnimationFrame(tick);
            }
          };
          animFrameRef.current = requestAnimationFrame(tick);
        }
      } else if (val === totalNumbers) {
        // Synchronously seal the game state to block any concurrent taps
        isFinishedRef.current = true;
        nextNumberRef.current = totalNumbers + 1;

        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }

        const finalTime = performance.now() - (startTimeRef.current ?? performance.now());
        setElapsedMs(finalTime);
        setIsFinished(true);
        setNextNumber(totalNumbers + 1);

        // Check and record best time for this specific grid size
        let currentBest: number | null = null;
        try {
          const saved = localStorage.getItem(getBestTimeKey(gridSize));
          currentBest = saved ? Number(saved) : null;
        } catch {
          currentBest = bestTime;
        }

        const isRecord = currentBest === null || finalTime < currentBest;
        setIsNewRecord(isRecord);

        if (isRecord) {
          setBestTime(finalTime);
          try {
            localStorage.setItem(getBestTimeKey(gridSize), String(finalTime));
          } catch {
            // Ignore storage errors
          }
        }
      } else {
        const next = val + 1;
        nextNumberRef.current = next;
        setNextNumber(next);
      }
    }
    // Wrong taps do nothing
  };

  // Keyboard navigation for grid (Arrow keys, Home, End)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
        if (index < totalNumbers - 1) targetIndex = index + 1;
        break;
      case 'ArrowLeft':
        if (index > 0) targetIndex = index - 1;
        break;
      case 'ArrowDown':
        if (index + gridSize < totalNumbers) targetIndex = index + gridSize;
        break;
      case 'ArrowUp':
        if (index - gridSize >= 0) targetIndex = index - gridSize;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = totalNumbers - 1;
        break;
      default:
        return;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      cellRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-between p-4 sm:p-6 select-none touch-manipulation">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Header */}
        <header className="w-full border-b border-black pb-3 mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Schulte Table</h1>
            <p className="text-xs text-neutral-600 mt-0.5">{gridSize}×{gridSize} Speed Training</p>
          </div>
          <button
            onClick={() => startNewGame(gridSize)}
            type="button"
            aria-label="Start new game"
            className="px-3 py-1.5 text-sm border border-black bg-white hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-colors cursor-pointer"
          >
            New game
          </button>
        </header>

        {/* Grid size selector */}
        <div className="w-full flex items-center justify-between border border-black p-2 mb-3">
          <span className="text-xs uppercase tracking-wider text-neutral-600 font-medium">
            Grid Size
          </span>
          <div
            className="flex border border-black divide-x divide-black bg-white"
            role="radiogroup"
            aria-label="Select table grid size"
          >
            {GRID_SIZES.map((size) => {
              const isSelected = size === gridSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleGridSizeChange(size)}
                  className={`
                    px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 focus-visible:z-10
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-black hover:bg-neutral-100 active:bg-neutral-200'
                    }
                  `}
                >
                  {size}×{size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="w-full grid grid-cols-2 gap-2 border border-black p-3 mb-3 text-center">
          <div
            className="flex flex-col items-center justify-center border-r border-neutral-300"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-xs uppercase tracking-wider text-neutral-600">Next</span>
            <span
              className="text-2xl font-semibold text-blue-600"
              aria-label={isFinished ? 'Completed' : `Next number to find: ${nextNumber}`}
            >
              {isFinished ? '—' : nextNumber}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wider text-neutral-600">Time</span>
            <span
              className="text-2xl font-mono font-medium"
              aria-live="off"
              aria-label={`Elapsed time: ${formatElapsed(elapsedMs)}`}
            >
              {formatElapsed(elapsedMs)}
            </span>
            {/* Best time display directly under the timer */}
            <div className="text-[11px] font-mono mt-0.5 flex items-center justify-center gap-1">
              <span className="text-neutral-500">Best:</span>
              <span className={isNewRecord ? 'text-blue-600 font-semibold' : 'text-neutral-700'}>
                {bestTime !== null ? formatElapsed(bestTime) : '—'}
              </span>
              {isNewRecord && (
                <span className="text-blue-600 font-semibold uppercase text-[10px] tracking-tight">
                  New!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion Announcement */}
        {isFinished && (
          <div
            role="status"
            aria-live="polite"
            className={`w-full border p-4 mb-3 text-center ${
              isNewRecord ? 'border-blue-600 bg-blue-50' : 'border-black bg-neutral-50'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-neutral-600 font-semibold mb-1">
              Table Completed ({gridSize}×{gridSize})
            </div>
            <div className="text-2xl font-semibold text-black mb-1">
              Final Time: {formatElapsed(elapsedMs)}
            </div>
            {isNewRecord ? (
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-3">
                New Record for {gridSize}×{gridSize}!
              </div>
            ) : (
              <div className="text-xs text-neutral-600 mb-3">
                Best Record: {bestTime !== null ? formatElapsed(bestTime) : '—'}
              </div>
            )}
            <button
              ref={newGameBtnRef}
              onClick={() => startNewGame(gridSize)}
              type="button"
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-colors cursor-pointer"
            >
              New game
            </button>
          </div>
        )}

        {/* Dynamic Schulte Grid */}
        <main
          role="grid"
          aria-label={`${gridSize} by ${gridSize} Schulte Table`}
          aria-readonly={isFinished}
          onDoubleClick={(e) => e.preventDefault()}
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          className="w-full aspect-square grid border-t border-l border-black bg-white touch-manipulation"
        >
          {grid.map((num, idx) => {
            const isCompletedCell = num < nextNumber;
            const isTarget = num === nextNumber;

            return (
              <button
                key={`${gridSize}-${num}`}
                ref={(el) => {
                  cellRefs.current[idx] = el;
                }}
                type="button"
                role="gridcell"
                tabIndex={0}
                onClick={() => handleCellClick(num)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onDoubleClick={(e) => e.preventDefault()}
                aria-label={`Number ${num}${isCompletedCell ? ', completed' : isTarget ? ', next target' : ''}`}
                aria-disabled={isFinished || isCompletedCell}
                className={`
                  aspect-square flex items-center justify-center font-normal
                  border-r border-b border-black select-none touch-manipulation
                  transition-colors outline-none relative
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 focus-visible:z-10
                  ${getCellFontSize(gridSize)}
                  ${
                    isCompletedCell
                      ? 'bg-blue-50 text-blue-600 font-medium cursor-default'
                      : isFinished
                      ? 'bg-white text-black cursor-default'
                      : 'bg-white text-black hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer'
                  }
                `}
              >
                {num}
              </button>
            );
          })}
        </main>

        {/* Instructions */}
        <div className="w-full mt-3 flex items-center justify-center text-xs text-neutral-600">
          <span>
            {startTimeRef.current === null
              ? 'Tap 1 to start timer'
              : isFinished
              ? isNewRecord
                ? `New record set for ${gridSize}×${gridSize}!`
                : 'Completed'
              : `Find numbers 1 to ${totalNumbers} in order`}
          </span>
        </div>
      </div>

      {/* Footer info */}
      <footer className="w-full max-w-[420px] pt-4 pb-2 text-center text-xs text-neutral-500">
        Fix eyes on the center cell and use peripheral vision to locate numbers in order.
      </footer>
    </div>
  );
}
