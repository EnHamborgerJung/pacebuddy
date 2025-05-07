<script lang="ts">
import { writable, derived } from 'svelte/store';

// Input-Runen
const paceMin = writable<number | null>(null);
const paceSec = writable<number | null>(null);
const timeHr = writable<number | null>(null);
const timeMin = writable<number | null>(null);
const timeSec = writable<number | null>(null);
const distance = writable<number | null>(null);

// Error states
const errors = writable<{
  pace?: string;
  time?: string;
  distance?: string;
}>({});

// Dark mode
const isDarkMode = writable(false);

// Convert individual time components to total seconds
const paceInSeconds = derived([paceMin, paceSec], ([$paceMin, $paceSec]) => {
  if ($paceMin === null && $paceSec === null) return null;
  return ($paceMin || 0) * 60 + ($paceSec || 0);
});

const timeInSeconds = derived([timeHr, timeMin, timeSec], ([$timeHr, $timeMin, $timeSec]) => {
  if ($timeHr === null && $timeMin === null && $timeSec === null) return null;
  return ($timeHr || 0) * 3600 + ($timeMin || 0) * 60 + ($timeSec || 0);
});

// Standard running distances in meters
const distancePresets = {
  fiveK: 5000,         // 5 km
  tenK: 10000,         // 10 km
  halfMarathon: 21097, // 21.097 km
  marathon: 42195      // 42.195 km
};

// Convert seconds to hours, minutes, seconds
function secondsToTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { hours, minutes, seconds };
}

// Convert seconds to minutes, seconds
function secondsToPace(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { minutes, seconds };
}

// Set a preset distance
function setPresetDistance(preset: keyof typeof distancePresets) {
  distance.set(distancePresets[preset]);
  errors.update(e => ({ ...e, distance: undefined }));
}

// Track what was last modified to prioritize calculations
const lastModified = writable<'pace' | 'time' | 'distance'>('pace');

function updatePace() {
  lastModified.set('pace');
}

function updateTime() {
  lastModified.set('time');
}

function updateDistance() {
  lastModified.set('distance');
}

// Validate inputs
function validatePace(min: number | null, sec: number | null): string | undefined {
  if (min === null && sec === null) return undefined;
  if (min !== null && min < 0) return 'Minutes cannot be negative';
  if (sec !== null && (sec < 0 || sec >= 60)) return 'Seconds must be between 0 and 59';
  if (min === 0 && sec === 0) return 'Pace cannot be zero';
  return undefined;
}

function validateTime(hr: number | null, min: number | null, sec: number | null): string | undefined {
  if (hr === null && min === null && sec === null) return undefined;
  if (hr !== null && hr < 0) return 'Hours cannot be negative';
  if (min !== null && (min < 0 || min >= 60)) return 'Minutes must be between 0 and 59';
  if (sec !== null && (sec < 0 || sec >= 60)) return 'Seconds must be between 0 and 59';
  if (hr === 0 && min === 0 && sec === 0) return 'Time cannot be zero';
  return undefined;
}

function validateDistance(dist: number | null): string | undefined {
  if (dist === null) return undefined;
  if (dist <= 0) return 'Distance must be greater than zero';
  if (dist > 100000) return 'Distance seems unrealistic';
  return undefined;
}

