<script lang="ts">
import { writable } from 'svelte/store';

// Input-Runen
const paceMin = writable<number | null>(null);
const paceSec = writable<number | null>(null);
const timeHr = writable<number | null>(null);
const timeMin = writable<number | null>(null);
const timeSec = writable<number | null>(null);
const distance = writable<number | null>(null);

// Track previous values to detect changes
const prevValues = {
  paceMin: null as number | null,
  paceSec: null as number | null,
  timeHr: null as number | null,
  timeMin: null as number | null,
  timeSec: null as number | null,
  distance: null as number | null
};

// Standard running distances in meters
const distancePresets = {
  fiveK: 5000,         // 5 km
  tenK: 10000,         // 10 km
  halfMarathon: 21097, // 21.097 km
  marathon: 42195      // 42.195 km
};

// Function to normalize time values (handle seconds >= 60, minutes >= 60)
function normalizeTime(hours: number, minutes: number, seconds: number) {
  // If seconds >= 60, adjust minutes and seconds
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }
  
  // If minutes >= 60, adjust hours and minutes
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }
  
  return { hours, minutes, seconds };
}

// Function to normalize pace values (handle seconds >= 60)
function normalizePace(minutes: number, seconds: number) {
  // If seconds >= 60, adjust minutes and seconds
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }
  
  return { minutes, seconds };
}

// Set a preset distance
function setPresetDistance(preset: keyof typeof distancePresets) {
  distance.set(distancePresets[preset]);
}

$effect(() => {
  const _paceMin = $paceMin;
  const _paceSec = $paceSec;
  const _timeHr = $timeHr;
  const _timeMin = $timeMin;
  const _timeSec = $timeSec;
  const _distance = $distance;

  console.log("Effect running with distance:", _distance);

  const hasPace = _paceMin != null && _paceSec != null;
  const hasTime = _timeHr != null && _timeMin != null && _timeSec != null;
  const hasDistance = _distance != null;
  
  // Determine what changed since last run
  const paceChanged = _paceMin !== prevValues.paceMin || _paceSec !== prevValues.paceSec;
  const timeChanged = _timeHr !== prevValues.timeHr || _timeMin !== prevValues.timeMin || _timeSec !== prevValues.timeSec;
  const distanceChanged = _distance !== prevValues.distance;
  
  // Update previous values for next comparison
  prevValues.paceMin = _paceMin;
  prevValues.paceSec = _paceSec;
  prevValues.timeHr = _timeHr;
  prevValues.timeMin = _timeMin;
  prevValues.timeSec = _timeSec;
  prevValues.distance = _distance;

  // Normalize time values if they exist
  if (hasTime) {
    const normalized = normalizeTime(_timeHr, _timeMin, _timeSec);
    if (normalized.hours !== _timeHr || normalized.minutes !== _timeMin || normalized.seconds !== _timeSec) {
      timeHr.set(normalized.hours);
      timeMin.set(normalized.minutes);
      timeSec.set(normalized.seconds);
      return; // The effect will run again with normalized values
    }
  }

  // Normalize pace values if they exist
  if (hasPace) {
    const normalized = normalizePace(_paceMin, _paceSec);
    if (normalized.minutes !== _paceMin || normalized.seconds !== _paceSec) {
      paceMin.set(normalized.minutes);
      paceSec.set(normalized.seconds);
      return; // The effect will run again with normalized values
    }
  }

  // Berechnung: Pace + Distance → Time
  if (hasPace && hasDistance && (!hasTime || distanceChanged || paceChanged)) {
    const paceSeconds = _paceMin * 60 + _paceSec;
    const totalSeconds = (_distance / 1000) * paceSeconds;
    
    const normalized = normalizeTime(
      Math.floor(totalSeconds / 3600),
      Math.floor((totalSeconds % 3600) / 60),
      Math.round(totalSeconds % 60)
    );
    
    timeHr.set(normalized.hours);
    timeMin.set(normalized.minutes);
    timeSec.set(normalized.seconds);
  }

  // Berechnung: Time + Distance → Pace
  else if (hasTime && hasDistance && (!hasPace || distanceChanged || timeChanged)) {
    const totalSeconds = _timeHr * 3600 + _timeMin * 60 + _timeSec;
    const paceSeconds = totalSeconds / (_distance / 1000);
    
    const normalized = normalizePace(
      Math.floor(paceSeconds / 60),
      Math.round(paceSeconds % 60)
    );
    
    paceMin.set(normalized.minutes);
    paceSec.set(normalized.seconds);
  }

  // Berechnung: Pace + Time → Distance
  else if (hasPace && hasTime && (!hasDistance || paceChanged || timeChanged)) {
    const totalSeconds = _timeHr * 3600 + _timeMin * 60 + _timeSec;
    const paceSeconds = _paceMin * 60 + _paceSec;
    distance.set(Math.round((totalSeconds / paceSeconds) * 1000));
  }
});

