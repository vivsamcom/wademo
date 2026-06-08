const express = require("express");

const router = express.Router();

const extractMessage =
  require("../utils/extractMessage");

const {
  getTravelResponse
} = require("../services/aiService");

const {
  generateTravelPdf
} = require("../services/pdfService");

const {
  sendMessage,
  sendWelcomeButtons,
  sendDocument,
  sendItineraryButtons
} = require("../services/whatsappService");

const userTrips = new Map();
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
/*
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
      */
      await sendWelcomeButtons(from);
      return res.sendStatus(200);

    } else {

      if (text === "PLAN_TRIP") {
      await sendMessage(
        from,
        `✈️ Tell me:

    • Destination
    • Dates
    • Budget
    • Number of travellers

    Example:
    Goa for 5 days under ₹25000`
      );

      return res.sendStatus(200);
    }

    if (text === "BUDGET") {

      await sendMessage(
        from,
        `💰 Tell me:

    • Destination
    • Number of days
    • Number of travellers

    I'll estimate the budget.`
      );

      return res.sendStatus(200);
    }

    if (text === "TRAVEL_TIPS") {

      await sendMessage(
        from,
        `🌍 Travel Tips

    • Book flights early
    • Carry digital copies of documents
    • Keep emergency cash
    • Check weather before travel`
      );

      return res.sendStatus(200);
    }
    if (text === "DOWNLOAD_PDF") {

      const itinerary =
        userTrips.get(from);

      if (!itinerary) {

        await sendMessage(
          from,
          "No itinerary found. Please generate a trip plan first."
        );

        return res.sendStatus(200);
      }

      const pdfFile =
        await generateTravelPdf(itinerary);

      const pdfUrl =
        `${process.env.BASE_URL}/public/${pdfFile}`;

      await sendDocument(
        from,
        pdfUrl,
        "Travel-Itinerary.pdf"
      );

      return res.sendStatus(200);
    }
    if (text === "MAIN_MENU") {

      await sendWelcomeButtons(from);

      return res.sendStatus(200);
    }
 
    /*
    const pdfFile =
      await generateTravelPdf(reply);

    const pdfUrl =
      `${process.env.BASE_URL}/public/${pdfFile}`;

    await sendDocument(
      from,
      pdfUrl,
      "Travel-Itinerary.pdf"
    ); */
      reply =
        await getTravelResponse(text);

      userTrips.set(from, reply);

    }

    
    await sendMessage(from, reply);

    await sendItineraryButtons(from);

    res.sendStatus(200);

  } catch (error) {

    console.error(error);

    res.sendStatus(500);
  }
});

module.exports = router;