const BUTTON_IDS = require("../constants/buttonIds");
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
  startQuote,
  handleQuote
} = require("../flows/moreMenuFlow");
const {
  startQuiz,
  handleQuiz
} = require("../flows/quizFlow");
const {
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

async function sendPdf(to, session) {
  if (!session.itinerary) {
    await sendTextMessage(
      to,
      "No itinerary found. Please generate a trip plan first."
    );
    return;
  }

  const baseUrl =
    process.env.BASE_URL;

  if (!baseUrl) {
    await sendTextMessage(
      to,
      "PDF sharing needs BASE_URL to be configured. Please ask the admin to set the public app URL."
    );
    return;
  }

  const pdfFile =
    await generateTravelPdf(session.itinerary);

  const pdfUrl =
    `${baseUrl.replace(/\/$/, "")}/public/${pdfFile}`;

  await sendDocument(
    to,
    pdfUrl,
    "Travel-Itinerary.pdf"
  );
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
    await sendPdf(to, session);
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
