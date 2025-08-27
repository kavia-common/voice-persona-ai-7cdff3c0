//
// PUBLIC_INTERFACE
// API client and integration-ready stubs for Mimic.AI-M1 frontend.
// Reads base endpoints from environment variables and exposes simple wrappers.
// Replace stub implementations with real backend endpoints as they become available.
//

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const USER_API = `${API_BASE_URL}/user`;
const CHAT_API = `${API_BASE_URL}/chat`;
const VOICE_API = `${API_BASE_URL}/voice`;
const INSIGHTS_API = `${API_BASE_URL}/insights`;

/**
 * Low-level JSON fetch helper
 * @param {string} url
 * @param {RequestInit} options
 */
async function jsonFetch(url, options = {}) {
  const resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp.text();
}

// PUBLIC_INTERFACE
export async function getCurrentUser() {
  /** Returns the current authenticated user profile (stubbed). */
  try {
    // Replace with: return await jsonFetch(`${USER_API}/me`);
    return Promise.resolve({
      id: "demo-user-1",
      username: "alex01",
      displayName: "Alex",
      email: "alex@email.com",
      persona: "Professional",
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function updateUserProfile(patch) {
  /** Updates the user profile (stubbed). */
  try {
    // Replace with: return await jsonFetch(`${USER_API}/me`, { method: 'PATCH', body: JSON.stringify(patch) });
    return Promise.resolve({ success: true, ...patch });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function sendChatMessage(history, userText, context = {}) {
  /**
   * Sends a chat message to backend LLM for persona+emotion aware reply (stubbed).
   * Returns { reply, emotions }.
   */
  try {
    // Replace with real call:
    // return await jsonFetch(`${CHAT_API}/send`, { method: 'POST', body: JSON.stringify({ history, userText, context }) });
    return Promise.resolve({
      reply:
        "Stubbed backend: This is where the AI’s persona+emotion-aware reply would appear.",
      emotions: [
        { label: "Happy", value: 0.65, color: "#21E6C1" },
        { label: "Calm", value: 0.5, color: "#2F80ED" },
        { label: "Excited", value: 0.2, color: "#F9A826" },
        { label: "Frustrated", value: 0.05, color: "#FF5454" },
      ],
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function enrollVoiceSample(formData) {
  /**
   * Uploads and enrolls a voice sample (stubbed).
   * formData: FormData with audio Blob and profileName.
   */
  try {
    // Example real call:
    // return await fetch(`${VOICE_API}/enroll`, { method: 'POST', body: formData, credentials: 'include' }).then(r => r.json());
    return Promise.resolve({
      enrollmentId: "user_voice_" + Math.floor(Math.random() * 100000),
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function synthesizeTTS(enrollmentId, text) {
  /**
   * Requests TTS audio for given enrollmentId and text (stubbed). Returns a Blob URL or stream URL.
   */
  try {
    // Replace with actual fetch for audio:
    // const res = await fetch(`${VOICE_API}/tts?voice=${encodeURIComponent(enrollmentId)}`, { method: 'POST', body: JSON.stringify({ text })});
    // const blob = await res.blob(); return URL.createObjectURL(blob);
    return Promise.resolve(null);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function getBehaviorInsights() {
  /** Fetch behavioral insights summary (stubbed). */
  try {
    // Replace with: return await jsonFetch(`${INSIGHTS_API}/summary`);
    return Promise.resolve({
      mostUsedPersona: "Professional",
      avgResponseTime: "1.2s",
      voiceCloneStatus: "Ready",
      totalConversations: 26,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const endpoints = {
  API_BASE_URL,
  USER_API,
  CHAT_API,
  VOICE_API,
  INSIGHTS_API,
};
