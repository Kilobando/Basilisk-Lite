import {
  generateIdentity,
  importIdentity,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  toBase64,
} from "./crypto.js";

const IDENTITY_KEY = "basilisk.identity";
const CONVERSATIONS_KEY = "basilisk.conversations";

export class MessengerState extends EventTarget {
  constructor() {
    super();
    this.identity = null;
    this.conversations = loadJSON(CONVERSATIONS_KEY, []);
    this.activeId = this.conversations[0]?.id || null;
    this.sharedKeys = new Map();
    this.sockets = new Map();
    this.connectionStatus = new Map();
    this.init();
  }

  async init() {
    const saved = loadJSON(IDENTITY_KEY, null);
    if (saved?.publicKey && saved?.privateKey) {
      this.identity = saved;
    } else {
      this.identity = await generateIdentity();
      saveJSON(IDENTITY_KEY, this.identity);
    }
    this.dispatch();
    if (this.activeId) {
      this.connect(this.activeId);
    }
  }

  onChange(fn) {
    this.addEventListener("change", fn);
    return () => this.removeEventListener("change", fn);
  }

  dispatch() {
    this.dispatchEvent(new Event("change"));
  }

  getActiveConversation() {
    return this.conversations.find((c) => c.id === this.activeId) || null;
  }

  setActiveConversation(id) {
    this.activeId = id;
    this.dispatch();
    this.connect(id);
  }

  async startConversation({ id, name, peerPublicKey, relayUrl }) {
    const existing = this.conversations.find((c) => c.id === id);
    if (existing) {
      this.setActiveConversation(existing.id);
      return existing;
    }
    const conversation = {
      id,
      name,
      peerPublicKey,
      relayUrl,
      messages: [],
    };
    this.conversations = [conversation, ...this.conversations];
    saveJSON(CONVERSATIONS_KEY, this.conversations);
    this.setActiveConversation(conversation.id);
    return conversation;
  }

  async ensureSharedKey(conversation) {
    if (this.sharedKeys.has(conversation.id)) return this.sharedKeys.get(conversation.id);
    const { privateKey } = await importIdentity(this.identity.privateKey, this.identity.publicKey);
    const peerPublicKey = await importPublicKey(conversation.peerPublicKey);
    const sharedKey = await deriveSharedKey(privateKey, peerPublicKey);
    this.sharedKeys.set(conversation.id, sharedKey);
    return sharedKey;
  }

  async connect(conversationId) {
    if (!conversationId) return;
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    if (this.sockets.get(conversationId)?.readyState === WebSocket.OPEN) return;

    this.connectionStatus.set(conversationId, "connecting");
    this.dispatch();

    const wsUrl = `${conversation.relayUrl.replace(/\/$/, "")}/?conversation=${encodeURIComponent(conversation.id)}`;
    const socket = new WebSocket(wsUrl);
    this.sockets.set(conversationId, socket);

    socket.addEventListener("open", () => {
      this.connectionStatus.set(conversationId, "online");
      this.dispatch();
    });

    socket.addEventListener("close", () => {
      this.connectionStatus.set(conversationId, "offline");
      this.dispatch();
      setTimeout(() => this.connect(conversationId), 1500);
    });

    socket.addEventListener("error", () => {
      this.connectionStatus.set(conversationId, "offline");
      this.dispatch();
    });

    socket.addEventListener("message", async (event) => {
      const payload = parseJSON(event.data);
      if (!payload || payload.type !== "message") return;
      const sharedKey = await this.ensureSharedKey(conversation);
      try {
        const text = await decryptMessage(sharedKey, payload.ciphertext, payload.iv);
        this.appendMessage(conversationId, {
          id: payload.nonce || crypto.randomUUID(),
          from: payload.sender,
          text,
          createdAt: payload.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to decrypt message", err);
      }
    });
  }

  appendMessage(conversationId, message) {
    const conversations = this.conversations.map((c) =>
      c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c
    );
    this.conversations = conversations;
    saveJSON(CONVERSATIONS_KEY, this.conversations);
    this.dispatch();
  }

  async sendMessage(text) {
    const conversation = this.getActiveConversation();
    if (!conversation) throw new Error("No conversation selected");
    const sharedKey = await this.ensureSharedKey(conversation);
    const socket = this.sockets.get(conversation.id);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected to relay");
    }

    const { ciphertext, iv } = await encryptMessage(sharedKey, text);
    const payload = {
      type: "message",
      sender: this.identity.publicKey,
      ciphertext,
      iv,
      createdAt: new Date().toISOString(),
      nonce: toBase64(crypto.getRandomValues(new Uint8Array(12))),
    };
    socket.send(JSON.stringify(payload));
    this.appendMessage(conversation.id, {
      id: payload.nonce,
      from: this.identity.publicKey,
      text,
      createdAt: payload.createdAt,
      local: true,
    });
  }
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (err) {
    console.warn("Failed to load", key, err);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
