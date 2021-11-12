import { HookParameters, WeatherResponse } from "./types.ts";

const OPEN_WEATHER_MAP_API_URL = `https://api.openweathermap.org/data/2.5/weather`;
const OPEN_WEATHER_MAP_API_KEY = Deno.env.get("OPEN_WEATHER_MAP_API_KEY");
const OPEN_WEATHER_MAP_ICONS_URL = `http://openweathermap.org/img/wn`;

export const weatherCommandHandler = async (params: HookParameters) => {
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
};
