const BUTTON_IDS = require("../constants/buttonIds");
const locationData = require("../constants/locationData");
const STATES = require("../constants/states");
const parseMessage = require("../utils/messageParser");
const {
  getSession,
  resetSession,
  updateSession
} = require("../sessions/sessionManager");
const {
  getTravelResponse
} = require("../services/aiService");
const {
  generateTravelPdf
} = require("../services/pdfService");
const {
  sendDocument,
  sendLocation,
  sendItineraryButtons,
  sendTextMessage
} = require("../services/whatsappService");
const {
  startPlanTrip,
  handlePlanTrip,
  askModification
} = require("../flows/planTripFlow");
const {
  startBudgetFlow,
  handleBudgetFlow
} = require("../flows/budgetFlow");
const {
  sendMoreMenu,
  handleMoreMenuSelection,
  handleFeatureDestination,
  sendBookingConfirmation,
  startQuote,
  handleQuote
} = require("../flows/moreMenuFlow");
const {
  startQuiz,
  handleQuiz
} = require("../flows/quizFlow");
const {
  sendLocationOptions,
  sendQuoteActionButtons,
  sendMainMenu
} = require("../flows/flowHelpers");

const RESTART_TEXTS = [
  "menu",
  "main menu",
  "restart",
  "start over",
  "hi",
  "hello",
  "start",
  "/start"
];

const PLAN_STATES = [
  STATES.SELECT_DESTINATION,
  STATES.SELECT_DAYS,
  STATES.SELECT_TRAVELLERS,
  STATES.SELECT_TRAVEL_MONTH,
  STATES.SELECT_BUDGET,
  STATES.MODIFICATION,
  STATES.MODIFY_VALUE
];

const BUDGET_STATES = [
  STATES.BUDGET_SELECT_DESTINATION,
  STATES.BUDGET_SELECT_TRAVELLERS,
  STATES.BUDGET_SELECT_DAYS
];

const DESTINATION_FEATURE_STATES = [
  STATES.EXPLORE_DESTINATION,
  STATES.VISA_INFO,
  STATES.WEATHER,
  STATES.BEST_TIME,
  STATES.PACKING_LIST
];

const PDF_FOLLOW_UP_DELAY_MS = 2000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function isRestart(message) {
  if (message.interactiveId) {
    return false;
  }

  return RESTART_TEXTS.includes(
    normalizeText(message.text)
  );
}

function inferTextIntent(message) {
  const text =
    normalizeText(message.text);

  if (text.includes("plan")) {
    return BUTTON_IDS.PLAN_TRIP;
  }

  if (text.includes("budget")) {
    return BUTTON_IDS.BUDGET;
  }

  if (text.includes("more")) {
    return BUTTON_IDS.MORE;
  }

  if (text.includes("explore")) {
    return BUTTON_IDS.EXPLORE_DESTINATION;
  }

  if (text.includes("visa")) {
    return BUTTON_IDS.VISA_INFO;
  }

  if (text.includes("weather")) {
    return BUTTON_IDS.WEATHER;
  }

  if (text.includes("best time")) {
    return BUTTON_IDS.BEST_TIME;
  }

  if (text.includes("packing")) {
    return BUTTON_IDS.PACKING_CHECKLIST;
  }

  if (text.includes("tips")) {
    return BUTTON_IDS.TRAVEL_TIPS;
  }

  if (text.includes("quiz")) {
    return BUTTON_IDS.TRAVEL_QUIZ;
  }

  if (text.includes("agent")) {
    return BUTTON_IDS.CONTACT_AGENT;
  }

  if (text.includes("quote")) {
    return BUTTON_IDS.GET_TRAVEL_QUOTE;
  }

  return null;
}

function getLocationDestination(session) {
  return session.destination ||
    session.quoteData?.destination ||
    null;
}

function getDestinationKey(destination) {
  return (destination || "")
    .trim()
    .toLowerCase();
}

async function sendPdf(to, session) {
  if (!session.itinerary) {
    await sendTextMessage(
      to,
      "No itinerary found. Please generate a trip plan first."
    );
    return false;
  }

  const baseUrl =
    process.env.BASE_URL;

  if (!baseUrl) {
    await sendTextMessage(
      to,
      "PDF sharing needs BASE_URL to be configured. Please ask the admin to set the public app URL."
    );
    return false;
  }

  try {
    const pdfFile =
      await generateTravelPdf(session.itinerary);

    const pdfUrl =
      `${baseUrl.replace(/\/$/, "")}/public/${pdfFile}`;

    await sendDocument(
      to,
      pdfUrl,
      "Travel-Itinerary.pdf"
    );

    return true;
  } catch (error) {
    console.error(
      "PDF send error:",
      error.response?.data || error.message
    );

    await sendTextMessage(
      to,
      "I could not send the PDF right now. Please try again in a moment."
    );

    return false;
  }
}

async function sendLocationFollowUp(to, session) {
  if (session.lastAction === "quote") {
    await sendQuoteActionButtons(to);
    return;
  }

  await sendLocationOptions(to);
}