// Handle input events
function handlePaceMinInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  paceMin.set(value ? Number(value) : null);
}

function handlePaceSecInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  paceSec.set(value ? Number(value) : null);
  
  // Normalize if entered seconds are >= 60
  if ($paceSec && $paceSec >= 60 && $paceMin !== null) {
    const normalized = normalizePace($paceMin, $paceSec);
    paceMin.set(normalized.minutes);
    paceSec.set(normalized.seconds);
  }
}

function handleTimeHrInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  timeHr.set(value ? Number(value) : null);
}

function handleTimeMinInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  timeMin.set(value ? Number(value) : null);
  
  // Normalize if entered minutes are >= 60
  if ($timeMin && $timeMin >= 60 && $timeHr !== null) {
    const normalized = normalizeTime($timeHr, $timeMin, $timeSec || 0);
    timeHr.set(normalized.hours);
    timeMin.set(normalized.minutes);
    timeSec.set(normalized.seconds);
  }
}

function handleTimeSecInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  timeSec.set(value ? Number(value) : null);
  
  // Normalize if entered seconds are >= 60
  if ($timeSec && $timeSec >= 60 && $timeMin !== null && $timeHr !== null) {
    const normalized = normalizeTime($timeHr, $timeMin, $timeSec);
    timeHr.set(normalized.hours);
    timeMin.set(normalized.minutes);
    timeSec.set(normalized.seconds);
  }
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
  console.log("Distance input:", inputValue, "Parsed as:", numValue);
  
  // Check for valid number
  if (!isNaN(numValue)) {
    distance.set(numValue);
  } else {
    distance.set(null);
  }
}
</script>

<div class="max-w-md mx-auto p-6 bg-white rounded-lg">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Running Pace Calculator</h2>
    
    <!-- Pace Input -->
    <div class="mb-6">
        <label for="pace-minutes" class="block text-gray-700 text-sm font-bold mb-2">Pace (min/km)</label>
        <div class="flex gap-2">
            <input
                id="pace-minutes"
                type="number"
                value={$paceMin ?? ''}
                onblur={handlePaceMinInput}
                placeholder="min"
                class="w-20 px-3 py-2 border rounded"
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
                class="w-20 px-3 py-2 border rounded"
                min="0"
                max="59"
                aria-label="Seconds per kilometer"
            />
        </div>
    </div>

    <!-- Time Input -->
    <div class="mb-6">
        <label for="time" class="block text-gray-700 text-sm font-bold mb-2">Total Time</label>
        <div class="flex gap-2">
            <input
                id="time-hours"
                type="number"
                value={$timeHr ?? ''}
                onblur={handleTimeHrInput}
                placeholder="hh"
                class="w-20 px-3 py-2 border rounded"
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
                class="w-20 px-3 py-2 border rounded"
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
                class="w-20 px-3 py-2 border rounded"
                min="0"
                max="59"
                aria-label="Seconds"
            />
        </div>
    </div>

    <!-- Distance Input -->
    <div class="mb-4">
        <label for="distance" class="block text-gray-700 text-sm font-bold mb-2">Distance (meters)</label>
        <input
            id="distance"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={$distance ?? ''}
            onblur={handleDistanceInput}
            placeholder="Enter distance in meters"
            class="w-full px-3 py-2 border rounded"
            min="0"
            aria-label="Distance in meters"
        />
    </div>
    
    <!-- Distance Preset Buttons -->
    <div class="mb-6">
        <div class="text-gray-700 text-sm font-bold mb-2">Common Distances:</div>
        <div class="flex flex-wrap gap-2">
            <button 
            onclick={() => setPresetDistance('fiveK')} 
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            aria-label="Set distance to 5K"
        >
            5K (5,000m)
        </button>
            <button 
                onclick={() => setPresetDistance('tenK')} 
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to 10K"
            >
                10K (10,000m)
            </button>
            <button 
                onclick={() => setPresetDistance('halfMarathon')} 
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to half marathon"
            >
                Half Marathon (21,097m)
            </button>
            <button 
                onclick={() => setPresetDistance('marathon')} 
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                aria-label="Set distance to marathon"
            >
                Marathon (42,195m)
            </button>
        </div>
    </div>
</div> 