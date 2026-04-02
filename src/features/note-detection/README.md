# Note Detection

Real-time audio note detection that listens to microphone input, identifies the note being played, and highlights the exact fret position on the fretboard.

## How It Works

The detection pipeline has three stages: **pitch detection**, **note mapping**, and **position disambiguation**.

### 1. Pitch Detection (`pitchDetector.ts`)

Uses the **YIN algorithm** to estimate the fundamental frequency from raw audio samples.

**Steps:**
1. **Difference function** — For each lag value τ, compute the squared difference between the signal and a delayed copy of itself. The lag where this difference is minimized corresponds to the period of the signal.
2. **Cumulative mean normalization** — Normalize each difference value by the running average of all previous values. This removes the bias toward τ=0 and produces dip values between 0 and 1.
3. **Absolute threshold** — Find the first lag where the normalized value drops below 0.15 (the YIN threshold). This avoids locking onto harmonics instead of the fundamental.
4. **Parabolic interpolation** — Refine the integer lag to sub-sample precision by fitting a parabola through the three points around the minimum. This significantly improves frequency resolution.

The detected frequency is `sampleRate / refinedLag`.

### 2. Note Mapping (`noteMapper.ts`)

Converts a frequency to its nearest musical note:

```
semitones_from_A4 = 12 * log2(frequency / 440)
MIDI_note = round(semitones_from_A4) + 69
cents_off = (semitones_from_A4 - round(semitones_from_A4)) * 100
```

Returns the note name (e.g., "A", "C#"), MIDI number, and cents deviation from perfect tuning. Frequencies outside 75-1400 Hz are rejected.

### 3. Position Disambiguation (`highlighter.ts` + `spectralAnalysis.ts`)

The same frequency can be played at multiple fret positions (e.g., A2 = open A string = 5th fret on low E). The highlighter resolves this ambiguity using two strategies:

**With spectral data (calibrated):**

Each guitar string has a distinct **timbre** — a thicker string playing the same pitch sounds different from a thinner one because the relative strengths of overtones differ. The spectral analysis module captures this fingerprint as:

- **Spectral centroid** — The brightness of the sound (weighted average frequency of the spectrum). Thicker strings produce a lower centroid for the same pitch.
- **Harmonic energy ratios** — The relative power of harmonics 2-5 compared to the fundamental. Different string gauges and materials produce distinct harmonic profiles.

During calibration, these signatures are captured for each open string. During live detection, the current note's spectral signature is compared against all calibrated strings using Euclidean distance, and the closest-matching string is selected.

**Without spectral data (fallback):**

When spectral signatures are unavailable, uses a heuristic: prefer the **lowest fret** on the **highest (thinnest) string**. This matches common playing patterns where guitarists favor open positions.

### 4. Calibration

The calibration system improves detection accuracy by measuring the player's actual guitar.

**Calibration Wizard (`calibrationWizard.ts`):**
- 6-step process, one per string (low E through high E)
- User plays each open string and clicks "Next" when satisfied with the reading
- "Skip" uses the theoretical frequency as a fallback

**Calibration Sampler (`calibrationSampler.ts`):**
- Continuously samples pitch at 60fps using `requestAnimationFrame`
- Temporarily increases FFT size to 4096 for better low-frequency resolution (important for low E at ~82 Hz)
- **Harmonic normalization** — If the detector picks up a harmonic (2x or 3x the expected frequency), it divides down to the fundamental. This is common for thick strings where overtones can be stronger than the fundamental.
- Reports a running **median** of the last 30 readings for stability
- Simultaneously captures spectral signatures (averaged across readings)

**Calibration Storage (`calibrationStorage.ts`):**
- Persists frequencies and spectral signatures to `localStorage`
- Backward-compatible: old calibrations without spectral data still work (frequency-only mode)

## Architecture

```
index.ts                 — Feature entry point, audio lifecycle, detection loop
  ├── pitchDetector.ts   — YIN algorithm (pure function)
  ├── noteMapper.ts      — Frequency → note/MIDI (pure function)
  ├── spectralAnalysis.ts — Spectral centroid & harmonic ratios (pure functions)
  ├── highlighter.ts     — Fret position selection & DOM highlighting
  ├── calibrationWizard.ts — Step-by-step calibration UI
  ├── calibrationSampler.ts — Continuous pitch + spectral sampling
  └── calibrationStorage.ts — localStorage persistence
```

## Limitations

- **Identical timbre edge cases** — Notes on adjacent strings at similar fret positions may have very similar spectral signatures, making disambiguation difficult.
- **Environment noise** — Background noise degrades pitch detection accuracy. Works best in a quiet environment.
- **Polyphonic input** — Only detects a single pitch at a time. Chords or simultaneous string rings will confuse the detector.
- **Alternate tunings** — Calibration assumes 6-string guitar. The wizard adapts to any tuning, but the expected frequency hints (used for harmonic normalization) are based on standard tuning.
