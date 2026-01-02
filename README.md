# Basilisk Lite

Privacy-first, peer-to-peer messenger with a self-hosted WebSocket relay. Messages are end-to-end encrypted in the browser and never stored on the relay.

## Features
- Clean, desktop-friendly messenger UI
- Local identity creation and storage (no server accounts)
- Peer-to-peer encryption using ECDH (P-256) + AES-GCM
- Self-hosted relay that forwards opaque ciphertext frames without persistence
- Conversation invites that include only the public key, conversation ID, and relay URL

## Getting started
1. Run the relay:
   ```bash
   npm run relay
   ```
   The relay listens on `ws://localhost:8787` by default.

2. Serve the UI:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in a desktop browser. Each tab or device can join the same conversation.

3. Start chatting:
   - Click **New chat**, set a chat name, conversation ID (shared secret), peer public key, and relay URL.
   - Share your public key and conversation ID out-of-band with your partner.
   - Messages stay encrypted between peers; the relay only forwards ciphertext.

## Scripts
- `npm run dev` — starts a lightweight static server for the UI.
- `npm run relay` — starts the stateless WebSocket relay.
- `npm run lint` — verifies required project files exist.

## Notes
- Identities and conversations persist in `localStorage` in your browser profile.
- The relay keeps no logs or history; it only relays WebSocket frames for active conversations.
