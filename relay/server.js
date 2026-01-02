import http from "node:http";
import url from "node:url";
import crypto from "node:crypto";

const PORT = process.env.RELAY_PORT || 8787;
const channels = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", message: "Basilisk relay online" }));
});

server.on("upgrade", (req, socket) => {
  const { query } = url.parse(req.url || "", true);
  const conversationId = String(query.conversation || "").trim();
  if (!conversationId) {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  const accept = createAcceptKey(String(key));
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n",
    ].join("\r\n")
  );

  const peers = channels.get(conversationId) || new Set();
  peers.add(socket);
  channels.set(conversationId, peers);

  socket.on("data", (chunk) => {
    const frame = decodeFrame(chunk);
    if (!frame) return;
    if (frame.opcode === 0x8) {
      socket.end();
      return;
    }
    if (frame.opcode !== 0x1) return; // only text
    for (const peer of peers) {
      if (peer === socket) continue;
      try {
        peer.write(encodeFrame(frame.data));
      } catch (err) {
        console.error("Failed to write to peer:", err);
      }
    }
  });

  socket.on("close", () => cleanup(conversationId, socket));
  socket.on("end", () => cleanup(conversationId, socket));
  socket.on("error", () => cleanup(conversationId, socket));
});

server.listen(PORT, () => {
  console.log(`Relay listening on ws://localhost:${PORT}`);
});

function cleanup(conversationId, socket) {
  const peers = channels.get(conversationId);
  if (!peers) return;
  peers.delete(socket);
  if (!peers.size) {
    channels.delete(conversationId);
  }
}

function createAcceptKey(key) {
  return crypto
    .createHash("sha1")
    .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "binary")
    .digest("base64");
}

function decodeFrame(buffer) {
  if (!buffer || buffer.length < 2) return null;
  const first = buffer[0];
  const second = buffer[1];
  const opcode = first & 0x0f;
  let offset = 2;
  let payloadLength = second & 0x7f;

  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    payloadLength = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }

  const masked = Boolean(second & 0x80);
  let maskingKey;
  if (masked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  const payload = buffer.slice(offset, offset + payloadLength);
  let data = payload;
  if (masked && maskingKey) {
    data = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i += 1) {
      data[i] = payload[i] ^ maskingKey[i % 4];
    }
  }

  return { opcode, data: data.toString("utf8") };
}

function encodeFrame(message) {
  const payload = Buffer.from(message, "utf8");
  const length = payload.length;
  let header;

  if (length < 126) {
    header = Buffer.from([0x81, length]);
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}
