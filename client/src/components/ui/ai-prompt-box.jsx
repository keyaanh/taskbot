import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Paperclip, Square, X, StopCircle, Mic, Globe, BrainCog, FolderCode, MicOff, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── Textarea ──
const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn("flex w-full bg-transparent px-3 py-2.5 text-[15px] placeholder:text-[var(--text-faint)] focus-visible:outline-none resize-none", className)}
    ref={ref}
    rows={1}
    style={{ color: "var(--text)", fontFamily: "inherit" }}
    {...props}
  />
));

// ── Tooltip ──
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content ref={ref} sideOffset={sideOffset}
    style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "var(--text-sub)", zIndex: 100 }}
    className={cn("animate-in fade-in-0 zoom-in-95", className)}
    {...props}
  />
));

// ── Dialog ──
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)}
    {...props}
  />
));
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref}
      className={cn("fixed left-[50%] top-[50%] z-50 w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 0 }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close style={{ position: "absolute", right: 12, top: 12, zIndex: 10, background: "var(--surface2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-sub)" }}>
        <X size={15} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));

// ── Context ──
const PromptInputContext = React.createContext({ isLoading: false, value: "", setValue: () => {}, maxHeight: 240, onSubmit: undefined, disabled: false });
const usePromptInput = () => React.useContext(PromptInputContext);