// Main reactive calculation logic
$effect(() => {
  const pace = $paceInSeconds;
  const time = $timeInSeconds;
  const dist = $distance;
  const modified = $lastModified;

  // Validate inputs
  const paceError = validatePace($paceMin, $paceSec);
  const timeError = validateTime($timeHr, $timeMin, $timeSec);
  const distanceError = validateDistance(dist);

  errors.set({
    pace: paceError,
    time: timeError,
    distance: distanceError
  });

  // Skip calculations if we have errors
  if (paceError || timeError || distanceError) return;

  // Check which values we have
  const hasPace = pace !== null;
  const hasTime = time !== null;
  const hasDistance = dist !== null;

  // Skip calculations if we don't have at least two values
  if ([hasPace, hasTime, hasDistance].filter(Boolean).length < 2) return;

  // When all three are present, prioritize by what was last modified
  if (hasPace && hasTime && hasDistance) {
    if (modified === 'pace') {
      // Recalculate distance when pace changes
      const newDistance = Math.round((time / pace) * 1000);
      if (newDistance !== dist) distance.set(newDistance);
    } else if (modified === 'time') {
      // Recalculate pace when time changes
      const newPaceInSeconds = time / (dist / 1000);
      const { minutes, seconds } = secondsToPace(newPaceInSeconds);
      paceMin.set(minutes);
      paceSec.set(seconds);
    } else {
      // Recalculate time when distance changes
      const newTimeInSeconds = pace * (dist / 1000);
      const { hours, minutes, seconds } = secondsToTime(newTimeInSeconds);
      timeHr.set(hours);
      timeMin.set(minutes);
      timeSec.set(seconds);
    }
    return;
  }

  // Calculate the missing value
  if (!hasDistance && hasPace && hasTime) {
    // Calculate distance from pace and time
    const newDistance = Math.round((time / pace) * 1000);
    distance.set(newDistance);
  } else if (!hasTime && hasPace && hasDistance) {
    // Calculate time from pace and distance
    const newTimeInSeconds = pace * (dist / 1000);
    const { hours, minutes, seconds } = secondsToTime(newTimeInSeconds);
    timeHr.set(hours);
    timeMin.set(minutes);
    timeSec.set(seconds);
  } else if (!hasPace && hasTime && hasDistance) {
    // Calculate pace from time and distance
    const newPaceInSeconds = time / (dist / 1000);
    const { minutes, seconds } = secondsToPace(newPaceInSeconds);
    paceMin.set(minutes);
    paceSec.set(seconds);
  }
});

// Handle input events
function handlePaceMinInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  paceMin.set(value ? Number(value) : null);
  updatePace();
}

function handlePaceSecInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  const numValue = value ? Number(value) : null;

  if (numValue !== null && numValue >= 60 && $paceMin !== null) {
    // Normalize if seconds >= 60
    const totalSeconds = $paceMin * 60 + numValue;
    const { minutes, seconds } = secondsToPace(totalSeconds);
    paceMin.set(minutes);
    paceSec.set(seconds);
  } else {
    paceSec.set(numValue);
  }
  updatePace();
}

function handleTimeHrInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  timeHr.set(value ? Number(value) : null);
  updateTime();
}

function handleTimeMinInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  const numValue = value ? Number(value) : null;

  if (numValue !== null && numValue >= 60 && $timeHr !== null) {
    // Normalize if minutes >= 60
    const totalSeconds = $timeHr * 3600 + numValue * 60 + ($timeSec || 0);
    const { hours, minutes, seconds } = secondsToTime(totalSeconds);
    timeHr.set(hours);
    timeMin.set(minutes);
    timeSec.set(seconds);
  } else {
    timeMin.set(numValue);
  }
  updateTime();
}

function handleTimeSecInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  const numValue = value ? Number(value) : null;

  if (numValue !== null && numValue >= 60 && $timeMin !== null) {
    // Normalize if seconds >= 60
    const totalSeconds = ($timeHr || 0) * 3600 + $timeMin * 60 + numValue;
    const { hours, minutes, seconds } = secondsToTime(totalSeconds);
    timeHr.set(hours);
    timeMin.set(minutes);
    timeSec.set(seconds);
  } else {
    timeSec.set(numValue);
  }
  updateTime();
}

function handleDistanceInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const inputValue = input.value.trim();
  
  if (inputValue === '') {
    distance.set(null);
    return;
  }
  
  // Make sure we're parsing the full value
  const numValue = parseInt(inputValue, 10);
  
  // Check for valid number
  if (!isNaN(numValue)) {
    distance.set(numValue);
    updateDistance();
  }
}

// Reset all inputs
function resetCalculator() {
  paceMin.set(null);
  paceSec.set(null);
  timeHr.set(null);
  timeMin.set(null);
  timeSec.set(null);
  distance.set(null);
  errors.set({});
}

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode.update(mode => !mode);
}
</script>

