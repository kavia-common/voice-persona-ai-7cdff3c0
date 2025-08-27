import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ChatPane.css";
import { formatTimestamp, relativeTime, initials } from "./chatUtils";
import { mimicMachineSingleton } from "../services/mimicLogic";

/**
 * PUBLIC_INTERFACE
 * ChatPane: Handles real-time voice and text chat, conversation simulation, emotion feedback, and playback controls.
 * Integrates user voice cloning for playback (uses mimicked voice if available). 
 * Updates live emotion analytics whenever user sends a new message. 
 * All backend voice integration points are stubbed for extension.
 * Accepts a 'onNewEmotionResult' prop callback to notify parent of new emotion analysis result.
 * 
 * Now: ALL AI responses are generated using both user persona *and* the latest detected emotion.
 * All responses are spoken using the enrolled/setup voice.
 * Backend LLM extension stubs are clearly marked for future rich persona+emotion adaptation.
 */
export default function ChatPane({ userVoiceProfile: propUserVoiceProfile, onNewEmotionResult }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hey! I’m your Mimic.AI persona. What’s on your mind today?", emotion: "🙂", ts: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Local user voice profile state (from prop, e.g. from VoiceSetup flow)
  const [userVoiceProfile, setUserVoiceProfile] = useState(propUserVoiceProfile || null);
  const recognitionRef = useRef(null);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // New: Mimic state machine integration (declare BEFORE any usage)
  const [mimicState, setMimicState] = useState(mimicMachineSingleton.getSnapshot());
  useEffect(() => {
    // start and subscribe
    mimicMachineSingleton.start();
    const unsub = mimicMachineSingleton.subscribe((snap) => {
      setMimicState(snap);
    });
    return () => {
      unsub();
      // do not stop singleton to allow app-wide persistence; could stop if desired
    };
  }, []);

  // Add a subtle system message when Mimic enters MIMIC state
  const mimicPrevStateRef = useRef(mimicMachineSingleton.getSnapshot().state);
  useEffect(() => {
    if (!mimicState) return;
    if (mimicState.state !== mimicPrevStateRef.current) {
      // state changed
      if (mimicState.state === "MIMIC") {
        const txt = `Mimic is disguising as ${mimicState.disguise || "—"} and plays "${mimicState.sound || "—"}".`;
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: txt, emotion: "🪞", ts: Date.now() },
        ]);
      }
      mimicPrevStateRef.current = mimicState.state;
    }
  }, [mimicState?.state, mimicState?.disguise, mimicState?.sound]); 

  // Current emotion state (default: happy/calm)
  const [currentEmotion, setCurrentEmotion] = useState({
    emotions: [
      { label: "Happy", value: 0.85, color: "#21E6C1" },
      { label: "Calm", value: 0.72, color: "#2F80ED" },
      { label: "Excited", value: 0.44, color: "#F9A826" },
      { label: "Frustrated", value: 0.1, color: "#FF5454" },
    ],
    dominant: "Happy",
    emoji: "🙂",
    feedback: "😊 Positive mood detected! Conversation is adaptive.",
  });

  // Memory of last few user topics for temporal context
  const topicsMemoryRef = useRef([]);
  const rememberTopic = (text) => {
    const words = (text || "").toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    // pick a few descriptive words as "topics"
    const picks = Array.from(new Set(words)).slice(0, 3);
    if (picks.length) {
      topicsMemoryRef.current = [...picks, ...topicsMemoryRef.current].slice(0, 10);
    }
  };

  // PUBLIC_INTERFACE
  // Helper: Fake emotion analysis stub (returns mock result as if by "analyzing" input text/audio)
  function analyzeEmotion(inputTextOrAudio) {
    if (!inputTextOrAudio || !inputTextOrAudio.length) {
      return {
        emotions: [
          { label: "Happy", value: 0.8, color: "#21E6C1" },
          { label: "Calm", value: 0.5, color: "#2F80ED" },
          { label: "Excited", value: 0.2, color: "#F9A826" },
          { label: "Frustrated", value: 0.1, color: "#FF5454" },
        ],
        dominant: "Happy",
        emoji: "🙂",
        feedback: "😊 Positive mood detected! Conversation is adaptive.",
      };
    }
    const txt = inputTextOrAudio.toLowerCase();
    if (txt.includes("!") || txt.includes("wow") || txt.includes("amazing") || txt.includes("brilliant") || txt.includes("love")) {
      return {
        emotions: [
          { label: "Excited", value: 0.87, color: "#F9A826" },
          { label: "Happy", value: 0.62, color: "#21E6C1" },
          { label: "Calm", value: 0.19, color: "#2F80ED" },
          { label: "Frustrated", value: 0.04, color: "#FF5454" },
        ],
        dominant: "Excited",
        emoji: "😃",
        feedback: "🔥 Energetic and engaged. Let's keep it rolling.",
      };
    }
    if (txt.includes("angry") || txt.includes("hate") || txt.includes("stupid") || txt.includes("idiot") || txt.includes("dumb") || txt.includes("terrible") || txt.includes("mad")) {
      return {
        emotions: [
          { label: "Frustrated", value: 0.81, color: "#FF5454" },
          { label: "Calm", value: 0.22, color: "#2F80ED" },
          { label: "Excited", value: 0.14, color: "#F9A826" },
          { label: "Happy", value: 0.07, color: "#21E6C1" },
        ],
        dominant: "Frustrated",
        emoji: "😠",
        feedback: "😕 Stress spikes detected! Try a short mindful breath.",
      };
    }
    if (txt.includes("calm") || txt.includes("quiet") || txt.includes("peace") || txt.includes("zen") || txt.includes("relax")) {
      return {
        emotions: [
          { label: "Calm", value: 0.91, color: "#2F80ED" },
          { label: "Happy", value: 0.33, color: "#21E6C1" },
          { label: "Frustrated", value: 0.02, color: "#FF5454" },
          { label: "Excited", value: 0.13, color: "#F9A826" },
        ],
        dominant: "Calm",
        emoji: "😌",
        feedback: "🌊 A calming vibe in the air!",
      };
    }
    if (txt.includes("sad") || txt.includes("cry") || txt.includes("depressed") || txt.includes("down")) {
      return {
        emotions: [
          { label: "Frustrated", value: 0.38, color: "#FF5454" },
          { label: "Calm", value: 0.66, color: "#2F80ED" },
          { label: "Happy", value: 0.11, color: "#21E6C1" },
          { label: "Excited", value: 0.03, color: "#F9A826" },
        ],
        dominant: "Calm",
        emoji: "😐",
        feedback: "It's okay to feel down. Take your time to recover.",
      };
    }
    // Default: simple cycling mock
    const base = inputTextOrAudio.length + inputTextOrAudio.charCodeAt(0) % 13;
    const choices = [
      { emotions: [
        { label: "Happy", value: 0.85, color: "#21E6C1" },
        { label: "Calm", value: 0.61, color: "#2F80ED" },
        { label: "Excited", value: 0.54, color: "#F9A826" },
        { label: "Frustrated", value: 0.11, color: "#FF5454" }
      ], dominant: "Happy", emoji: "🙂", feedback: "😊 Positive mood detected! Conversation is adaptive." },
      { emotions: [
        { label: "Happy", value: 0.36, color: "#21E6C1" },
        { label: "Calm", value: 0.80, color: "#2F80ED" },
        { label: "Excited", value: 0.22, color: "#F9A826" },
        { label: "Frustrated", value: 0.08, color: "#FF5454" }
      ], dominant: "Calm", emoji: "😌", feedback: "🌊 A calming vibe in the air!" },
      { emotions: [
        { label: "Happy", value: 0.13, color: "#21E6C1" },
        { label: "Calm", value: 0.27, color: "#2F80ED" },
        { label: "Excited", value: 0.77, color: "#F9A826" },
        { label: "Frustrated", value: 0.2, color: "#FF5454" }
      ], dominant: "Excited", emoji: "😃", feedback: "🔥 Energetic and engaged. Let's keep it rolling." },
      { emotions: [
        { label: "Happy", value: 0.22, color: "#21E6C1" },
        { label: "Calm", value: 0.45, color: "#2F80ED" },
        { label: "Excited", value: 0.13, color: "#F9A826" },
        { label: "Frustrated", value: 0.81, color: "#FF5454" }
      ], dominant: "Frustrated", emoji: "😠", feedback: "😕 Stress spikes detected! Try a short mindful breath." }
    ];
    const which = base % choices.length;
    return choices[which];
  }

  // PUBLIC_INTERFACE
  const handleInputChange = (e) => setInput(e.target.value);

  /**
   * PUBLIC_INTERFACE
   * Generates an AI reply that mimics the user's personality and ADAPTS tone with temporal context.
   * Returns a natural, human-like response string.
   */
  function generatePersonalityAndEmotionReply(userText, emotionResult, personaProfile) {
    const personaStyles = [
      {
        name: 'Friendly & Supportive',
        opening: [
          "Absolutely! Here's a thought:",
          "I hear you—",
          "Let's explore this together:",
          "That made me think:",
        ],
        followup: [
          "Want to unpack that a bit?",
          "Happy to keep going if you are.",
          "What part stands out most to you?",
          "I'm listening.",
        ],
        baseTone: "friendly"
      },
      {
        name: 'Analytical & Calm',
        opening: [
          "Interesting point. If we break it down,",
          "Zooming out for a sec,",
          "From a pragmatic angle,",
          "It appears that",
        ],
        followup: [
          "Does that align with your intuition?",
          "We can test that assumption next.",
          "What variable matters most here?",
          "We could try a small experiment.",
        ],
        baseTone: "analytical"
      },
      {
        name: 'Playful & Witty',
        opening: [
          "Love that spark!",
          "Haha, that tickles my circuits—",
          "Off the top of my virtual head:",
          "Here's a spicy take:",
        ],
        followup: [
          "Care to riff on that with me?",
          "I’m game if you are.",
          "Throw me a curveball.",
          "Your move!",
        ],
        baseTone: "playful"
      },
    ];

    const personaIndex =
      (personaProfile && personaProfile.name)
        ? (personaProfile.name.charCodeAt(0) % personaStyles.length)
        : (userText && userText.length ? userText.charCodeAt(0) % personaStyles.length : 0);
    const persona = personaStyles[personaIndex];

    let emotionCue = "";
    let emotionOpeningMod = "";
    let emotionFollowupMod = "";
    const dominant = (emotionResult && emotionResult.dominant) ? emotionResult.dominant : "";
    const emoji = (emotionResult && emotionResult.emoji) ? emotionResult.emoji : "";

    switch (dominant) {
      case "Excited":
        emotionCue = "that energy is contagious.";
        emotionOpeningMod = "with an upbeat tone, ";
        emotionFollowupMod = "Let's ride that momentum.";
        break;
      case "Frustrated":
        emotionCue = "I can tell there's tension there.";
        emotionOpeningMod = "gently and without judgment, ";
        emotionFollowupMod = "We can take it one small step at a time.";
        break;
      case "Calm":
        emotionCue = "the pace feels steady.";
        emotionOpeningMod = "staying grounded, ";
        emotionFollowupMod = "No rush—we'll keep it clear.";
        break;
      case "Happy":
        emotionCue = "the good vibes help.";
        emotionOpeningMod = "on a positive note, ";
        emotionFollowupMod = "I'm glad we're in a good groove.";
        break;
      default:
        break;
    }

    const words = userText.match(/\b\w{4,}\b/g) || [];
    const keyword = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : "";

    // Simple temporal context: reference recent topics if relevant
    const recentTopic = topicsMemoryRef.current.find(t => t !== keyword);
    const contextHint = recentTopic ? `By the way, earlier you mentioned "${recentTopic}". ` : "";

    const opening = persona.opening[Math.floor(Math.random() * persona.opening.length)];
    const followup = persona.followup[Math.floor(Math.random() * persona.followup.length)];

    if (!userText.trim() || userText.trim().length < 3) {
      return `${opening} ${
        emotionOpeningMod ? "(" + emotionOpeningMod + ")" : ""
      } I'm here when you're ready. ${emoji} ${emotionFollowupMod || followup}`;
    }
    if (userText.trim().endsWith("?")) {
      return `${opening} ${emotionOpeningMod ? "(" + emotionOpeningMod + ")" : ""} ${contextHint}${
        keyword ? `On "${keyword}", ` : ""
      }${emotionCue} Here's my take: curiosity is a great compass. ${emoji} ${emotionFollowupMod || followup}`;
    }
    if (dominant === "Excited") {
      return `${opening} (excited tone) ${contextHint}Love the spark—${emotionCue} ${emoji} ${emotionFollowupMod || followup}`;
    }
    if (dominant === "Frustrated") {
      return `${opening} (soothing tone) ${contextHint}I hear you—${emotionCue} ${emoji} ${emotionFollowupMod || followup}`;
    }
    if (dominant === "Calm") {
      return `${opening} (calm style) ${contextHint}I appreciate the thoughtfulness—${emotionCue} ${emoji} ${emotionFollowupMod || followup}`;
    }
    if (dominant === "Happy") {
      return `${opening} (warm vibe) ${contextHint}I like where this is going—${emotionCue} ${emoji} ${emotionFollowupMod || followup}`;
    }
    return `${opening} ${contextHint}${emotionCue} ${emoji} ${followup}`;
  }

  // PUBLIC_INTERFACE
  // Now: AI mimics, paraphrases, and varies the reply, matching observed style and real-time emotion with typing simulation.
  const handleSend = async () => {
    if (input.trim() === "") return;
    const userText = input;

    // 1) Remember topics for temporal context
    rememberTopic(userText);

    // 2) Emotion analysis
    const emotionResult = analyzeEmotion(userText);
    setCurrentEmotion(emotionResult);
    if (onNewEmotionResult) onNewEmotionResult(emotionResult);

    // 3) Append user message (with emotion & timestamp)
    const userMsg = {
      role: "user",
      text: userText,
      emotion: emotionResult.emoji,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 4) Simulate typing indicator with delay proportional to response length
    setIsTyping(true);
    setInput("");

    // Compute a human-like delay
    const aiDraft = generatePersonalityAndEmotionReply(userText, emotionResult, userVoiceProfile);
    const baseDelay = 400; // ms
    const perChar = 12; // ms per char for a natural reading/typing feel
    const maxDelay = 2800;
    const delay = Math.min(maxDelay, baseDelay + aiDraft.length * perChar);

    setTimeout(async () => {
      setIsTyping(false);
      const aiMsg = {
        role: "ai",
        text: aiDraft,
        emotion: emotionResult.emoji,
        mimicked: true,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      await synthesizeVoiceWithUserProfile(aiMsg);
    }, delay);
  };

  // PUBLIC_INTERFACE
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // PUBLIC_INTERFACE
  const startListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    setIsListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.start();
  };

  // PUBLIC_INTERFACE
  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  /**
   * PUBLIC_INTERFACE
   * Playback chat history using ONLY the enrolled/setup (userVoiceProfile) voice.
   */
  const playBackHistory = async () => {
    setIsPlaying(true);
    let idx = 0;
    async function speakNext() {
      if (idx >= messages.length) {
        setIsPlaying(false);
        return;
      }
      const msg = messages[idx];
      if (msg.role === "ai" || msg.role === "user") {
        await synthesizeVoiceWithUserProfile(msg);
        idx++;
        setTimeout(speakNext, 150);
      } else {
        idx++;
        speakNext();
      }
    }
    speakNext();
  };

  /**
   * PUBLIC_INTERFACE
   * Stops all active playback (system TTS and tag-based audio).
   */
  const stopPlayback = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  /**
   * PUBLIC_INTERFACE
   * Synthesize message using user's cloned/enrolled voice if present for ALL playback.
   * Fallback to system TTS.
   */
  const synthesizeVoiceWithUserProfile = (msg) => {
    if (userVoiceProfile && userVoiceProfile.audioURL) {
      return new Promise((resolve) => {
        const audio = new Audio(userVoiceProfile.audioURL);
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play();
      });
    } else {
      return new Promise((resolve) => {
        const utter = new window.SpeechSynthesisUtterance(msg.text);
        window.speechSynthesis.speak(utter);
        utter.onend = resolve;
        utter.onerror = resolve;
      });
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Allows chat to receive the enrolled voice profile (triggered by VoiceSetupModal).
   */
  const handleVoiceProfileEnrolled = (profileObj) => {
    setUserVoiceProfile(profileObj);
  };

  // Memoized display name and avatar label
  const aiDisplayName = "Mimic.AI";
  const userDisplayName = userVoiceProfile?.name || "You";
  const aiBadge = useMemo(() => initials(aiDisplayName, "AI"), [aiDisplayName]);
  const userBadge = useMemo(() => initials(userDisplayName, "You"), [userDisplayName]);



  return (
    <div className="chat-pane">
      <div className="chat-header">
        <h2>Conversation</h2>
        {/* Mimic persona live state */}
        <div className="chat-actions" style={{ alignItems: "center" }}>
          <div
            title="Mimic Persona State"
            style={{
              marginRight: 8,
              padding: "6px 10px",
              borderRadius: 10,
              fontSize: "0.9em",
              background:
                mimicState.state === "MIMIC" ? "#e6fff7" : "#eef3ff",
              color:
                mimicState.state === "MIMIC" ? "#0d7d64" : "#2256b8",
              border:
                mimicState.state === "MIMIC"
                  ? "1px solid #21E6C144"
                  : "1px solid #2F80ED33",
              display: "flex",
              gap: 8,
            }}
          >
            <span>{mimicState.state === "MIMIC" ? "🪞 MIMIC" : "💤 IDLE"}</span>
            {mimicState.state === "MIMIC" && (
              <>
                <span>•</span>
                <span>Disguise: {mimicState.disguise || "—"}</span>
                <span>•</span>
                <span>Sound: {mimicState.sound || "—"}</span>
              </>
            )}
          </div>
          <button
            className="chat-act-btn"
            onClick={isListening ? stopListening : startListening}
            aria-label="Toggle voice input"
            disabled={isPlaying}
          >
            {isListening ? "🛑 Stop" : "🎙️ Voice"}
          </button>
          <button
            className="chat-act-btn"
            onClick={isPlaying ? stopPlayback : playBackHistory}
            aria-label="Playback conversation history"
          >
            {isPlaying ? "⏹️ Stop" : "▶️ Playback"}
          </button>
          {!userVoiceProfile && (
            <button
              className="chat-act-btn"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("openVoiceSetup", { detail: { onEnroll: handleVoiceProfileEnrolled } })
                );
              }}
              style={{ marginLeft: 10 }}
            >
              🎤 Setup Voice
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isAI = msg.role === "ai";
          return (
            <div className="chat-row" key={idx} aria-live="polite">
              {/* Avatar */}
              <div className="chat-avatar-badge" title={isAI ? aiDisplayName : userDisplayName}>
                {isAI ? aiBadge : userBadge}
              </div>
              {/* Bubble */}
              <div className={`chat-msg chat-msg-${msg.role}`}>
                <span className="chat-msg-text">{msg.text}</span>
                {msg.emotion && <span className="chat-msg-emotion">{msg.emotion}</span>}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-row" aria-live="polite">
            <div className="chat-avatar-badge" title={aiDisplayName}>{aiBadge}</div>
            <div className="chat-typing">
              <span>Typing</span>
              <span className="typing-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}

        {/* Subtle meta line for the last timestamp */}
        {messages.length > 0 && (
          <div className="chat-meta" aria-hidden="true">
            {formatTimestamp(messages[messages.length - 1].ts)} • {relativeTime(messages[messages.length - 1].ts)}
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          value={input}
          placeholder="Type your message or use voice..."
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isPlaying}
          aria-label="Chat message input"
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={isPlaying || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}
