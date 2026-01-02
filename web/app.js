import { MessengerState } from "./state.js";

const appState = new MessengerState();
const conversationsEl = document.getElementById("conversations");
const identityEl = document.getElementById("identity-key");
const modal = document.getElementById("modal");
const chatContainer = document.getElementById("chat");

document.getElementById("new-convo").addEventListener("click", () => toggleModal(true));
document.getElementById("cancel-modal").addEventListener("click", () => toggleModal(false));
document.getElementById("create-chat").addEventListener("click", handleCreateConversation);

appState.onChange(() => render());
render();

function render() {
  renderIdentity();
  renderConversations();
  renderChat();
}

function renderIdentity() {
  const key = appState.identity?.publicKey || "Loading...";
  identityEl.textContent = key;
}

function renderConversations() {
  conversationsEl.innerHTML = "";
  if (!appState.conversations.length) {
    const empty = document.createElement("p");
    empty.textContent = "No conversations yet.";
    empty.className = "muted";
    conversationsEl.appendChild(empty);
    return;
  }

  for (const conversation of appState.conversations) {
    const item = document.createElement("div");
    item.className = `conversation ${conversation.id === appState.activeId ? "active" : ""}`;
    item.innerHTML = `
      <h3>${conversation.name || "Untitled chat"}</h3>
      <p>${conversation.id}</p>
    `;
    item.addEventListener("click", () => appState.setActiveConversation(conversation.id));
    conversationsEl.appendChild(item);
  }
}

function renderChat() {
  chatContainer.innerHTML = "";
  const conversation = appState.getActiveConversation();
  if (!conversation) {
    const placeholder = document.createElement("div");
    placeholder.className = "empty-state";
    placeholder.innerHTML = `
      <h1>Welcome to Basilisk Lite</h1>
      <p>Start a secure, peer-to-peer conversation. Messages stay on your devices.</p>
    `;
    chatContainer.appendChild(placeholder);
    return;
  }

  const header = document.createElement("div");
  header.className = "chat-header";
  const status = appState.connectionStatus.get(conversation.id) || "offline";
  header.innerHTML = `
    <div class="meta">
      <p class="title">${conversation.name || "Untitled chat"}</p>
      <p class="muted">Conversation ID: ${conversation.id}</p>
    </div>
    <div class="status-bar">
      <span class="status-dot ${status === "online" ? "online" : ""}"></span>
      <span class="muted">${status}</span>
    </div>
  `;

  const share = document.createElement("div");
  share.className = "composer";
  share.innerHTML = `
    <div>
      <p class="muted" style="margin:0 0 6px;">Share your keys out-of-band</p>
      <div class="chip">Your public key</div>
      <p class="mono" style="margin-top:6px;">${appState.identity.publicKey}</p>
      <div class="chip" style="margin-top:10px;">Conversation ID</div>
      <p class="mono" style="margin-top:6px;">${conversation.id}</p>
    </div>
    <button id="copy-invite" class="primary">Copy invite</button>
  `;

  const messages = document.createElement("div");
  messages.className = "messages";
  for (const msg of conversation.messages) {
    const isMe = msg.from === appState.identity.publicKey;
    const bubble = document.createElement("div");
    bubble.className = `bubble ${isMe ? "me" : "them"}`;
    const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    bubble.innerHTML = `
      <div>${escapeHTML(msg.text)}</div>
      <div class="meta">
        <span>${isMe ? "You" : "Peer"}</span>
        <span>${time}</span>
      </div>
    `;
    messages.appendChild(bubble);
  }
  messages.scrollTop = messages.scrollHeight;

  const composer = document.createElement("div");
  composer.className = "composer";
  composer.innerHTML = `
    <textarea id="message-box" placeholder="Type a message..."></textarea>
    <button id="send-btn" class="primary">Send</button>
  `;
  composer.querySelector("#send-btn").addEventListener("click", () => sendMessage());
  composer.querySelector("#message-box").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatContainer.appendChild(header);
  chatContainer.appendChild(share);
  chatContainer.appendChild(messages);
  chatContainer.appendChild(composer);

  share.querySelector("#copy-invite").addEventListener("click", () => {
    const invite = JSON.stringify({
      conversationId: conversation.id,
      yourPublicKey: appState.identity.publicKey,
      relayUrl: conversation.relayUrl,
    });
    navigator.clipboard?.writeText(invite);
    share.querySelector("#copy-invite").textContent = "Copied!";
    setTimeout(() => (share.querySelector("#copy-invite").textContent = "Copy invite"), 1200);
  });
}

async function sendMessage() {
  const textarea = document.getElementById("message-box");
  const text = textarea.value.trim();
  if (!text) return;
  try {
    await appState.sendMessage(text);
    textarea.value = "";
  } catch (err) {
    alert(`Unable to send: ${err.message}`);
  }
}

function toggleModal(show) {
  modal.classList.toggle("hidden", !show);
  if (show) {
    document.getElementById("chat-id").value = crypto.randomUUID();
  }
}

async function handleCreateConversation() {
  const name = document.getElementById("chat-name").value.trim() || "New chat";
  const id = document.getElementById("chat-id").value.trim() || crypto.randomUUID();
  const peerPublicKey = document.getElementById("peer-key").value.trim();
  const relayUrl = document.getElementById("relay-url").value.trim() || "ws://localhost:8787";
  if (!peerPublicKey) {
    alert("Peer public key is required.");
    return;
  }
  await appState.startConversation({ id, name, peerPublicKey, relayUrl });
  toggleModal(false);
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[match] || match;
  });
}