async function handleLocationRequest(to, session, locationType) {
  const destination =
    getLocationDestination(session);

  if (!destination) {
    await sendTextMessage(
      to,
      "Please plan a trip or share a destination first, then I can send nearby locations."
    );
    await sendMainMenu(to);
    return;
  }

  const destinationKey =
    getDestinationKey(destination);

  const location =
    locationData[destinationKey]?.[locationType];

  if (!location) {
    await sendTextMessage(
      to,
      `I do not have a saved ${locationType} location for ${destination} yet. You can still request a quote or choose another destination.`
    );
    await sendLocationFollowUp(to, session);
    return;
  }

  try {
    await sendLocation(
      to,
      location.latitude,
      location.longitude,
      location.name,
      location.address
    );
  } catch (error) {
    console.error(
      "Location send error:",
      error.response?.data || error.message
    );

    await sendTextMessage(
      to,
      `I could not send the ${locationType} pin right now. Please try again in a moment.`
    );
  }

  await sendLocationFollowUp(to, session);
}

async function handleTopLevelIntent(message, session, intentId) {
  const to =
    message.from;

  if (intentId === BUTTON_IDS.PLAN_TRIP) {
    await startPlanTrip(to);
    return true;
  }

  if (intentId === BUTTON_IDS.BUDGET) {
    await startBudgetFlow(to);
    return true;
  }

  if (intentId === BUTTON_IDS.MORE) {
    updateSession(
      to,
      {
        currentState: STATES.MAIN_MENU
      }
    );

    await sendMoreMenu(to);
    return true;
  }

  if (intentId === BUTTON_IDS.PDF) {
    const pdfSent =
      await sendPdf(to, session);

    if (pdfSent) {
      updateSession(
        to,
        {
          lastAction: "pdf"
        }
      );

      await wait(PDF_FOLLOW_UP_DELAY_MS);
      await sendLocationOptions(to);
    }

    return true;
  }

  if (intentId === BUTTON_IDS.MODIFY) {
    if (!session.itinerary) {
      await sendTextMessage(
        to,
        "No itinerary found. Please plan a trip first."
      );
      return true;
    }

    await askModification(to);
    return true;
  }

  if (intentId === BUTTON_IDS.QUOTE) {
    await startQuote(to, session);
    return true;
  }

  if (intentId === BUTTON_IDS.SEND_HOTEL_LOCATION) {
    await handleLocationRequest(to, session, "hotel");
    return true;
  }

  if (intentId === BUTTON_IDS.SEND_ATTRACTION_LOCATION) {
    await handleLocationRequest(to, session, "attraction");
    return true;
  }

  if (intentId === BUTTON_IDS.SEND_BOOKING_CONFIRMATION) {
    await sendBookingConfirmation(to, session);
    return true;
  }

  if (intentId === BUTTON_IDS.MAIN_MENU) {
    await sendMainMenu(to);
    return true;
  }

  if (intentId === BUTTON_IDS.TRAVEL_QUIZ) {
    await startQuiz(to);
    return true;
  }

  const handledMoreIntent =
    await handleMoreMenuSelection(
      {
        ...message,
        interactiveId: intentId
      },
      session
    );

  return handledMoreIntent;
}

async function handleFreeFormFallback(message) {
  const to =
    message.from;

  await sendTextMessage(
    to,
    "\u{2728} Let me help with that travel request..."
  );

  const reply =
    await getTravelResponse(message.text);

  updateSession(
    to,
    {
      itinerary: reply,
      currentState: STATES.SHOW_ITINERARY
    }
  );

  await sendTextMessage(to, reply);
  await sendItineraryButtons(to);
}

async function handleWebhook(req, res) {
  try {
    const message =
      parseMessage(req.body);

    if (!message) {
      return res.sendStatus(200);
    }

    const session =
      getSession(message.from);

    console.log("User:", message.from);
    console.log("Message:", message.text);
    console.log("Interactive ID:", message.interactiveId);
    console.log("State:", session.currentState);

    if (isRestart(message)) {
      resetSession(message.from);
      await sendMainMenu(message.from);
      return res.sendStatus(200);
    }

    if (message.interactiveId) {
      const handled =
        await handleTopLevelIntent(
          message,
          session,
          message.interactiveId
        );

      if (handled) {
        return res.sendStatus(200);
      }
    }

    if (PLAN_STATES.includes(session.currentState)) {
      await handlePlanTrip(message, session);
      return res.sendStatus(200);
    }

    if (BUDGET_STATES.includes(session.currentState)) {
      await handleBudgetFlow(message, session);
      return res.sendStatus(200);
    }

    if (DESTINATION_FEATURE_STATES.includes(session.currentState)) {
      await handleFeatureDestination(message, session);
      return res.sendStatus(200);
    }

    if (session.currentState === STATES.QUIZ) {
      await handleQuiz(message, session);
      return res.sendStatus(200);
    }

    if (session.currentState === STATES.QUOTE) {
      await handleQuote(message, session);
      return res.sendStatus(200);
    }

    const textIntent =
      inferTextIntent(message);

    if (textIntent) {
      const handled =
        await handleTopLevelIntent(
          message,
          session,
          textIntent
        );

      if (handled) {
        return res.sendStatus(200);
      }
    }

    if (message.text) {
      await handleFreeFormFallback(message);
      return res.sendStatus(200);
    }

    await sendMainMenu(message.from);
    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Webhook error:",
      error.response?.data || error.message
    );

    return res.sendStatus(500);
  }
}

module.exports = {
  handleWebhook
};
