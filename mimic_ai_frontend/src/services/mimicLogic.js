//
// PUBLIC_INTERFACE
// Mimic state machine logic for the Mimic persona.
// States: IDLE, MIMIC
// Memory arrays: disguises_used[], recent_sounds[]
// Timer-based transitions: Start in IDLE, wander/do nothing, then switch to MIMIC; in MIMIC copy random animatronic and play sound, then return to IDLE.
// Exposes a singleton-like class that can be instantiated and subscribed to for UI updates.

const DEFAULT_IDLE_MIN_MS = 4000;
const DEFAULT_IDLE_MAX_MS = 8000;
const DEFAULT_MIMIC_MIN_MS = 2500;
const DEFAULT_MIMIC_MAX_MS = 4500;

/**
 * PUBLIC_INTERFACE
 * Returns a random integer between min and max inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * PUBLIC_INTERFACE
 * Get a random item from an array.
 * @param {Array<T>} arr
 * @returns {T|undefined}
 * @template T
 */
export function sample(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * PUBLIC_INTERFACE
 * MimicStateMachine manages the IDLE/MIMIC states and associated behaviors.
 * Subscribe to onChange to receive state updates for UI rendering.
 */
export class MimicStateMachine {
  /**
   * @param {Object} [opts]
   * @param {Array<string>} [opts.animatronics] - List of animatronic names/appearances Mimic can copy.
   * @param {Array<string>} [opts.soundLibrary] - Available sound identifiers for playback behavior.
   * @param {number} [opts.idleMinMs]
   * @param {number} [opts.idleMaxMs]
   * @param {number} [opts.mimicMinMs]
   * @param {number} [opts.mimicMaxMs]
   */
  constructor(opts = {}) {
    this.states = { IDLE: "IDLE", MIMIC: "MIMIC" };
    this.state = this.states.IDLE;

    // Memory arrays
    this.disguises_used = [];  // names of animatronics previously mimicked
    this.recent_sounds = [];   // recent sound identifiers played (queue-like)

    this.animatronics = Array.isArray(opts.animatronics) && opts.animatronics.length
      ? opts.animatronics
      : ["Freddy", "Bonnie", "Chica", "Foxy", "Puppet", "Springtrap", "Mangle"];

    this.soundLibrary = Array.isArray(opts.soundLibrary) && opts.soundLibrary.length
      ? opts.soundLibrary
      : ["footstep", "breath", "whisper", "static", "laugh", "clank", "echo"];

    this.idleMinMs = opts.idleMinMs || DEFAULT_IDLE_MIN_MS;
    this.idleMaxMs = opts.idleMaxMs || DEFAULT_IDLE_MAX_MS;
    this.mimicMinMs = opts.mimicMinMs || DEFAULT_MIMIC_MIN_MS;
    this.mimicMaxMs = opts.mimicMaxMs || DEFAULT_MIMIC_MAX_MS;

    this._timer = null;
    this._subscribers = new Set();
    this._currentDisguise = null;
    this._currentSound = null;
    this._started = false;
  }

  /**
   * PUBLIC_INTERFACE
   * Subscribe to state changes.
   * The callback receives a state snapshot: { state, disguise, sound, disguises_used, recent_sounds, at }
   * @param {(snapshot: object) => void} cb
   * @returns {() => void} unsubscribe
   */
  subscribe(cb) {
    if (typeof cb === "function") {
      this._subscribers.add(cb);
      // Immediately emit current snapshot
      cb(this._snapshot());
      return () => this._subscribers.delete(cb);
    }
    return () => {};
  }

  /**
   * PUBLIC_INTERFACE
   * Start the state machine loop (begins from IDLE).
   */
  start() {
    if (this._started) return;
    this._started = true;
    this._transitionTo(this.states.IDLE);
  }

  /**
   * PUBLIC_INTERFACE
   * Stop the state machine and clear timers.
   */
  stop() {
    this._started = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get the latest snapshot of internal state for UI usage.
   */
  getSnapshot() {
    return this._snapshot();
  }

  /**
   * INTERNAL: Schedule next transition based on current state.
   */
  _scheduleNext() {
    if (!this._started) return;
    if (this.state === this.states.IDLE) {
      const wait = randInt(this.idleMinMs, this.idleMaxMs);
      this._setTimer(() => this._enterMimic(), wait);
    } else if (this.state === this.states.MIMIC) {
      const wait = randInt(this.mimicMinMs, this.mimicMaxMs);
      this._setTimer(() => this._enterIdle(), wait);
    }
  }

  _setTimer(fn, ms) {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(fn, ms);
  }

  _transitionTo(nextState) {
    this.state = nextState;
    // Notifying subscribers about state changes
    this._notify();
    this._scheduleNext();
  }

  _enterIdle() {
    // In IDLE: wander/do nothing
    this._currentDisguise = null;
    this._currentSound = null;
    this._transitionTo(this.states.IDLE);
  }

  _enterMimic() {
    // In MIMIC: copy a random animatronic's appearance, play a random or recent sound
    const disguise = sample(this.animatronics);
    this._currentDisguise = disguise || "Unknown";
    if (disguise) {
      this.disguises_used = [this._currentDisguise, ...this.disguises_used].slice(0, 10);
    }

    // sound selection: prefer to reuse a recent random or pick fresh
    let chosenSound;
    if (Math.random() < 0.5 && this.recent_sounds.length > 0) {
      chosenSound = sample(this.recent_sounds);
    } else {
      chosenSound = sample(this.soundLibrary) || "silence";
    }
    this._currentSound = chosenSound;
    // maintain recent_sounds as a queue-like memory
    if (chosenSound) {
      const withoutDupes = [chosenSound, ...this.recent_sounds.filter(s => s !== chosenSound)];
      this.recent_sounds = withoutDupes.slice(0, 8);
    }

    this._transitionTo(this.states.MIMIC);
  }

  _snapshot() {
    return {
      state: this.state,
      disguise: this._currentDisguise,
      sound: this._currentSound,
      disguises_used: [...this.disguises_used],
      recent_sounds: [...this.recent_sounds],
      at: Date.now(),
    };
  }

  _notify() {
    const snap = this._snapshot();
    this._subscribers.forEach((cb) => {
      try { cb(snap); } catch (e) { /* eslint-disable no-console */ console.warn("Mimic subscriber error:", e); }
    });
  }
}

// Singleton helper (optional)
// PUBLIC_INTERFACE
export const mimicMachineSingleton = new MimicStateMachine();
