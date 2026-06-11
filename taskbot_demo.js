const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer, LevelFormat
} = require('docx');
const fs = require('fs');

const GOLD = "B45309";
const DARK = "1F2937";
const GRAY = "6B7280";
const LIGHT_GRAY = "F3F4F6";
const CODE_BG = "1E1E2E";
const WHITE = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Arial" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: GOLD, font: "Arial" })]
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK, font: "Arial" })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, color: opts.color || DARK, font: "Arial", italic: opts.italic || false, bold: opts.bold || false })]
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 480 },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 8 } },
    children: [new TextRun({ text: `"${text}"`, size: 20, color: "374151", font: "Arial", italics: true })]
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { type: ShadingType.CLEAR, fill: "F8F8F8" },
    border: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB" },
      right: { style: BorderStyle.NONE },
    },
    indent: { left: 360 },
    children: [new TextRun({ text: line || " ", size: 17, font: "Courier New", color: "1F2937" })]
  }));
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 480, hanging: 240 },
    children: [
      new TextRun({ text: "• ", size: 20, color: GOLD, font: "Arial", bold: true }),
      new TextRun({ text, size: 20, color: DARK, font: "Arial" })
    ]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function beatHeader(num, title, timing) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 6960, 1200],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 1200, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: GOLD },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          verticalAlign: "center",
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `BEAT ${num}`, bold: true, size: 20, color: WHITE, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          width: { size: 6960, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: "FEF3C7" },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: DARK, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          width: { size: 1200, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          verticalAlign: "center",
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: timing, size: 18, color: GRAY, font: "Arial" })] })]
        }),
      ]
    })]
  });
}

function qaTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 5760],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 3600, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: DARK },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: "QUESTION", bold: true, size: 18, color: WHITE, font: "Arial" })] })]
          }),
          new TableCell({
            borders,
            width: { size: 5760, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: DARK },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: "ANSWER", bold: true, size: 18, color: WHITE, font: "Arial" })] })]
          }),
        ]
      }),
      ...rows.map((r, i) => new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 3600, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "F9FAFB" : WHITE },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: r[0], bold: true, size: 19, color: DARK, font: "Arial" })] })]
          }),
          new TableCell({
            borders,
            width: { size: 5760, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "F9FAFB" : WHITE },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [new TextRun({ text: r[1], size: 19, color: "374151", font: "Arial" })] })]
          }),
        ]
      }))
    ]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: GOLD },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 4 } },
          children: [
            new TextRun({ text: "TASKBOT", bold: true, size: 20, color: GOLD, font: "Arial" }),
            new TextRun({ text: "  —  Demo Script & Technical Deep Dive", size: 20, color: GRAY, font: "Arial" }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Arial" }),
          ]
        })]
      })
    },
    children: [

      // ─── TITLE PAGE ───
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, after: 120 },
        children: [new TextRun({ text: "TASKBOT", bold: true, size: 64, color: GOLD, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "Demo Script & Technical Deep Dive", size: 28, color: GRAY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: "React  •  Python FastAPI  •  Claude API  •  Supabase", size: 20, color: GRAY, font: "Arial", italics: true })]
      }),

      // stack summary table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [new TableRow({
          children: ["React Frontend", "Python FastAPI", "Claude API", "Supabase DB"].map(t => new TableCell({
            borders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FEF3C7" },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true, size: 20, color: DARK, font: "Arial" })] })]
          }))
        })]
      }),

      spacer(),
      spacer(),

      // ─── SECTION 1: DEMO ───
      heading1("PART 1 — DEMO SCRIPT  (5 Minutes)"),
      spacer(),

      // OPENING
      heading2("Opening  (20 sec)"),
      quote("This is Taskbot — a fullstack AI assistant I built from scratch. React frontend, Python FastAPI backend, Claude API from Anthropic, Supabase database. Every feature — streaming, memory, document reading, voice, analytics — I built all of it. Let me show you."),
      spacer(),

      // BEAT 1
      beatHeader(1, "Welcome Screen", "15 sec"),
      spacer(),
      body("Open the app. Show it clean and empty.", { italic: true }),
      quote("Greets by name and time of day. Input box starts centered. First message animates it to the bottom. Small detail — makes it feel like a product, not a project."),
      spacer(),

      // BEAT 2
      beatHeader(2, "Streaming", "40 sec"),
      spacer(),
      body('Type: "What is a REST API?"', { italic: true }),
      quote("Watch — it streams word by word like ChatGPT. That's Server-Sent Events. Server pushes each token as Claude generates it. Without this you'd wait 10 seconds staring at a blank screen."),
      spacer(),
      heading3("Code — server (ai.py)"),
      ...codeBlock([
        "queue = asyncio.Queue()         # conveyor belt — tokens in one end, browser reads the other",
        "",
        "def run_stream():               # BLOCKING function — must run in a thread",
        "    with get_client().messages.stream(**kwargs) as stream:",
        "        for event in stream:",
        "            queue.put_nowait(json.dumps({'text': event.delta.text}))  # push each token",
        "    queue.put_nowait(None)      # None = done, stop reading",
        "",
        "loop.run_in_executor(None, run_stream)  # background thread — keeps FastAPI free",
        "",
        "while True:",
        "    item = await queue.get()    # wait for next token",
        "    if item is None: break",
        "    yield f'data: {item}\\n\\n'  # SSE format — browser reads lines starting with 'data:'",
      ]),
      spacer(),
      heading3("Code — browser (ChatContext.jsx)"),
      ...codeBlock([
        "const reader = resp.body.getReader()  // open stream — don't wait for full response",
        "while (true) {",
        "    const { done, value } = await reader.read()  // grab next chunk",
        "    if (done) break",
        "    full += p.text                              // build up the full response",
        "    setMessages(prev => prev.map(m =>",
        "        m.id === aid ? { ...m, content: full } : m  // update message → React re-renders",
        "    ))",
        "}",
      ]),
      spacer(),

      // BEAT 3
      beatHeader(3, "Conversation History", "30 sec"),
      spacer(),
      body('Ask a follow-up: "Give me a Python example of that"', { italic: true }),
      quote("It remembered. The Anthropic API is completely stateless — Claude starts fresh on every call. I solve it by sending the full conversation history every single time."),
      spacer(),
      heading3("Code — (ChatContext.jsx + ai.py)"),
      ...codeBlock([
        "// What gets sent to the server every message:",
        "const history = currentMessages",
        "    .filter(m => m.content?.trim())             // remove empty messages",
        "    .map(m => ({ role: m.role, content: m.content }))  // just role + content",
        "// result: [{role:'user', content:'...'}, {role:'assistant', content:'...'}, ...]",
        "",
        "# Python — only last 20 go to Claude:",
        "messages[-20:]   # cap at 20 — beyond that costs money and Claude doesn't need it",
      ]),
      spacer(),

      // BEAT 4
      beatHeader(4, "Think Mode", "30 sec"),
      spacer(),
      body('Hit Think (purple brain icon). Ask: "SQL or NoSQL for a chat app?"', { italic: true }),
      quote("Claude gets 6,000 tokens to reason before answering. You see the actual thought process. Real Anthropic API feature."),
      spacer(),
      heading3("Code — (ai.py)"),
      ...codeBlock([
        "if mode == 'think':",
        "    kwargs['thinking'] = {'type': 'enabled', 'budget_tokens': 6000}  # reasoning scratchpad",
        "    kwargs['max_tokens'] = 8000   # must be bigger than budget — needs room for the answer",
        "",
        "# two different event types stream back:",
        "if hasattr(event.delta, 'text'):",
        "    queue.put_nowait(json.dumps({'text': event.delta.text}))         # the final answer",
        "elif hasattr(event.delta, 'thinking'):",
        "    queue.put_nowait(json.dumps({'thinking': event.delta.thinking})) # the reasoning chain",
      ]),
      spacer(),

      // BEAT 5
      beatHeader(5, "Memory Cards", "40 sec"),
      spacer(),
      body('Say: "I\'m a CS student who loves building AI products"', { italic: true }),
      body("Open a new chat. Ask: \"What do you know about me?\"", { italic: true }),
      quote("Different chat — still knows. After every response a background call to Claude Haiku extracts facts and saves them to Supabase. When you ask to recall, regex detects the intent and facts get injected into the prompt."),
      spacer(),
      heading3("Code — extraction (ai.py)"),
      ...codeBlock([
        "async def extract_facts(messages):",
        "    get_client().messages.create(",
        "        model='claude-haiku-4-5-20251001',  # cheap fast model — not Sonnet, runs after every msg",
        "        temperature=0,                       # deterministic — same input same output every time",
        "        messages=[{'role': 'user', 'content':",
        "            'Extract permanent facts about this user. Return a JSON array only.'",
        "        }]",
        "    )",
        "    match = re.search(r'\\[.*?\\]', resp.content[0].text, re.DOTALL)  # pull array from response",
        "    return json.loads(match.group())",
        "",
        "# de-duplication:",
        "existing_set = {r['fact'].lower() for r in existing.data}      # all saved facts lowercased",
        "novel = [f for f in facts if f.lower() not in existing_set]    # only save new ones",
      ]),
      spacer(),
      heading3("Code — recall detection (memory_recall.py + chat.py)"),
      ...codeBlock([
        "RECALL_PATTERNS = [r'what do you know about me', r'\\brecall\\b', r'my background']",
        "",
        "def has_recall_intent(text):",
        "    return any(re.search(p, text.lower()) for p in RECALL_PATTERNS)  # one match = True",
        "",
        "# chat.py — only fetch memory if user asked for it:",
        "if has_recall_intent(content):",
        "    res = db.table('memory_cards').select('fact')",
        "             .eq('is_active', True).execute()   # is_active=False = soft deleted",
        "    memory_cards = res.data",
      ]),
      spacer(),

      // BEAT 6
      beatHeader(6, "Document Upload", "40 sec"),
      spacer(),
      body("Attach a PDF. Ask: \"Summarise in 3 bullet points\"", { italic: true }),
      quote("Before it reaches Claude, pdfplumber extracts all text and saves it to Supabase. Every follow-up in this chat automatically has the full document. That's a bug I specifically had to solve — the naive approach broke on follow-ups."),
      spacer(),
      heading3("Code — extraction (extract.py)"),
      ...codeBlock([
        "def extract_text(content: bytes, filename: str):",
        "    if filename.endswith('.pdf'):",
        "        with pdfplumber.open(io.BytesIO(content)) as pdf:  # BytesIO = no disk write needed",
        "            pages = [p.extract_text() or '' for p in pdf.pages]  # '' if page is blank",
        "        return '\\n'.join(pages).strip()   # all pages as one string",
        "",
        "    if filename.endswith(('.xlsx', '.xls')):",
        "        return _analyze_spreadsheet(...)   # returns column names, stats, first 5 rows",
      ]),
      spacer(),
      heading3("Code — save + reload (chat.py)"),
      ...codeBlock([
        "# first message with file — save text to this chat:",
        "db.table('chats').update({'document_context': extracted_text}).eq('id', chat_id).execute()",
        "",
        "# every follow-up — load it back from DB:",
        "doc_context = db.table('chats').select('document_context').eq('id', chat_id).execute()",
        "",
        "# inject into system prompt so Claude sees it every message:",
        "base += f'\\n\\nDocument:\\n\\n{doc_context[:12000]}'  # 12k char limit to control cost",
      ]),
      spacer(),

      // BEAT 7
      beatHeader(7, "Voice Input", "20 sec"),
      spacer(),
      body("Hit mic, speak, confirm.", { italic: true }),
      quote("Web Speech API — native to every modern browser, zero external libraries. The waveform reads real audio frequency data 60 times a second via the Web Audio API."),
      spacer(),
      heading3("Code — (ai-prompt-box.jsx + useVoice.js)"),
      ...codeBlock([
        "const SR = window.SpeechRecognition || window.webkitSpeechRecognition  // webkit = Chrome prefix",
        "rec.current.continuous = true        // keep listening until I stop it",
        "rec.current.interimResults = true    // update text AS you speak, not just on pause",
        "rec.current.onresult = e => {",
        "    const t = Array.from(e.results).map(r => r[0].transcript).join('')  // r[0] = top guess",
        "    setText(t)  // live update the textarea",
        "}",
        "",
        "// waveform:",
        "analyser.fftSize = 64                        // split audio into 32 frequency bands",
        "analyser.getByteFrequencyData(data)          // fill array: 0-255 volume per band",
        "setLevels(Array.from({length: 32}, (_, i) => data[i] / 255))  // normalize to 0-1",
        "// requestAnimationFrame runs this 60x per second — why bars move smoothly",
      ]),
      spacer(),

      // BEAT 8
      beatHeader(8, "Analytics", "20 sec"),
      spacer(),
      body("Click chart icon bottom right.", { italic: true }),
      quote("Backend uses Pandas to aggregate the database — messages per day, tokens, activity calendar. Frontend renders with Recharts."),
      spacer(),
      heading3("Code — (analytics.py)"),
      ...codeBlock([
        "df = pd.DataFrame(msgs)                              # load messages into a dataframe",
        "df['date'] = df['created_at'].dt.date.astype(str)   # extract date part as string",
        "",
        "messages_per_day = df.groupby('date').size()        # count messages per day",
        "tokens_per_day = df[df['role'] == 'assistant']",
        "                  .groupby('date')['token_count'].sum()  # sum tokens on Claude's replies only",
        "",
        "# GitHub-style activity calendar — last 16 weeks:",
        "all_days = pd.date_range(start=today - timedelta(days=111), end=today, freq='D')",
        "calendar = [{'date': str(d.date()),",
        "             'count': activity_map.get(str(d.date()), 0)}  # 0 if no messages that day",
        "            for d in all_days]",
      ]),
      spacer(),

      // CLOSING
      heading2("Closing  (15 sec)"),
      quote("React frontend, FastAPI backend, Claude Sonnet for responses, Claude Haiku for memory extraction, Supabase database, pdfplumber for documents, Pandas for analytics. Every feature was a real engineering problem — the blocking thread issue, the stateless API, the document context bug, the memory injection bug. That's Taskbot."),
      spacer(),

      // ─── SECTION 2: Q&A ───
      new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }),
      heading1("PART 2 — Q&A CHEAT SHEET"),
      spacer(),
      body("Expected questions and one-line answers. Know these cold.", { italic: true }),
      spacer(),

      qaTable([
        ["Why is message history a list?", "Anthropic API requires alternating {role, content} objects — user, assistant, user, assistant. That's literally the format it accepts."],
        ["What travels over the internet?", "HTTPS POST — model name, system prompt, messages array. Response streams back as 'data: {text}' lines (SSE format)."],
        ["What happens at 200 messages?", "messages[-20:] — cap at 20, oldest drop off. Still saved in Supabase, just not sent to Claude."],
        ["Why a function for streaming?", "It's an async generator — yield sends each token as it arrives. FastAPI's StreamingResponse pushes each chunk to the browser."],
        ["Why Haiku not Sonnet for memory?", "Haiku is ~15x cheaper and runs after every message. Simple JSON extraction doesn't need Sonnet's power."],
        ["Why store document text in DB?", "Follow-up messages don't carry the attachment. DB means every message in that chat has the document automatically."],
        ["Why useRef for activeId?", "React state is async — inside sendMessage you'd read a stale value. A ref always gives the current value instantly."],
        ["Why run_in_executor?", "Anthropic SDK is blocking. Calling it directly freezes FastAPI. A thread keeps the server free to handle other requests."],
        ["Why temperature=0?", "Deterministic — same input, same output every time. We want consistent fact extraction, not creative variation."],
        ["Why soft delete memory cards?", "is_active=False instead of deleting the row — keeps history, easy to restore, and avoids foreign key issues."],
      ]),

      spacer(),
      spacer(),
      body("Built by Keyaan Husain", { bold: true, color: GRAY }),
      body("github.com/keyaanh/taskbot", { color: GOLD }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Taskbot_Demo_Script.docx", buffer);
  console.log("Done: Taskbot_Demo_Script.docx");
});
