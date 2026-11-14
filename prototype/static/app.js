const $ = (id) => document.getElementById(id);
let token = localStorage.getItem("sb_token");
let userId = localStorage.getItem("sb_user");

async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (token || "") },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    localStorage.clear();
    location.reload();
    throw new Error("session expired");
  }
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  return res.json();
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ---------- start / session ----------
async function showStatus() {
  const s = await (await fetch("/api/status")).json();
  let line = s.mode === "gemini" ? "AI: Gemini (" + s.model + ")" : "AI: demo mode (no Gemini key)";
  if (s.last_error) line = "AI: Gemini call failed, using demo replies";
  $("mode").textContent = line;
  let note = "";
  if (s.mode === "demo") note = "Demo mode: no Gemini key is set, so replies are fixed sample replies.";
  if (s.last_error) note = "Gemini error: " + s.last_error;
  $("chatNotice").innerHTML = note ? '<div class="notice">' + esc(note) + "</div>" : "";
}

async function begin() {
  $("start").style.display = "none";
  $("app").style.display = "block";
  $("who").textContent = "Anonymous user: " + userId;
  $("mlDate").value = new Date().toISOString().slice(0, 10);
  await showStatus();
  await loadChat();
  await loadIntake();
  await loadMindlog();
}

$("startBtn").onclick = async () => {
  const s = await (await fetch("/api/session/anonymous", { method: "POST" })).json();
  token = s.token;
  userId = s.user_id;
  localStorage.setItem("sb_token", token);
  localStorage.setItem("sb_user", userId);
  begin();
};

document.querySelectorAll("nav button").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("nav button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll("section").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("tab-" + b.dataset.tab).classList.add("active");
  };
});

// ---------- chat ----------
function addMsg(role, text, crisis) {
  const d = document.createElement("div");
  d.className = crisis ? "crisis" : "msg " + role;
  d.textContent = text;
  $("chatLog").appendChild(d);
  $("chatLog").scrollTop = $("chatLog").scrollHeight;
}

async function loadChat() {
  const h = await api("/api/chat/history");
  $("chatLog").innerHTML = "";
  if (h.messages.length === 0) addMsg("assistant", "Hi, I am SunnoBuddy. I am here to listen. How are you feeling today?");
  h.messages.forEach((m) => addMsg(m.role, m.content));
}

async function sendChat() {
  const text = $("chatInput").value.trim();
  if (!text) return;
  $("chatInput").value = "";
  addMsg("user", text);
  $("chatSend").disabled = true;
  try {
    const r = await api("/api/chat", "POST", { message: text });
    addMsg("assistant", r.reply, r.crisis);
  } catch (e) {
    addMsg("assistant", "Something went wrong. Please try again.");
  }
  $("chatSend").disabled = false;
  showStatus();
}
$("chatSend").onclick = sendChat;
$("chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

// ---------- intake ----------
function renderIntake(s, followUp) {
  $("intakeProgressText").textContent = s.done
    ? "Intake complete (" + s.total + " of " + s.total + ")"
    : "Question " + (s.answered + 1) + " of " + s.total;
  $("intakeBar").style.width = Math.round((s.answered / s.total) * 100) + "%";
  $("intakeSection").textContent = s.done ? "" : s.section;
  $("intakeQuestion").textContent = s.done
    ? "Thank you. That is all the questions for now."
    : followUp || s.question;
  $("intakeAnswer").style.display = s.done ? "none" : "block";
  $("intakeSend").style.display = s.done ? "none" : "inline-block";
  $("intakeCrisis").innerHTML = s.crisis ? '<div class="crisis">' + esc(s.message) + "</div>" : "";
}

async function loadIntake() { renderIntake(await api("/api/intake")); }

$("intakeSend").onclick = async () => {
  const a = $("intakeAnswer").value.trim();
  if (!a) return;
  const s = await api("/api/intake/answer", "POST", { answer: a });
  if (!s.crisis) $("intakeAnswer").value = "";
  renderIntake(s, s.follow_up);
};
$("intakeReset").onclick = async () => { renderIntake(await api("/api/intake/reset", "POST")); };

// ---------- mindlog ----------
async function loadMindlog() {
  const r = await api("/api/mindlog");
  $("mlCounts").innerHTML = Object.entries(r.emotion_counts)
    .filter(([, n]) => n > 0)
    .map(([e, n]) => "<span>" + e + ": " + n + "</span>")
    .join("") || '<span class="small">No entries yet.</span>';
  $("mlList").innerHTML = r.entries
    .map((e) => '<div class="entry"><b>' + esc(e.title) + '</b><span class="tag">' + e.emotion +
      '</span><div class="small">' + e.date + "</div><div>" + esc(e.content) + "</div></div>")
    .join("");
}

$("mlSave").onclick = async () => {
  const title = $("mlTitle").value.trim(), content = $("mlContent").value.trim();
  if (!title || !content) return;
  const r = await api("/api/mindlog", "POST", { title, content, entry_date: $("mlDate").value });
  $("mlTitle").value = ""; $("mlContent").value = "";
  $("mlCrisis").innerHTML = r.crisis ? '<div class="crisis">' + esc(r.message) + "</div>" : "";
  loadMindlog();
};

$("mlRaw").onclick = async () => {
  const r = await api("/api/mindlog/raw");
  $("mlRawBox").innerHTML = "<div class='small'>This is what the database holds for your latest entries:</div><pre>" +
    esc(JSON.stringify(r.stored, null, 2)) + "</pre>";
};

if (token && userId) begin();
