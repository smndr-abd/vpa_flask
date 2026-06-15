/* ── NAV SCROLL ─────────────────────────────────────────── */
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav?.classList.toggle("scrolled", window.scrollY > 40);
});

/* ── SCROLL REVEAL ──────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visible"); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

/* ── CODE TABS ──────────────────────────────────────────── */
document.querySelectorAll(".ctab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".ctab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".code-content pre").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab)?.classList.add("active");
  });
});

/* ── CHAT ───────────────────────────────────────────────── */
const chatMessages = document.getElementById("chatMessages");

function addMsg(html, isUser, intent, confidence) {
  const row = document.createElement("div");
  row.className = "msg-row " + (isUser ? "user" : "bot");

  if (!isUser) {
    const av = document.createElement("div");
    av.className = "m-avatar";
    av.textContent = "AI";
    row.appendChild(av);
  }

  const body   = document.createElement("div");
  body.className = "m-body";

  const bubble = document.createElement("div");
  bubble.className = "m-bubble";
  bubble.innerHTML = html;
  body.appendChild(bubble);

  if (!isUser && intent) {
    const meta = document.createElement("div");
    meta.className = "m-meta";

    const itag = document.createElement("div");
    itag.className = "m-intent";
    itag.textContent = intent.replace(/_/g, " ").toUpperCase();
    meta.appendChild(itag);

    const conf = document.createElement("div");
    conf.className = "m-conf";
    conf.textContent = confidence + "% confidence";
    meta.appendChild(conf);

    body.appendChild(meta);
  }

  row.appendChild(body);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "typing-row";
  row.id = "typingRow";
  const av = document.createElement("div");
  av.className = "m-avatar";
  av.textContent = "AI";
  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";
  bubble.innerHTML = "<span></span><span></span><span></span>";
  row.appendChild(av);
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function hideTyping() { document.getElementById("typingRow")?.remove(); }

async function sendMessage(text) {
  if (!text.trim()) return;
  addMsg(text, true);
  showTyping();
  try {
    const res  = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim().toLowerCase() })
    });
    const data = await res.json();
    hideTyping();
    addMsg(data.response, false, data.intent, data.confidence);

    // Auto-refresh dashboard for factory commands
    const factory = ["report_defect","check_status","maintenance","shift_log"];
    if (factory.includes(data.intent)) setTimeout(loadHistory, 600);

  } catch {
    hideTyping();
    addMsg(
      "⚠️ Cannot reach the Python backend.<br>" +
      "<small>Make sure Flask is running: <code>python app.py</code></small>",
      false, null, null
    );
  }
}

document.getElementById("sendBtn")?.addEventListener("click", () => {
  const inp = document.getElementById("chatInput");
  if (inp.value.trim()) { sendMessage(inp.value.trim()); inp.value = ""; }
});
document.getElementById("chatInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.value.trim()) {
    sendMessage(e.target.value.trim()); e.target.value = "";
  }
});
document.querySelectorAll(".sb-btn").forEach(b => {
  b.addEventListener("click", () => sendMessage(b.dataset.msg));
});
document.getElementById("clearChat")?.addEventListener("click", () => {
  chatMessages.innerHTML = "";
  addMsg("Chat cleared. How can I help you?", false, null, null);
});

/* ── DASHBOARD ──────────────────────────────────────────── */
async function loadHistory() {
  try {
    const res  = await fetch("/history");
    const data = await res.json();

    const db = document.getElementById("defectBody");
    if (db) {
      if (!data.defects.length) {
        db.innerHTML = `<div class="empty-state">
          <div class="empty-icon">🏭</div>
          <div class="empty-text">No defect reports yet.</div>
          <div class="empty-hint">Try: "Report defect on line 3"</div>
        </div>`;
      } else {
        db.innerHTML = `<table class="data-table">
          <tr><th>ID</th><th>Time</th><th>Line</th><th>Description</th></tr>
          ${data.defects.map(d => `<tr>
            <td><span class="badge badge-v">#${d.id}</span></td>
            <td style="font-family:var(--f-mono);font-size:10px;color:var(--text-3)">${d.time.slice(11,19)}</td>
            <td style="color:var(--violet-lt);font-family:var(--f-mono);font-size:11px">Line ${d.line}</td>
            <td>${d.desc.slice(0,55)}${d.desc.length>55?"…":""}</td>
          </tr>`).join("")}
        </table>`;
      }
    }

    const mb = document.getElementById("maintBody");
    if (mb) {
      if (!data.maintenance.length) {
        mb.innerHTML = `<div class="empty-state">
          <div class="empty-icon">🔧</div>
          <div class="empty-text">No maintenance tickets yet.</div>
          <div class="empty-hint">Try: "Maintenance for machine 7"</div>
        </div>`;
      } else {
        mb.innerHTML = `<table class="data-table">
          <tr><th>ID</th><th>Time</th><th>Machine</th><th>Issue</th></tr>
          ${data.maintenance.map(m => `<tr>
            <td><span class="badge badge-c">#${m.id}</span></td>
            <td style="font-family:var(--f-mono);font-size:10px;color:var(--text-3)">${m.time.slice(11,19)}</td>
            <td style="color:var(--cyan-lt);font-family:var(--f-mono);font-size:11px">${m.machine}</td>
            <td>${m.issue.slice(0,55)}${m.issue.length>55?"…":""}</td>
          </tr>`).join("")}
        </table>`;
      }
    }
  } catch(e) { console.warn("loadHistory:", e); }
}

async function loadStats() {
  try {
    const res  = await fetch("/stats");
    const data = await res.json();
    const el = id => document.getElementById(id);
    if (el("s1")) el("s1").textContent = data.accuracy.split("/")[1]?.trim() || "91%";
    if (el("s2")) el("s2").textContent = data.intents;
    if (el("mAlgo"))    el("mAlgo").textContent    = data.model;
    if (el("mAcc"))     el("mAcc").textContent     = data.accuracy;
    if (el("mInt"))     el("mInt").textContent     = data.intents + " intents";
    if (el("mClasses")) el("mClasses").textContent = data.classes.join(", ");
  } catch(e) { console.warn("loadStats:", e); }
}

document.getElementById("refreshDefects")?.addEventListener("click", loadHistory);
document.getElementById("refreshMaint")?.addEventListener("click", loadHistory);
document.getElementById("refreshStats")?.addEventListener("click", loadStats);

/* ── INIT ───────────────────────────────────────────────── */
loadStats();
loadHistory();