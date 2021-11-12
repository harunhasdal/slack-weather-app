import { listenAndServe } from "https://deno.land/std@0.111.0/http/server.ts";
import { HookParameters, WeatherResponse } from "./types.ts";
import { weatherCommandHandler } from "./weather-command-handler.ts";
import { crypto } from "https://deno.land/std@0.111.0/crypto/mod.ts";

const SLACK_SIGNING_KEY = Deno.env.get("SLACK_SIGNING_KEY");

async function slackSlashCommandHandler(request: Request) {
  console.log(`Serving request from`, request.headers.get("user-agent"));
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }
  const requestSignature = request.headers.get("x-slack-signature") as string;
  const textEncoder = new TextEncoder();
  const verified = await crypto.subtle.verify?.(
    { name: "HMAC" },
    SLACK_SIGNING_KEY,
    textEncoder.encode(requestSignature),
    textEncoder.encode(JSON.stringify(request.body))
  );

  if (!verified) {
    return new Response(null, {
      status: 403,
      statusText: "Invalid signature",
    });
  }

  const contentType = request.headers.get("content-type");
  if (
    !(
      contentType?.includes("application/x-www-form-urlencoded") ||
      contentType?.includes("multipart/form-data")
    )
  ) {
    return new Response(null, {
      status: 400,
      statusText: "Content-Type not supported",
    });
  }
  // Handle request.
  const formData = await request.formData();
  const params = Object.fromEntries(formData) as unknown as HookParameters;

  return weatherCommandHandler(params);
}

console.log("Listening on http://localhost:8000");
await listenAndServe(":8000", slackSlashCommandHandler);