<div class="max-w-md mx-auto p-6 rounded-lg transition-colors duration-200 {$isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Running Pace Calculator</h2>
        <button 
            onclick={toggleDarkMode}
            class="p-2 rounded-full {$isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}"
            aria-label="Toggle dark mode"
        >
            {$isDarkMode ? '🌞' : '🌙'}
        </button>
    </div>
    
    <!-- Pace Input -->
    <div class="mb-6">
        <label for="pace-minutes" class="block text-sm font-bold mb-2">Pace (min/km)</label>
        <div class="flex gap-2">
            <input
                id="pace-minutes"
                type="number"
                value={$paceMin ?? ''}
                onblur={handlePaceMinInput}
                placeholder="min"
                class="w-20 px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
                min="0"
                aria-label="Minutes per kilometer"
            />
            <span class="self-center">:</span>
            <input
                id="pace-seconds"
                type="number"
                value={$paceSec ?? ''}
                onblur={handlePaceSecInput}
                placeholder="sec"
                class="w-20 px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
                min="0"
                max="59"
                aria-label="Seconds per kilometer"
            />
        </div>
        {#if $errors.pace}
            <p class="text-red-500 text-sm mt-1">{$errors.pace}</p>
        {/if}
    </div>

    <!-- Time Input -->
    <div class="mb-6">
        <label for="time" class="block text-sm font-bold mb-2">Total Time</label>
        <div class="flex gap-2">
            <input
                id="time-hours"
                type="number"
                value={$timeHr ?? ''}
                onblur={handleTimeHrInput}
                placeholder="hh"
                class="w-20 px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
                min="0"
                aria-label="Hours"
            />
            <span class="self-center">:</span>
            <input
                id="time-minutes"
                type="number"
                value={$timeMin ?? ''}
                onblur={handleTimeMinInput}
                placeholder="mm"
                class="w-20 px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
                min="0"
                max="59"
                aria-label="Minutes"
            />
            <span class="self-center">:</span>
            <input
                id="time-seconds"
                type="number"
                value={$timeSec ?? ''}
                onblur={handleTimeSecInput}
                placeholder="ss"
                class="w-20 px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
                min="0"
                max="59"
                aria-label="Seconds"
            />
        </div>
        {#if $errors.time}
            <p class="text-red-500 text-sm mt-1">{$errors.time}</p>
        {/if}
    </div>

    <!-- Distance Input -->
    <div class="mb-4">
        <label for="distance" class="block text-sm font-bold mb-2">Distance (meters)</label>
        <input
            id="distance"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={$distance ?? ''}
            onblur={handleDistanceInput}
            placeholder="Enter distance in meters"
            class="w-full px-3 py-2 border rounded {$isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}"
            min="0"
            aria-label="Distance in meters"
        />
        {#if $errors.distance}
            <p class="text-red-500 text-sm mt-1">{$errors.distance}</p>
        {/if}
    </div>
    
    <!-- Distance Preset Buttons -->
    <div class="mb-6">
        <div class="text-sm font-bold mb-2">Common Distances:</div>
        <div class="flex flex-wrap gap-2">
            <button 
                onclick={() => setPresetDistance('fiveK')} 
                class="{$isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to 5K"
            >
                5K (5,000m)
            </button>
            <button 
                onclick={() => setPresetDistance('tenK')} 
                class="{$isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to 10K"
            >
                10K (10,000m)
            </button>
            <button 
                onclick={() => setPresetDistance('halfMarathon')} 
                class="{$isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to half marathon"
            >
                Half Marathon (21,097m)
            </button>
            <button 
                onclick={() => setPresetDistance('marathon')} 
                class="{$isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to marathon"
            >
                Marathon (42,195m)
            </button>
        </div>
    </div>

    <!-- Reset Button -->
    <button 
        onclick={resetCalculator}
        class="w-full py-2 rounded text-sm font-bold {$isDarkMode ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400 active:bg-gray-400'}"
        aria-label="Reset calculator"
    >
        Reset Calculator
    </button>
</div> 