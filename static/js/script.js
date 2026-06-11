/* VPA Flask — script.js
   Connects the browser to the Python Flask backend
   Every chat message calls /chat endpoint
   Dashboard calls /history and /stats endpoints
*/
"use strict";

/* ── LOAD MODEL STATS ON PAGE LOAD ──────────────── */
async function loadStats() {
  try {
    const res  = await fetch("/stats");
    const data = await res.json();
    // Hero stats
    const s1 = document.getElementById("s1");
    const s2 = document.getElementById("s2");
    if (s1) s1.textContent = data.accuracy.split("/")[1].trim();
    if (s2) s2.textContent = data.intents;
    // Dashboard model card
    document.getElementById("mAlgo")?.setAttribute("textContent", data.model);
    const mAlgo    = document.getElementById("mAlgo");
    const mAcc     = document.getElementById("mAcc");
    const mInt     = document.getElementById("mInt");
    const mClasses = document.getElementById("mClasses");
    if (mAlgo)    mAlgo.textContent    = data.model;
    if (mAcc)     mAcc.textContent     = data.accuracy;
    if (mInt)     mInt.textContent     = data.intents + " intents";
    if (mClasses) mClasses.textContent = data.classes.join(", ");
  } catch(e) {
    console.warn("Could not load stats:", e);
  }
}

/* ── CHAT ─────────────────────────────────────────── */
const chatMessages = document.getElementById("chatMessages");

function addMessage(text, isUser, intent, confidence) {
  const row = document.createElement("div");
  row.className = "msg-row " + (isUser ? "user" : "bot");

  if (!isUser) {
    const av = document.createElement("div");
    av.className = "msg-avatar";
    av.textContent = "AI";
    row.appendChild(av);
  }

  const content = document.createElement("div");
  content.className = "msg-content";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = text;
  content.appendChild(bubble);

  // Show intent + confidence badge for bot messages
  if (!isUser && intent) {
    const tag = document.createElement("div");
    tag.className = "intent-tag";
    tag.textContent = `Intent: ${intent.replace(/_/g," ").toUpperCase()}`;
    content.appendChild(tag);

    const conf = document.createElement("div");
    conf.className = "conf-tag";
    conf.textContent = `Confidence: ${confidence}%`;
    content.appendChild(conf);
  }

  row.appendChild(content);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTyping() {
  const row = document.createElement("div");
  row.className = "msg-row bot";
  row.id = "typingRow";

  const av = document.createElement("div");
  av.className = "msg-avatar";
  av.textContent = "AI";

  const content = document.createElement("div");
  content.className = "msg-content";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  content.appendChild(bubble);
  row.appendChild(av);
  row.appendChild(content);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  document.getElementById("typingRow")?.remove();
}

/* ── THE KEY FUNCTION: sends message to Python Flask ── */
async function sendMessage(message) {
  if (!message.trim()) return;

  // Show user message
  addMessage(message, true);

  // Show typing indicator
  addTyping();

  try {
    // ← THIS IS HOW HTML TALKS TO PYTHON
    // It sends a POST request to Flask's /chat endpoint
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim().toLowerCase() })
    });

    const data = await response.json();
    // data = { intent: "report_defect", confidence: 72.4, response: "..." }

    removeTyping();
    addMessage(data.response, false, data.intent, data.confidence);

    // Refresh dashboard if it was a factory command
    const factoryIntents = ["report_defect","check_status","maintenance","shift_log"];
    if (factoryIntents.includes(data.intent)) {
      setTimeout(loadHistory, 500);
    }

  } catch(err) {
    removeTyping();
    addMessage(
      "⚠️ Could not connect to the Python backend.<br>" +
      "<small>Make sure Flask is running: <code>python app.py</code></small>",
      false, null, null
    );
  }
}

// Send button
document.getElementById("sendBtn")?.addEventListener("click", () => {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (msg) { sendMessage(msg); input.value = ""; }
});

// Enter key
document.getElementById("chatInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const msg = e.target.value.trim();
    if (msg) { sendMessage(msg); e.target.value = ""; }
  }
});

// Sidebar command buttons
document.querySelectorAll(".cmd-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    sendMessage(btn.dataset.msg);
  });
});

// Clear chat
document.getElementById("clearChat")?.addEventListener("click", () => {
  chatMessages.innerHTML = "";
  addMessage("Chat cleared! How can I help you?", false, null, null);
});

/* ── DASHBOARD: loads data from Python Flask ──────── */
async function loadHistory() {
  try {
    // ← Calls Python's /history endpoint
    const res  = await fetch("/history");
    const data = await res.json();

    // Defect table
    const dt = document.getElementById("defectTable");
    if (dt) {
      if (data.defects.length === 0) {
        dt.innerHTML = '<div class="table-empty">No defect reports yet.<br>Try: "Report defect on line 3"</div>';
      } else {
        dt.innerHTML = `
          <table class="dtable">
            <tr><th>ID</th><th>Time</th><th>Line</th><th>Description</th></tr>
            ${data.defects.map(d => `
              <tr>
                <td><span class="badge badge-defect">#${d.id}</span></td>
                <td style="font-family:var(--ff-mono);font-size:11px;color:var(--muted)">${d.time.slice(11)}</td>
                <td style="color:var(--gold);font-family:var(--ff-mono);font-size:12px">Line ${d.line}</td>
                <td>${d.desc.slice(0,60)}${d.desc.length>60?"…":""}</td>
              </tr>
            `).join("")}
          </table>`;
      }
    }

    // Maintenance table
    const mt = document.getElementById("maintTable");
    if (mt) {
      if (data.maintenance.length === 0) {
        mt.innerHTML = '<div class="table-empty">No maintenance tickets yet.<br>Try: "Maintenance for machine 7"</div>';
      } else {
        mt.innerHTML = `
          <table class="dtable">
            <tr><th>ID</th><th>Time</th><th>Machine</th><th>Issue</th></tr>
            ${data.maintenance.map(m => `
              <tr>
                <td><span class="badge badge-maint">#${m.id}</span></td>
                <td style="font-family:var(--ff-mono);font-size:11px;color:var(--muted)">${m.time.slice(11)}</td>
                <td style="color:var(--gold);font-family:var(--ff-mono);font-size:12px">${m.machine}</td>
                <td>${m.issue.slice(0,60)}${m.issue.length>60?"…":""}</td>
              </tr>
            `).join("")}
          </table>`;
      }
    }
  } catch(e) {
    console.warn("Could not load history:", e);
  }
}

// Refresh buttons
document.getElementById("refreshDefects")?.addEventListener("click", loadHistory);
document.getElementById("refreshMaint")?.addEventListener("click", loadHistory);
document.getElementById("refreshStats")?.addEventListener("click", loadStats);

/* ── CODE TABS ─────────────────────────────────────── */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".code-body pre").forEach(p => p.style.display = "none");
    const target = document.getElementById("tab-" + tab.dataset.tab);
    if (target) target.style.display = "block";
  });
});

/* ── NAV SCROLL ─────────────────────────────────────── */
window.addEventListener("scroll", () => {
  document.getElementById("nav")?.classList.toggle("scrolled", window.scrollY > 50);
});

/* ── INIT ───────────────────────────────────────────── */
loadStats();
loadHistory();