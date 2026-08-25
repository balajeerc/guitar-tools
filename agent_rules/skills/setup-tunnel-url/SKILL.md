---
name: setup-tunnel-url
description: Start this project's development server and expose it through a temporary public HTTPS URL. Use when the user asks for a tunnel, public preview, shareable development link, trycloudflare URL, or remote access to the locally running guitar-tools app.
---

# Set Up Tunnel URL

Create a temporary Cloudflare Quick Tunnel to the actual Vite port and return the URL only after the edge connection is registered.

## Safety gate

1. Explain that a public tunnel exposes the development server, including any source files or development endpoints it serves, to an untrusted public URL.
2. Obtain the user's explicit approval after stating that risk. A bare request for a URL may not satisfy an execution environment's approval reviewer.
3. Request elevated/network permission for the server or tunnel command when the environment requires it.

Do not use a different tunnel provider without separately informing the user and obtaining approval for that provider.

## Start or find the Vite server

1. Inspect `package.json` and `vite.config.js`; do not assume a command or port from memory.
2. Check for an existing persistent development-server session before starting another one, including sessions left alive after an interrupted turn.
3. Otherwise, start `pnpm dev` in a persistent PTY/session from the repository root.
4. Read Vite's output and capture the port it actually selected. The configured port is `19090`, but Vite increments it when occupied; a second server commonly starts on `19091`.
5. Treat `sh: 1: fuser: not found` as non-fatal in this project because the script uses `fuser ... || true` and Vite continues afterward.
6. Confirm the local server is ready before tunneling. Keep its session alive.

Never point the tunnel at the configured port without checking the running server's output.

## Start Cloudflare with the reliable transport

Run this in a second persistent PTY/session, substituting the actual Vite port:

```bash
cloudflared tunnel --protocol http2 --edge-ip-version 4 --url http://127.0.0.1:<port> --no-autoupdate
```

Use these flags on the first attempt:

- `--protocol http2`: the default QUIC transport uses UDP port 7844, which this environment blocks with `sendmsg: operation not permitted`.
- `--edge-ip-version 4`: IPv6 edge connections time out here even when HTTP/2 is selected.
- `--no-autoupdate`: shell-launched cloudflared cannot update itself and does not need to for a temporary tunnel.

Do not start with QUIC, wait for it to fail, and then switch. Do not omit the IPv4 constraint.

## Wait for real readiness

Cloudflare prints the public URL before it connects to an edge. Do not share the URL at that point.

1. Save the `https://...trycloudflare.com` URL from `Your quick Tunnel has been created`.
2. Poll the same tunnel session in intervals no longer than 30 seconds.
3. Keep the user updated at least once per minute.
4. Wait for this definitive success line:

```text
Registered tunnel connection ... protocol=http2
```

Edge port 7844 is intermittently reachable. Several `DialContext ... i/o timeout` messages and retries can occur before a working edge is selected. Allow up to 120 seconds before deciding the connection is blocked. Avoid restarting during ordinary retries because every restart invalidates the old URL and allocates a new one.

The following messages are expected and do not prevent normal HTTP forwarding:

- missing `config.yml` or `config.yaml`;
- `ping_group_range` warnings;
- ICMP proxy disabled;
- Cloudflare API or automatic-update precheck failure;
- isolated regional HTTP/2 precheck failures;
- transient TCP port 7844 timeouts followed by retry.

If the process exits or never registers after the full wait, report the transport failure. Do not present an allocated-but-unregistered URL as live.

## Verify and return the URL

1. Confirm the Vite session and registered tunnel session are both still running.
2. If external verification is available, request the public URL. A local `curl` may be intercepted by the environment's `tinyproxy` and return `HTTP 403 Filtered`; that result does not prove the Cloudflare tunnel failed. The registration line remains the primary readiness signal.
3. Return only the URL from the currently active tunnel process. Discard URLs belonging to stopped or failed attempts.
4. Add a requested hash route when useful, such as `/#melodies`; otherwise return the base URL.
5. Mention that the Quick Tunnel is temporary and remains available only while both persistent sessions run.

Prefer HTTPS tunnel URLs over the server's direct HTTP network address. Browser microphone APIs require a secure context, so a direct `http://<ip>:<port>` preview cannot fully test Melodies, Listener, or Tuner.

## Stop the preview

When the user asks to stop the tunnel, send an interrupt to the tunnel session and then to the development-server session. Confirm that both processes exited. Never kill unrelated listeners merely because they use a nearby port.
