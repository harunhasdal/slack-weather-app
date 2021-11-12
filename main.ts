import { listenAndServe } from "https://deno.land/std@0.111.0/http/server.ts";
import { HookParameters, WeatherResponse } from "./types.ts";

const OPEN_WEATHER_MAP_API_URL = `https://api.openweathermap.org/data/2.5/weather`;
const OPEN_WEATHER_MAP_API_KEY = Deno.env.get("OPEN_WEATHER_MAP_API_KEY");
const OPEN_WEATHER_MAP_ICONS_URL = `http://openweathermap.org/img/wn`;

async function handler(request: Request) {
  console.log(`Serving request from`, request.headers.get("user-agent"));
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
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

  const weatherRequestURL = `${OPEN_WEATHER_MAP_API_URL}?q=${params.text}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`;
  const weatherResponse = await fetch(weatherRequestURL, {
    headers: {
      accept: "application/json",
    },
  });

  if (weatherResponse.ok) {
    const weatherData =
      (await weatherResponse.json()) as unknown as WeatherResponse;

    const initialText = `*It's ${weatherData.main.temp} degrees, feels like ${weatherData.main.feels_like} degrees in ${weatherData.name}*"`;
    const iconUrl = `${OPEN_WEATHER_MAP_ICONS_URL}/${weatherData.weather[0].icon}@2x.png`;
    const detailText = `${weatherData.weather[0].main} - ${weatherData.weather[0].description}`;
    const responseBlocks = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: initialText,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: detailText,
          },
          accessory: {
            type: "image",
            image_url: iconUrl,
            alt_text: `${weatherData.weather[0].main}`,
          },
        },
      ],
    };
    return new Response(JSON.stringify(responseBlocks), {
      headers: {
        "content-type": "application/json",
      },
    });
  }
  const serviceUnavailableResponse = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Weather service unavailable",
        },
      },
    ],
  };
  return new Response(JSON.stringify(serviceUnavailableResponse), {
    headers: {
      "content-type": "application/json",
    },
  });
}

console.log("Listening on http://localhost:8000");
await listenAndServe(":8000", handler);
