const axios = require("axios");

async function getCurrentWeather(destination) {
  const apiKey =
    process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return `\u{1F324}\u{FE0F} Weather Update

I do not have live weather access configured yet.

Please check the current forecast before travelling to ${destination}.`;
  }

  try {
    const response =
      await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
          params: {
            q: destination,
            appid: apiKey,
            units: "metric"
          }
        }
      );

    const weather =
      response.data;

    return `\u{1F324}\u{FE0F} Current Weather

Destination: ${weather.name}
Temperature: ${Math.round(weather.main.temp)} C
Humidity: ${weather.main.humidity}%
Conditions: ${weather.weather[0].description}`;
  } catch (error) {
    console.error(
      "Weather API error:",
      error.response?.data || error.message
    );

    return `\u{1F324}\u{FE0F} Weather Update

I could not fetch live weather for ${destination} right now.

Please check a weather app before finalizing your plans.`;
  }
}

module.exports = {
  getCurrentWeather
};
