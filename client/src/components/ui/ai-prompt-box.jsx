import React from "react";
import { ArrowUp, Paperclip, Square, X, Mic, Globe, BrainCog, FolderCode, Check, StopCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ── Model selector ────────────────────────────────────────────────────────────
function ModelSelector() {
  const [models,  setModels]  = React.useState([]);
  const [open,    setOpen]    = React.useState(false);
  const [current, setCurrent] = React.useState(
    () => localStorage.getItem("tb-model") || "claude-sonnet-4-6"
  );

  React.useEffect(() => {
    fetch(`${API}/keys/models`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setModels(d); })
      .catch(() => {});
  }, []);

  const select = (id) => {
    setCurrent(id);
    localStorage.setItem("tb-model", id);
    setOpen(false);
  };

  const label = models.find(m => m.id === current)?.label || current.split("-").slice(0, 3).join(" ");

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-sub)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {label} <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 6, minWidth: 200, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {models.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-faint)", padding: "6px 8px", margin: 0 }}>Loading…</p>
          )}
          {models.map(m => (
            <button key={m.id} onClick={() => select(m.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 7, background: m.id === current ? "var(--surface)" : "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}>
              <span>{m.label}</span>
              {m.id === current && <Check size={12} style={{ color: "var(--gold)", flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ModeBtn = ({ active, onClick, color, icon: Icon, label }) => (
  <button type="button" onClick={onClick}
    style={{
      borderRadius: 99, padding: "2px 8px", height: 28,
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
      background: active ? `${color}18` : "transparent",
      border: active ? `1px solid ${color}` : "1px solid transparent",
      color: active ? color : "var(--text-sub)",
    }}>
    <Icon size={14} />
    <AnimatePresence>
      {active && (
        <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15 }} style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

const Divider = () => (
  <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
);

export const PromptInputBox = React.forwardRef(({
  onSend = () => {}, onStop, isLoading = false,
  placeholder = "Message Taskbot...",
  file, setFile, quote, onClearQuote, text, setText, levels,
}, ref) => {
  const [showSearch, setShowSearch] = React.useState(false);
  const [showThink, setShowThink]   = React.useState(false);
  const [showCanvas, setShowCanvas] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recTime, setRecTime]         = React.useState(0);

  const uploadRef = React.useRef(null);
  const taRef     = React.useRef(null);
  const timerRef  = React.useRef(null);
  const recRef    = React.useRef(null);
  const streamRef = React.useRef(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [text]);

  const startRecording = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recRef.current = new SR();
    recRef.current.continuous = true;
    recRef.current.interimResults = true;
    recRef.current.onresult = e => setText(Array.from(e.results).map(r => r[0].transcript).join(""));
    recRef.current.onend = () => stopRecording();
    recRef.current.start();
    try { streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
    setIsRecording(true);
    setRecTime(0);
    timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    recRef.current?.stop();
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    setRecTime(0);
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSubmit = () => {
    if (isRecording) { stopRecording(); return; }
    const t = text?.trim();
    if (!t && !file) return;
    const mode = showThink ? "think" : showSearch ? "search" : null;
    onSend(t, quote, mode);
    // modes are sticky — do NOT reset them here; user turns them off manually
  };

  const onKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const hasContent = (text?.trim()?.length > 0) || !!file;

  return (
    <div style={{ padding: "0 16px 16px" }}>

      {/* Quote */}
      <AnimatePresence>
        {quote && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, padding: "7px 12px", background: "var(--surface)", borderLeft: "2px solid var(--gold)", borderRadius: "0 8px 8px 0" }}>
            <p style={{ fontSize: 12, color: "var(--text-sub)", flex: 1, fontStyle: "italic", lineHeight: 1.5, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{quote}</p>
            <button onClick={onClearQuote} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: 0, display: "flex" }}><X size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File chip */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "5px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <Paperclip size={11} style={{ color: "var(--text-sub)" }} />
            <span style={{ fontSize: 12, color: "var(--text-sub)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: 0, display: "flex" }}><X size={11} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input box */}
      <div style={{
        borderRadius: 20,
        border: `1px solid ${isLoading ? "rgba(217,119,6,0.4)" : "var(--border)"}`,
        background: "var(--input-bg)",
        padding: "12px 14px 10px",
        transition: "border-color 0.2s",
      }}>

        {/* Recording visualizer */}
        {isRecording ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-sub)" }}>{fmt(recTime)}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 28 }}>
              {(levels || new Array(32).fill(0)).map((lvl, i) => (
                <div key={i} style={{ width: 3, height: Math.max(3, Math.round((lvl || 0) * 28)) + "px", borderRadius: 2, background: lvl > 0.05 ? "var(--gold)" : "var(--border-hover)", transition: "height 0.05s ease", flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={stopRecording} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}><X size={12} /></button>
              <button onClick={() => { stopRecording(); if (text?.trim()) onSend(text, quote); }} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--btn-bg)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--btn-text)" }}><Check size={12} /></button>
            </div>
          </div>
        ) : (
          /* Textarea */
          <textarea
            ref={taRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={showSearch ? "Search the web..." : showThink ? "Think deeply..." : showCanvas ? "Create canvas..." : placeholder}
            rows={1}
            style={{
              width: "100%", display: "block",
              background: "transparent", border: "none", outline: "none", resize: "none",
              fontSize: 15, color: "var(--text)", fontFamily: "inherit",
              lineHeight: "24px", padding: 0, margin: 0,
              maxHeight: 240, overflowY: "auto",
              boxSizing: "border-box",
            }}
          />
        )}

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10 }}>

          {/* Left: model selector + file + mode toggles */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ModelSelector />
            <Divider />
            <button onClick={() => uploadRef.current?.click()}
              style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-sub)", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
              <Paperclip size={15} />
            </button>
            <input ref={uploadRef} type="file" style={{ display: "none" }}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv,.md,.xlsx,.xls"
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); e.target.value = ""; }} />

            <Divider />
            <ModeBtn active={showSearch} onClick={() => { setShowSearch(p => !p); setShowThink(false); setShowCanvas(false); }} color="#1EAEDB" icon={Globe} label="Search" />
            <Divider />
            <ModeBtn active={showThink} onClick={() => { setShowThink(p => !p); setShowSearch(false); setShowCanvas(false); }} color="#8B5CF6" icon={BrainCog} label="Think" />
            <Divider />
            <ModeBtn active={showCanvas} onClick={() => { setShowCanvas(p => !p); setShowSearch(false); setShowThink(false); }} color="var(--gold)" icon={FolderCode} label="Canvas" />
          </div>

          {/* Right: mic + send */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isLoading ? (
              <button onClick={onStop}
                style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "var(--surface2)", color: "var(--text-sub)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Square size={13} />
              </button>
            ) : (
              <>
                <button onClick={() => isRecording ? stopRecording() : startRecording()}
                  style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: isRecording ? "rgba(239,68,68,0.12)" : "var(--surface2)", color: isRecording ? "#ef4444" : "var(--text-sub)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                  {isRecording ? <StopCircle size={15} /> : <Mic size={15} />}
                </button>
                <button onClick={handleSubmit} disabled={!hasContent}
                  style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: hasContent ? "var(--btn-bg)" : "var(--surface2)", color: hasContent ? "var(--btn-text)" : "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", cursor: hasContent ? "pointer" : "default", transition: "all 0.2s", opacity: hasContent ? 1 : 0.4 }}>
                  <ArrowUp size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)", marginTop: 7 }}>
        Taskbot can make mistakes. Verify important information.
      </p>
    </div>
  );
});

PromptInputBox.displayName = "PromptInputBox";
