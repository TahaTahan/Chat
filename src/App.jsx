import { useState, useRef, useEffect } from "react";

const SAVE_KEY = "char-chat-save";

const REPLY_LENGTHS = [
  { id: "short",     label: "Short",     icon: "▪",   instruction: "Keep your replies brief and concise — 1 to 3 sentences maximum." },
  { id: "medium",    label: "Medium",    icon: "▪▪",  instruction: "Keep your replies moderate in length — a few sentences to a short paragraph." },
  { id: "long",      label: "Long",      icon: "▪▪▪", instruction: "Give detailed, expansive replies — multiple paragraphs where appropriate." },
  { id: "unlimited", label: "Unlimited", icon: "∞",   instruction: "Reply at whatever length feels natural for the situation — no length restriction." },
];

// ~1.3 tokens per word, ~4 chars per token, plus system prompt overhead ~800 tokens
const TRIM_OPTIONS = [
  { id: 50,   label: "50",   tokens: "~12k" },
  { id: 100,  label: "100",  tokens: "~25k" },
  { id: 200,  label: "200",  tokens: "~50k" },
  { id: 500,  label: "500",  tokens: "~125k" },
  { id: 750,  label: "750",  tokens: "~190k" },
  { id: 1000, label: "1000", tokens: "~250k" },
];

function loadSaved() {
  try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveData(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}
function clearData() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

function exportSave() {
  const data = loadSaved();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.charName || "character"}-chat-save.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Reply Length Picker ───────────────────────────────────────────────────────
function ReplyLengthPicker({ value, onChange, compact = false }) {
  return (
    <div style={{ display: "flex", gap: compact ? 4 : 6 }}>
      {REPLY_LENGTHS.map(opt => {
        const active = value === opt.id;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} title={opt.label} style={{
            background: active ? "linear-gradient(135deg, #8b6914, #c49a28)" : "rgba(30,24,14,0.8)",
            border: `1px solid ${active ? "#c49a28" : "#3a2e1e"}`,
            color: active ? "#1a1208" : "#8a7a6a",
            borderRadius: 7, padding: compact ? "4px 8px" : "6px 12px",
            cursor: "pointer", fontFamily: "Georgia, serif",
            fontSize: compact ? 11 : 12, fontWeight: active ? "bold" : "normal",
            transition: "all 0.2s", whiteSpace: "nowrap"
          }}>{compact ? opt.icon : `${opt.icon} ${opt.label}`}</button>
        );
      })}
    </div>
  );
}

