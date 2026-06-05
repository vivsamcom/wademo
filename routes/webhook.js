const express = require("express");

const router = express.Router();

const extractMessage =
  require("../utils/extractMessage");

const {
  getTravelResponse
} = require("../services/aiService");

const {
  sendMessage
} = require("../services/whatsappService");

router.post("/", async (req, res) => {

  try {

    const data =
      extractMessage(req.body);

    if (!data) {
      return res.sendStatus(200);
    }

    const { from, text } = data;

    console.log("User:", from);
    console.log("Message:", text);

    let reply;

    if (text === "/start") {

      reply = `
Welcome to TravelBuddy ✈️

Try:
• Plan a 5 day Goa trip
• Thailand trip under ₹50000
• Bali itinerary for couples
• Best time to visit Japan
      `;

    } else {

      reply =
        await getTravelResponse(text);
    }

    await sendMessage(from, reply);

    res.sendStatus(200);

  } catch (error) {

    console.error(error);

    res.sendStatus(500);
  }
});

module.exports = router;