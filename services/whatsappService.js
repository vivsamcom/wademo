const axios = require("axios");

const url =
  `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`;

const headers = {
  Authorization:
    `Bearer ${process.env.ACCESS_TOKEN}`,
  "Content-Type": "application/json"
};

async function sendMessage(to, message) {

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message
      }
    },
    { headers }
  );
}

async function sendWelcomeButtons(to) {

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text:
            "Welcome to TravelBuddy ✈️\n\nChoose an option:"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "PLAN_TRIP",
                title: "Plan Trip"
              }
            },
            {
              type: "reply",
              reply: {
                id: "BUDGET",
                title: "Budget"
              }
            },
            {
              type: "reply",
              reply: {
                id: "TRAVEL_TIPS",
                title: "Travel Tips"
              }
            }
          ]
        }
      }
    },
    { headers }
  );
}

module.exports = {
  sendMessage,
  sendWelcomeButtons
};