// ── Trim Picker ───────────────────────────────────────────────────────────────
function TrimPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {TRIM_OPTIONS.map(opt => {
        const active = value === opt.id;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            background: active ? "linear-gradient(135deg, #144a8b, #2870c4)" : "rgba(14,24,40,0.8)",
            border: `1px solid ${active ? "#2870c4" : "#1e3050"}`,
            color: active ? "#e0f0ff" : "#6a8aaa",
            borderRadius: 7, padding: "5px 10px",
            cursor: "pointer", fontFamily: "Georgia, serif",
            fontSize: 11, fontWeight: active ? "bold" : "normal",
            transition: "all 0.2s", whiteSpace: "nowrap"
          }}>
            {opt.label} <span style={{ opacity: 0.7 }}>({opt.tokens})</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Memory Modal ──────────────────────────────────────────────────────────────
function MemoryModal({ onSave, onClose }) {
  const [text, setText] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "#1a1612", border: "1px solid #5a4a3a",
        borderRadius: 16, padding: 28, width: 360, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
      }}>
        <h3 style={{ margin: "0 0 6px", color: "#e8d5b0", fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Add Memory</h3>
        <p style={{ margin: "0 0 16px", color: "#8a7a6a", fontSize: 13, fontFamily: "Georgia, serif" }}>
          This text will be permanently appended to the character's history.
        </p>
        <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
          placeholder="e.g. The character remembers that the user prefers tea over coffee..."
          style={{
            width: "100%", minHeight: 120, background: "#0f0d0a",
            border: "1px solid #3a2e22", borderRadius: 10, color: "#d4c4a0",
            fontFamily: "Georgia, serif", fontSize: 14, padding: 12,
            resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6
          }} />
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #3a2e22", color: "#8a7a6a",
            borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14
          }}>Cancel</button>
          <button onClick={() => text.trim() && onSave(text.trim())} disabled={!text.trim()} style={{
            background: text.trim() ? "linear-gradient(135deg, #8b6914, #c49a28)" : "#2a2018",
            border: "none", color: text.trim() ? "#1a1208" : "#5a4a3a",
            borderRadius: 8, padding: "8px 20px", cursor: text.trim() ? "pointer" : "default",
            fontFamily: "Georgia, serif", fontSize: 14, fontWeight: "bold", transition: "all 0.2s"
          }}>Save Memory</button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "#1a1612", border: "1px solid #5a4a3a", borderRadius: 16,
        padding: 28, width: 320, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.8)", textAlign: "center"
      }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <p style={{ margin: "0 0 20px", color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #3a2e22", color: "#8a7a6a",
            borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: "linear-gradient(135deg, #8b2014, #c43a28)", border: "none",
            color: "#f0d0c0", borderRadius: 8, padding: "8px 20px",
            cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, fontWeight: "bold"
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ onImport, onClose }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.characterHistory) { setError("This file doesn't look like a valid character save."); return; }
        setError(""); setSuccess(true);
        setTimeout(() => onImport(data), 800);
      } catch { setError("Couldn't read that file. Make sure it's a .json save file."); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "#1a1612", border: "1px solid #5a4a3a",
        borderRadius: 16, padding: 28, width: 360, maxWidth: "90vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
      }}>
        <h3 style={{ margin: "0 0 6px", color: "#e8d5b0", fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Import Save</h3>
        <p style={{ margin: "0 0 20px", color: "#8a7a6a", fontSize: 13, fontFamily: "Georgia, serif", lineHeight: 1.6 }}>
          Select a <strong style={{ color: "#c49a28" }}>.json</strong> save file. This will replace your current save.
        </p>
        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#c49a28", fontFamily: "'Playfair Display', serif", fontSize: 18 }}>✦ Imported successfully!</div>
        ) : (
          <>
            <div onClick={() => fileRef.current.click()} style={{
              background: "#0a0806", border: "1px dashed #3a2e1e",
              borderRadius: 10, padding: "20px 16px", cursor: "pointer",
              textAlign: "center", marginBottom: error ? 12 : 20
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
              <div style={{ color: "#8a7a6a", fontFamily: "Georgia, serif", fontSize: 14 }}>Tap to select your save file</div>
            </div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{ display: "none" }} />
            {error && <div style={{ color: "#c43a28", fontFamily: "Georgia, serif", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(139,32,20,0.15)", borderRadius: 8, border: "1px solid rgba(139,32,20,0.3)" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid #3a2e22", color: "#8a7a6a", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14 }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const saved = loadSaved();
  const [characterHistory, setCharacterHistory] = useState(saved?.characterHistory || "");
  const [bgImage, setBgImage] = useState(saved?.bgImage || null);
  const [apiKey, setApiKey] = useState("");
  const [charName, setCharName] = useState(saved?.charName || "");
  const [replyLength, setReplyLength] = useState(saved?.replyLength || "medium");
  const [trimLimit, setTrimLimit] = useState(saved?.trimLimit || 100);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFlash, setImportFlash] = useState(false);
  const hasSavedSession = !!(saved?.messages?.length);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImport = (data) => {
    saveData(data);
    setCharName(data.charName || "");
    setCharacterHistory(data.characterHistory || "");
    setBgImage(data.bgImage || null);
    setReplyLength(data.replyLength || "medium");
    setTrimLimit(data.trimLimit || 100);
    setShowImportModal(false);
    setImportFlash(true);
    setTimeout(() => setImportFlash(false), 2000);
  };

  const canStart = characterHistory.trim() && apiKey.trim();

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0b08",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Georgia, serif", padding: 20, overflowY: "auto"
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px"
      }} />
      <div style={{
        width: "100%", maxWidth: 520,
        background: "linear-gradient(160deg, #1c1710 0%, #141009 100%)",
        border: "1px solid #3a2e1e", borderRadius: 20,
        padding: "36px 32px", boxShadow: "0 30px 80px rgba(0,0,0,0.9)", position: "relative"
      }}>
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, #c49a28, transparent)" }} />
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#8b6914", marginBottom: 10, textTransform: "uppercase" }}>Character Simulator</div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#e8d5b0", fontWeight: 400, letterSpacing: "-0.5px" }}>
            {hasSavedSession ? "Welcome Back" : "Create Your Character"}
          </h1>
          {hasSavedSession && <p style={{ margin: "8px 0 0", color: "#8a7a6a", fontSize: 13 }}>Your previous session has been restored.</p>}
          {importFlash && <p style={{ margin: "8px 0 0", color: "#c49a28", fontSize: 13 }}>✦ Save imported successfully!</p>}
        </div>

        <label style={{ display: "block", marginBottom: 18 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Anthropic API Key *</div>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..."
            style={{ width: "100%", background: "#0a0806", border: "1px solid #3a2e1e", borderRadius: 10, color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} />
          <div style={{ color: "#5a4a3a", fontSize: 11, marginTop: 5 }}>Never saved — enter each session for security.</div>
        </label>

        <label style={{ display: "block", marginBottom: 18 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Character Name</div>
          <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Aria, Merlin, Detective Cole..."
            style={{ width: "100%", background: "#0a0806", border: "1px solid #3a2e1e", borderRadius: 10, color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} />
        </label>

        <label style={{ display: "block", marginBottom: 18 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Character History & Personality *</div>
          <textarea value={characterHistory} onChange={e => setCharacterHistory(e.target.value)}
            placeholder="Describe your character in detail — personality, background, speech patterns, goals, quirks..."
            style={{ width: "100%", minHeight: 160, background: "#0a0806", border: "1px solid #3a2e1e", borderRadius: 10, color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 14, padding: "11px 14px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }} />
        </label>

        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Reply Length</div>
          <ReplyLengthPicker value={replyLength} onChange={setReplyLength} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Context Window (messages sent to API)</div>
          <div style={{ color: "#5a4a3a", fontSize: 11, marginBottom: 10 }}>Limits how many recent messages are sent per request. Lower = cheaper, higher = more context.</div>
          <TrimPicker value={trimLimit} onChange={setTrimLimit} />
        </div>

        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ color: "#a08060", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Chat Background Image (optional)</div>
          <div onClick={() => fileRef.current.click()} style={{ background: "#0a0806", border: "1px dashed #3a2e1e", borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            {bgImage ? (
              <><img src={bgImage} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} /><span style={{ color: "#c49a28", fontSize: 14 }}>Image selected — click to change</span></>
            ) : (
              <><div style={{ width: 40, height: 40, borderRadius: 8, background: "#1a1410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#5a4a3a" }}>🖼</div><span style={{ color: "#5a4a6a", fontSize: 14 }}>Click to upload background image</span></>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
        </label>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, padding: "14px 16px", background: "#0a0806", border: "1px solid #2a2010", borderRadius: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#6a5a3a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Transfer to another device</div>
            <div style={{ color: "#5a4a3a", fontSize: 12, fontFamily: "Georgia, serif" }}>Export your save, send the file to yourself, then import it on your other device.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, justifyContent: "center" }}>
            <button onClick={exportSave} style={{ background: "rgba(90,74,58,0.3)", border: "1px solid #3a2e1e", color: "#c49a28", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, whiteSpace: "nowrap" }}>⬇ Export</button>
            <button onClick={() => setShowImportModal(true)} style={{ background: "rgba(90,74,58,0.3)", border: "1px solid #3a2e1e", color: "#c49a28", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, whiteSpace: "nowrap" }}>⬆ Import</button>
          </div>
        </div>

        {hasSavedSession && (
          <button disabled={!canStart} onClick={() => onStart({ characterHistory, bgImage, apiKey, charName: charName || "Character", replyLength, trimLimit, resuming: true })}
            style={{ width: "100%", padding: "14px 0", marginBottom: 10, background: canStart ? "linear-gradient(135deg, #8b6914 0%, #c49a28 50%, #8b6914 100%)" : "#1e1a12", border: "none", borderRadius: 10, cursor: canStart ? "pointer" : "default", color: canStart ? "#1a1208" : "#3a3020", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.3s", boxShadow: canStart ? "0 4px 20px rgba(196,154,40,0.3)" : "none" }}>
            Resume Conversation
          </button>
        )}
        <button disabled={!canStart} onClick={() => onStart({ characterHistory, bgImage, apiKey, charName: charName || "Character", replyLength, trimLimit, resuming: false })}
          style={{ width: "100%", padding: "14px 0", background: canStart ? (hasSavedSession ? "transparent" : "linear-gradient(135deg, #8b6914 0%, #c49a28 50%, #8b6914 100%)") : "#1e1a12", border: canStart && hasSavedSession ? "1px solid #3a2e1e" : "none", borderRadius: 10, cursor: canStart ? "pointer" : "default", color: canStart ? (hasSavedSession ? "#8a7a6a" : "#1a1208") : "#3a3020", fontFamily: "'Playfair Display', serif", fontSize: hasSavedSession ? 14 : 17, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.3s", boxShadow: canStart && !hasSavedSession ? "0 4px 20px rgba(196,154,40,0.3)" : "none" }}>
          {hasSavedSession ? "Start Fresh (clears saved chat)" : "Begin Conversation"}
        </button>
      </div>
      {showImportModal && <ImportModal onImport={handleImport} onClose={() => setShowImportModal(false)} />}
    </div>
  );
}

// ── Chat Screen ───────────────────────────────────────────────────────────────
// Message structure: { role, content } for user messages
// For the last exchange, we track: pendingUserMsg, responseVariants[], activeVariantIdx
// Once a new message is sent, the active variant gets locked in as a normal message pair

function ChatScreen({ config, onReset }) {
  const saved = loadSaved();

  // messages = locked-in history array of {role, content}
  const [messages, setMessages] = useState(config.resuming && saved?.messages ? saved.messages : []);
  const [memories, setMemories] = useState(saved?.memories || []);
  const [replyLength, setReplyLength] = useState(config.replyLength || "medium");
  const [trimLimit, setTrimLimit] = useState(config.trimLimit || 100);

  // Pending exchange (not yet locked in)
  const [pendingUser, setPendingUser] = useState(null);       // string
  const [variants, setVariants] = useState([]);               // array of response strings
  const [activeVariant, setActiveVariant] = useState(0);      // index into variants

  const [input, setInput] = useState("");
  const [editingUser, setEditingUser] = useState(false);      // are we editing pendingUser?
  const [editText, setEditText] = useState("");

  const [loading, setLoading] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryFlash, setMemoryFlash] = useState(false);
  const [showLengthBar, setShowLengthBar] = useState(false);
  const [showTrimBar, setShowTrimBar] = useState(false);

  const bottomRef = useRef();
  const inputRef = useRef();

  // Save whenever state changes
  useEffect(() => {
    // Lock in active variant if pending exists, for save purposes
    const msgsToSave = pendingUser
      ? [...messages, { role: "user", content: pendingUser }, { role: "assistant", content: variants[activeVariant] || "" }]
      : messages;
    saveData({ charName: config.charName, characterHistory: config.characterHistory, bgImage: config.bgImage, messages: msgsToSave, memories, replyLength, trimLimit });
  }, [messages, memories, replyLength, trimLimit, pendingUser, variants, activeVariant]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingUser, variants, activeVariant]);

  const lengthInstruction = REPLY_LENGTHS.find(l => l.id === replyLength)?.instruction || "";
  const systemPrompt = [
    config.characterHistory,
    `\n\nREPLY LENGTH INSTRUCTION: ${lengthInstruction}`,
    memories.length > 0 ? `\n\n--- MEMORIES ---\n${memories.map((m, i) => `${i + 1}. ${m}`).join("\n")}` : ""
  ].join("");

  // Build the trimmed message array to send to API
  const buildApiMessages = (historyMessages, userMsg) => {
    const full = [...historyMessages, { role: "user", content: userMsg }];
    const trimmed = full.slice(-trimLimit);
    // Ensure we start with a user message
    let start = 0;
    while (start < trimmed.length && trimmed[start].role !== "user") start++;
    return trimmed.slice(start);
  };

  const callApi = async (historyMessages, userMsg) => {
    const apiMessages = buildApiMessages(historyMessages, userMsg);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages: apiMessages
      })
    });
    const data = await response.json();
    if (data.content?.[0]?.text) return data.content[0].text;
    throw new Error(data.error?.message || "Unknown error");
  };

  // Send a brand new message — locks in any pending exchange first
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setShowLengthBar(false);
    setShowTrimBar(false);

    // Lock in pending exchange if exists
    let baseMessages = messages;
    if (pendingUser && variants.length > 0) {
      baseMessages = [...messages,
        { role: "user", content: pendingUser },
        { role: "assistant", content: variants[activeVariant] }
      ];
      setMessages(baseMessages);
    }
    setPendingUser(null);
    setVariants([]);
    setActiveVariant(0);
    setEditingUser(false);

    setLoading(true);
    try {
      const reply = await callApi(baseMessages, text);
      setPendingUser(text);
      setVariants([reply]);
      setActiveVariant(0);
    } catch (e) {
      setPendingUser(text);
      setVariants([`[Error: ${e.message}]`]);
      setActiveVariant(0);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Regenerate — add a new variant for the current pendingUser
  const regenerate = async () => {
    if (!pendingUser || loading) return;
    setLoading(true);
    try {
      const reply = await callApi(messages, editingUser ? editText : pendingUser);
      setVariants(prev => [...prev, reply]);
      setActiveVariant(prev => prev + 1);
    } catch (e) {
      setVariants(prev => [...prev, `[Error: ${e.message}]`]);
      setActiveVariant(prev => prev + 1);
    }
    setLoading(false);
  };

  // Resend edited prompt — generates a new variant with the edited text
  const resendEdited = async () => {
    if (!editText.trim() || loading) return;
    const newText = editText.trim();
    setPendingUser(newText);
    setEditingUser(false);
    setLoading(true);
    try {
      const reply = await callApi(messages, newText);
      setVariants(prev => [...prev, reply]);
      setActiveVariant(variants.length); // point to the new one
    } catch (e) {
      setVariants(prev => [...prev, `[Error: ${e.message}]`]);
      setActiveVariant(variants.length);
    }
    setLoading(false);
  };

  // Delete the pending exchange entirely
  const deletePending = () => {
    setPendingUser(null);
    setVariants([]);
    setActiveVariant(0);
    setEditingUser(false);
    setShowDeleteConfirm(false);
  };

  const startEditing = () => {
    setEditText(pendingUser || "");
    setEditingUser(true);
  };

  const addMemory = (text) => {
    setMemories(prev => [...prev, text]);
    setShowMemoryModal(false);
    setMemoryFlash(true);
    setTimeout(() => setMemoryFlash(false), 1500);
  };

  const handleClearAll = () => {
    clearData(); setShowClearConfirm(false); onReset();
  };

  const currentLength = REPLY_LENGTHS.find(l => l.id === replyLength);
  const currentTrim = TRIM_OPTIONS.find(t => t.id === trimLimit);
  const bgStyle = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(160deg, #0d0b08 0%, #1a1208 100%)" };

  const btnStyle = (color = "gold") => ({
    background: "transparent",
    border: `1px solid ${color === "gold" ? "#3a2e1e" : color === "blue" ? "#1e3050" : "#3a1a1a"}`,
    color: color === "gold" ? "#c49a28" : color === "blue" ? "#4a8acc" : "#8a4a4a",
    borderRadius: 6, padding: "3px 8px", cursor: "pointer",
    fontFamily: "Georgia, serif", fontSize: 11, transition: "all 0.2s"
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative", ...bgStyle }}>
      <div style={{ position: "absolute", inset: 0, background: config.bgImage ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%)" : "transparent", pointerEvents: "none" }} />

      {/* ── Header ── */}
      <div style={{ position: "relative", zIndex: 10, background: "rgba(10,8,5,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(90,74,58,0.4)" }}>
        <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onReset} style={{ background: "transparent", border: "1px solid #3a2e1e", color: "#8a7a6a", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, flexShrink: 0 }}>← Back</button>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#e8d5b0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{config.charName}</div>
            {memories.length > 0 && <div style={{ fontSize: 10, color: memoryFlash ? "#c49a28" : "#6a5a4a", transition: "color 0.5s" }}>{memories.length} {memories.length === 1 ? "memory" : "memories"}</div>}
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {/* Trim toggle */}
            <button onClick={() => { setShowTrimBar(v => !v); setShowLengthBar(false); }} style={{ background: showTrimBar ? "linear-gradient(135deg, #144a8b, #2870c4)" : "rgba(20,40,80,0.5)", border: `1px solid ${showTrimBar ? "#2870c4" : "#1e3050"}`, color: showTrimBar ? "#e0f0ff" : "#4a8acc", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, transition: "all 0.2s" }}>
              {currentTrim?.tokens} ▾
            </button>
            {/* Length toggle */}
            <button onClick={() => { setShowLengthBar(v => !v); setShowTrimBar(false); }} style={{ background: showLengthBar ? "linear-gradient(135deg, #8b6914, #c49a28)" : "rgba(90,74,58,0.3)", border: `1px solid ${showLengthBar ? "#c49a28" : "#3a2e1e"}`, color: showLengthBar ? "#1a1208" : "#c49a28", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
              {currentLength?.icon} <span style={{ fontSize: 10 }}>▾</span>
            </button>
            <button onClick={() => setShowMemoryModal(true)} style={{ background: memoryFlash ? "linear-gradient(135deg, #8b6914, #c49a28)" : "rgba(90,74,58,0.3)", border: `1px solid ${memoryFlash ? "#c49a28" : "#3a2e1e"}`, color: memoryFlash ? "#1a1208" : "#c49a28", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, transition: "all 0.5s" }}>✦</button>
            <button onClick={exportSave} style={{ background: "rgba(90,74,58,0.3)", border: "1px solid #3a2e1e", color: "#c49a28", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11 }}>⬇</button>
            <button onClick={() => setShowClearConfirm(true)} style={{ background: "transparent", border: "1px solid #3a1a1a", color: "#8a4a4a", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11 }}>✕</button>
          </div>
        </div>

        {showTrimBar && (
          <div style={{ borderTop: "1px solid rgba(40,70,120,0.3)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "rgba(4,8,20,0.7)" }}>
            <span style={{ color: "#4a6a9a", fontSize: 11, fontFamily: "Georgia, serif", flexShrink: 0 }}>Context:</span>
            <TrimPicker value={trimLimit} onChange={setTrimLimit} />
          </div>
        )}
        {showLengthBar && (
          <div style={{ borderTop: "1px solid rgba(90,74,58,0.3)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "rgba(6,5,3,0.6)" }}>
            <span style={{ color: "#6a5a4a", fontSize: 11, fontFamily: "Georgia, serif", flexShrink: 0 }}>Length:</span>
            <ReplyLengthPicker value={replyLength} onChange={setReplyLength} />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 5 }}>
        {messages.length === 0 && !pendingUser && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, opacity: 0.6, marginTop: "30vh" }}>
            <div style={{ fontSize: 32 }}>✦</div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: "#e8d5b0", fontSize: 16, textAlign: "center" }}>Begin your conversation with {config.charName}</div>
          </div>
        )}

        {/* Locked messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%", background: msg.role === "user" ? "linear-gradient(135deg, rgba(139,105,20,0.85), rgba(196,154,40,0.75))" : "rgba(15,12,8,0.82)", backdropFilter: "blur(12px)", border: msg.role === "user" ? "1px solid rgba(196,154,40,0.4)" : "1px solid rgba(90,74,58,0.35)", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px", color: msg.role === "user" ? "#1a1208" : "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Pending user message */}
        {pendingUser && (
          <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {editingUser ? (
              <div style={{ maxWidth: "78%", width: "78%" }}>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{ width: "100%", background: "rgba(139,105,20,0.3)", border: "1px solid rgba(196,154,40,0.6)", borderRadius: "18px 18px 4px 18px", padding: "11px 15px", color: "#e8d0a0", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, outline: "none", resize: "vertical", minHeight: 60, boxSizing: "border-box" }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <button onClick={() => setEditingUser(false)} style={btnStyle("red")}>Cancel</button>
                  <button onClick={resendEdited} disabled={!editText.trim() || loading} style={{ ...btnStyle("gold"), background: editText.trim() && !loading ? "rgba(139,105,20,0.3)" : "transparent", color: editText.trim() && !loading ? "#c49a28" : "#5a4a3a" }}>↑ Resend</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ maxWidth: "78%", background: "linear-gradient(135deg, rgba(139,105,20,0.85), rgba(196,154,40,0.75))", backdropFilter: "blur(12px)", border: "1px solid rgba(196,154,40,0.4)", borderRadius: "18px 18px 4px 18px", padding: "11px 15px", color: "#1a1208", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                  {pendingUser}
                </div>
                {/* Action buttons under user message */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={startEditing} style={btnStyle("gold")} title="Edit prompt">✎ Edit</button>
                  <button onClick={() => setShowDeleteConfirm(true)} style={btnStyle("red")} title="Delete this exchange">✕ Delete</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Pending assistant response with variant controls */}
        {pendingUser && variants.length > 0 && !loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", flexDirection: "column", gap: 4 }}>
            <div style={{ maxWidth: "78%", background: "rgba(15,12,8,0.82)", backdropFilter: "blur(12px)", border: "1px solid rgba(90,74,58,0.35)", borderRadius: "18px 18px 18px 4px", padding: "11px 15px", color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
              {variants[activeVariant]}
            </div>
            {/* Variant controls */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {variants.length > 1 && (
                <>
                  <button onClick={() => setActiveVariant(v => Math.max(0, v - 1))} disabled={activeVariant === 0} style={{ ...btnStyle("blue"), opacity: activeVariant === 0 ? 0.4 : 1 }}>‹</button>
                  <span style={{ color: "#4a6a9a", fontSize: 11, fontFamily: "Georgia, serif" }}>{activeVariant + 1} / {variants.length}</span>
                  <button onClick={() => setActiveVariant(v => Math.min(variants.length - 1, v + 1))} disabled={activeVariant === variants.length - 1} style={{ ...btnStyle("blue"), opacity: activeVariant === variants.length - 1 ? 0.4 : 1 }}>›</button>
                </>
              )}
              <button onClick={regenerate} disabled={loading} style={btnStyle("gold")}>↺ Regenerate</button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(15,12,8,0.82)", backdropFilter: "blur(12px)", border: "1px solid rgba(90,74,58,0.35)", borderRadius: "18px 18px 18px 4px", padding: "13px 18px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8b6914", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ position: "relative", zIndex: 10, background: "rgba(10,8,5,0.88)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(90,74,58,0.4)", padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`Message ${config.charName}...`} rows={1}
          style={{ flex: 1, background: "rgba(20,16,9,0.9)", border: "1px solid #3a2e1e", borderRadius: 14, color: "#d4c4a0", fontFamily: "Georgia, serif", fontSize: 15, padding: "11px 15px", outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? "linear-gradient(135deg, #8b6914, #c49a28)" : "#1e1a12", border: "none", borderRadius: 12, width: 44, height: 44, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s", flexShrink: 0, boxShadow: input.trim() && !loading ? "0 4px 14px rgba(196,154,40,0.3)" : "none" }}>
          {loading ? "…" : "↑"}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
        * { box-sizing: border-box; } body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #3a2e1e; border-radius: 2px; }
      `}</style>

      {showMemoryModal && <MemoryModal onSave={addMemory} onClose={() => setShowMemoryModal(false)} />}
      {showClearConfirm && <ConfirmModal message="This will permanently delete your saved conversation and all memories. Are you sure?" onConfirm={handleClearAll} onClose={() => setShowClearConfirm(false)} />}
      {showDeleteConfirm && <ConfirmModal message="Delete this prompt and all its responses? This cannot be undone." onConfirm={deletePending} onClose={() => setShowDeleteConfirm(false)} />}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(null);

  const handleStart = (cfg) => {
    if (!cfg.resuming) {
      const saved = loadSaved();
      saveData({ charName: cfg.charName, characterHistory: cfg.characterHistory, bgImage: cfg.bgImage, messages: [], memories: saved?.memories || [], replyLength: cfg.replyLength, trimLimit: cfg.trimLimit });
    }
    setConfig(cfg);
  };

  if (!config) return <SetupScreen onStart={handleStart} />;
  return <ChatScreen config={config} onReset={() => setConfig(null)} />;
}
