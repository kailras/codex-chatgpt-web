import { afterAll, beforeAll, expect, test } from "bun:test";
import { defaultConfig } from "../src/config";
import { startServer } from "../src/server";

let server: ReturnType<typeof startServer>;

beforeAll(() => {
  server = startServer(
    { ...defaultConfig("browser-only"), port: 0 },
    {
      fetchUpstream: async () => Response.json({
        models: [{
          slug: "gpt-chatgpt-only",
          display_name: "ChatGPT only",
          visibility: "list",
          supported_in_api: false,
          supported_reasoning_levels: [{ effort: "medium", description: "Medium" }],
          tool_mode: null,
        }],
      }),
    },
  );
});

afterAll(async () => {
  await server.stop(true);
});

function url(path: string): string {
  const port = server.port;
  if (port === undefined) throw new Error("security test server did not bind a TCP port");
  return `http://127.0.0.1:${port}${path}`;
}

function port(): number {
  const value = server.port;
  if (value === undefined) throw new Error("security test server did not bind a TCP port");
  return value;
}

async function expectForbidden(response: Response): Promise<void> {
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({
    error: { message: "Request Host or Origin is not allowed" },
  });
}

test("rejects an untrusted Host before every HTTP route", async () => {
  for (const path of ["/healthz", "/v1/models", "/v1/responses", "/not-found"]) {
    await expectForbidden(await fetch(url(path), {
      headers: { host: `evil.example:${port()}` },
    }));
  }
});

test("rejects untrusted and null Origin values even with a loopback Host", async () => {
  for (const origin of ["http://attacker.example", "https://127.0.0.1", "null", "not an origin"]) {
    await expectForbidden(await fetch(url("/healthz"), {
      headers: { host: `127.0.0.1:${port()}`, origin },
    }));
  }
});

test("preserves normal loopback requests and the health schema", async () => {
  const health = await fetch(url("/healthz"), {
    headers: { host: `127.0.0.1:${port()}` },
  });
  expect(health.status).toBe(200);
  expect(Object.keys(await health.json()).sort()).toEqual([
    "accepting_turns",
    "active_browser_turns",
    "active_http_turns",
    "last_successful_model_catalog_request_at",
    "mode",
    "pid",
    "port",
    "service",
    "status",
    "successful_model_catalog_requests",
    "uptime",
    "version",
  ]);

  const models = await fetch(url("/v1/models"), {
    headers: {
      host: `127.0.0.1:${port()}`,
      authorization: "Bearer test-codex-token",
    },
  });
  expect(models.status).toBe(200);
  const responses = await fetch(url("/v1/responses"), {
    headers: { host: `127.0.0.1:${port()}` },
  });
  expect(responses.status).toBe(426);
});

test("allows localhost with a loopback Origin and rejects a mismatched Host port", async () => {
  const currentPort = port();
  const otherPort = currentPort === 65535 ? 1 : currentPort + 1;
  const allowed = await fetch(url("/healthz"), {
    headers: {
      host: `localhost:${currentPort}`,
      origin: `http://localhost:${currentPort}`,
    },
  });
  expect(allowed.status).toBe(200);

  await expectForbidden(await fetch(url("/healthz"), {
    headers: {
      host: `127.0.0.1:${currentPort}`,
      origin: `http://localhost:${currentPort}`,
    },
  }));
  await expectForbidden(await fetch(url("/healthz"), {
    headers: {
      host: `127.0.0.1:${currentPort}`,
      origin: `http://127.0.0.1:${otherPort}`,
    },
  }));
  await expectForbidden(await fetch(url("/healthz"), {
    headers: { host: `127.0.0.1:${otherPort}` },
  }));
  await expectForbidden(await fetch(url("/healthz"), {
    headers: { host: "127.0.0.1" },
  }));
});
