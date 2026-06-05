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

    const lowerText = text.toLowerCase().trim();
    if (
        lowerText === "hi" ||
        lowerText === "hello" ||
        lowerText === "hey" ||
        lowerText === "start"
        ){

      reply = `
Welcome to TravelBuddy ✈️

I can help you with:
• Trip planning
• Itineraries
• Budget estimates
• Travel tips

Example:
• Plan a 5 day Goa trip under ₹25000
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