// ── PromptInput wrapper ──
const PromptInput = React.forwardRef(({ className, isLoading = false, maxHeight = 240, value, onValueChange, onSubmit, children, disabled = false, onDragOver, onDragLeave, onDrop }, ref) => {
  const [internal, setInternal] = React.useState(value || "");
  const handleChange = (v) => { setInternal(v); onValueChange?.(v); };
  return (
    <TooltipProvider>
      <PromptInputContext.Provider value={{ isLoading, value: value ?? internal, setValue: onValueChange ?? handleChange, maxHeight, onSubmit, disabled }}>
        <div ref={ref}
          style={{ borderRadius: 20, border: `1px solid ${isLoading ? "rgba(217,119,6,0.4)" : "rgba(255,255,255,0.05)"}`, background: "var(--input-bg)", padding: "10px 12px", transition: "border-color 0.2s" }}
          className={className}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
});

// ── Textarea inside context ──
const PromptInputTextarea = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (disableAutosize || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, typeof maxHeight === "number" ? maxHeight : 240)}px`;
  }, [value, maxHeight, disableAutosize]);

  return (
    <Textarea ref={ref} value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit?.(); } onKeyDown?.(e); }}
      className={className} disabled={disabled} placeholder={placeholder} {...props}
    />
  );
};

const PromptInputActions = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>{children}</div>
);

const PromptInputAction = ({ tooltip, children, side = "top", ...props }) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

// ── Divider ──
const Divider = () => (
  <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
);

// ── Mode button ──
const ModeBtn = ({ active, onClick, color, icon: Icon, label }) => (
  <button type="button" onClick={onClick}
    style={{ borderRadius: 99, padding: "2px 8px", height: 28, display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", background: active ? `${color}18` : "transparent", border: active ? `1px solid ${color}` : "1px solid transparent", color: active ? color : "var(--text-sub)" }}>
    <motion.div animate={{ rotate: active ? 360 : 0, scale: active ? 1.1 : 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}>
      <Icon size={14} />
    </motion.div>
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

// ── Main component ──
export const PromptInputBox = React.forwardRef(({ onSend = () => {}, onStop, isLoading = false, placeholder = "Message Taskbot...", className, file, setFile, quote, onClearQuote, text, setText, levels }, ref) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showThink, setShowThink] = React.useState(false);
  const [showCanvas, setShowCanvas] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recTime, setRecTime] = React.useState(0);
  const uploadRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const recRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);
  const streamRef = React.useRef(null);

  // Voice recording
  const startRecording = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recRef.current = new SR();
    recRef.current.continuous = true;
    recRef.current.interimResults = true;
    recRef.current.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setText(t);
    };
    recRef.current.onend = () => stopRecording();
    recRef.current.start();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {}

    setIsRecording(true);
    setRecTime(0);
    timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    recRef.current?.stop();
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    setIsRecording(false);
    setRecTime(0);
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSubmit = async () => {
    if (isRecording) { stopRecording(); return; }
    const t = text?.trim();
    if (!t && !file) return;
    const mode = showThink ? 'think' : showSearch ? 'search' : null;
    onSend(t, quote, mode);
    setShowSearch(false);
    setShowThink(false);
    setShowCanvas(false);
  };

  const hasContent = (text?.trim()?.length > 0) || !!file;

  const handleDrop = e => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/") || f.name.endsWith(".pdf") || f.name.endsWith(".docx") || f.name.endsWith(".xlsx") || f.name.endsWith(".csv"));
    if (f) setFile(f);
  };

  return (
    <>
      <div style={{ padding: "0 16px 16px" }}>
        {/* Quote */}
        {quote && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, padding: "7px 12px", background: "var(--surface)", borderLeft: `2px solid var(--gold)`, borderRadius: "0 8px 8px 0" }}>
            <p style={{ fontSize: 12, color: "var(--text-sub)", flex: 1, fontStyle: "italic", lineHeight: 1.5, margin: 0 }} className="line-clamp-2">{quote}</p>
            <button onClick={onClearQuote} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: 0 }}><X size={12} /></button>
          </motion.div>
        )}

        {/* File chip */}
        {file && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "5px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <Paperclip size={11} style={{ color: "var(--text-sub)" }} />
            <span style={{ fontSize: 12, color: "var(--text-sub)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: 0, display: "flex" }}>
              <X size={11} />
            </button>
          </motion.div>
        )}

        <PromptInput value={text} onValueChange={setText} isLoading={isLoading} onSubmit={handleSubmit}
          disabled={isLoading} ref={ref} className={className}
          onDragOver={e => e.preventDefault()} onDragLeave={e => e.preventDefault()} onDrop={handleDrop}
        >
          {/* Recording visualizer */}
          {isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px 10px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: "var(--text-sub)" }}>{fmt(recTime)}</span>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 28 }}>
                {(levels || new Array(32).fill(0)).map((lvl, i) => (
                  <div key={i} style={{ width: 3, height: Math.max(3, Math.round((lvl || 0) * 28)) + "px", borderRadius: 2, background: lvl > 0.05 ? "var(--gold)" : "var(--border-hover)", transition: "height 0.05s ease", flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={stopRecording}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}>
                  <X size={12} />
                </button>
                <button onClick={() => { stopRecording(); if (text?.trim()) onSend(text, quote); }}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--btn-bg)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--btn-text)" }}>
                  <Check size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Textarea */}
          {!isRecording && (
            <PromptInputTextarea placeholder={showSearch ? "Search the web..." : showThink ? "Think deeply..." : showCanvas ? "Create canvas..." : placeholder} className="text-[15px]" />
          )}

          {/* Actions row */}
          <PromptInputActions style={{ paddingTop: 8, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* File attach */}
              <PromptInputAction tooltip="Attach file">
                <button onClick={() => uploadRef.current?.click()}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-sub)", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-sub)"}>
                  <Paperclip size={15} />
                </button>
              </PromptInputAction>
              <input ref={uploadRef} type="file" style={{ display: "none" }}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv,.md,.xlsx,.xls"
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); e.target.value = ""; }} />

              <Divider />

              {/* Mode toggles */}
              <ModeBtn active={showSearch} onClick={() => { setShowSearch(p => !p); setShowThink(false); setShowCanvas(false); }} color="#1EAEDB" icon={Globe} label="Search" />
              <Divider />
              <ModeBtn active={showThink} onClick={() => { setShowThink(p => !p); setShowSearch(false); setShowCanvas(false); }} color="#8B5CF6" icon={BrainCog} label="Think" />
              <Divider />
              <ModeBtn active={showCanvas} onClick={() => { setShowCanvas(p => !p); setShowSearch(false); setShowThink(false); }} color="var(--gold)" icon={FolderCode} label="Canvas" />
            </div>

            {/* Right side — mic slides left, send scales in */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => { if (isRecording) { stopRecording(); return; } startRecording(); }}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: isRecording ? "rgba(239,68,68,0.12)" : "var(--surface2)",
                  color: isRecording ? "#ef4444" : "var(--text-sub)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: (hasContent || isLoading) && !isRecording ? "translateX(-4px)" : "translateX(0)",
                  opacity: isLoading ? 0.4 : 1,
                }}>
                {isRecording ? <StopCircle size={15} /> : <Mic size={15} />}
              </button>

              {!isLoading && (
                <button
                  onClick={handleSubmit}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: "none",
                    background: "var(--btn-bg)",
                    color: "var(--btn-text)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: hasContent ? "pointer" : "default",
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    opacity: hasContent ? 1 : 0,
                    transform: hasContent ? "scale(1)" : "scale(0.85)",
                    pointerEvents: hasContent ? "auto" : "none",
                    marginLeft: hasContent ? 0 : -36,
                  }}>
                  <ArrowUp size={15} />
                </button>
              )}
            </div>
          </PromptInputActions>
        </PromptInput>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)", marginTop: 7 }}>
          Taskbot can make mistakes. Verify important information.
        </p>
      </div>

      {/* Image preview dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent>
            <img src={selectedImage} alt="Preview" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 16 }} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

PromptInputBox.displayName = "PromptInputBox";
