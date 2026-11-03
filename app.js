const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const promptEl = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const voiceToggle = document.getElementById("voiceToggle");
let history = [];
let voiceReplies = false;
let listening = false;

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "assistant" ? "J" : "H";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const label = document.createElement("b");
  label.textContent = role === "assistant" ? "JARVIS" : "YOU";
  const p = document.createElement("p");
  p.textContent = content;
  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  bubble.append(label, p, time);
  row.append(avatar, bubble);
  messagesEl.append(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function setBusy(busy) {
  sendBtn.disabled = busy;
  sendBtn.textContent = busy ? "…" : "↑";
}
async function sendMessage(text) {
  const value = text.trim();
  if (!value || sendBtn.disabled) return;
  addMessage("user", value);
  history.push({role:"user", content:value});
  promptEl.value = "";
  promptEl.style.height = "auto";
  setBusy(true);
  const waiting = document.createElement("div");
  waiting.className = "message assistant";
  waiting.innerHTML = '<div class="message-avatar">J</div><div class="bubble"><b>JARVIS</b><p>Thinking…</p></div>';
  messagesEl.append(waiting);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  try {
    const response = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:history})
    });
    const data = await response.json();
    waiting.remove();
    if (!response.ok) throw new Error(data.error || "Unable to reach JARVIS.");
    history.push({role:"assistant", content:data.answer});
    addMessage("assistant", data.answer);
    if (voiceReplies && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.answer);
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  } catch (error) {
    waiting.remove();
    addMessage("assistant", error.message);
  } finally { setBusy(false); promptEl.focus(); }
}
form.addEventListener("submit", e => { e.preventDefault(); sendMessage(promptEl.value); });
promptEl.addEventListener("input", () => { promptEl.style.height="auto"; promptEl.style.height=Math.min(promptEl.scrollHeight,120)+"px"; });
promptEl.addEventListener("keydown", e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit();} });
document.querySelectorAll("[data-prompt]").forEach(btn => btn.addEventListener("click",()=>sendMessage(btn.dataset.prompt)));
document.getElementById("newChat").addEventListener("click",()=>{history=[];messagesEl.innerHTML="";addMessage("assistant","New session ready. What would you like to work on?");});
document.getElementById("clearChat").addEventListener("click",()=>{history=[];messagesEl.innerHTML="";addMessage("assistant","Conversation cleared. How can I help?");});
voiceToggle.addEventListener("click",()=>{voiceReplies=!voiceReplies;voiceToggle.innerHTML=`VOICE REPLIES <b>${voiceReplies?"ON":"OFF"}</b>`;});
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-GB"; recognition.interimResults = false;
  recognition.onstart = ()=>{listening=true;micBtn.classList.add("listening");micBtn.textContent="●";};
  recognition.onend = ()=>{listening=false;micBtn.classList.remove("listening");micBtn.textContent="⌁";};
  recognition.onresult = e=>{promptEl.value=e.results[0][0].transcript;form.requestSubmit();};
  recognition.onerror = ()=>{addMessage("assistant","I couldn't hear that clearly. Please try again or type your message.");};
  micBtn.addEventListener("click",()=>{if(listening)recognition.stop();else recognition.start();});
} else {
  micBtn.title="Voice input is not supported in this browser";
  micBtn.addEventListener("click",()=>addMessage("assistant","Voice input is not supported by this browser. Try a current version of Chrome or Safari."));
}
document.getElementById("menuBtn").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
document.getElementById("websiteShortcut").addEventListener("click",()=>addMessage("assistant","Website Builder is planned for the next version. For now, tell me what kind of website you want and I can help design and code it."));
document.getElementById("tasksShortcut").addEventListener("click",()=>addMessage("assistant","Task management is planned for the next version. You can ask me to organise a task list in this conversation."));
