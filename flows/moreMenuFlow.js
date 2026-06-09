const BUTTON_IDS = require("../constants/buttonIds");
const {
  NEXT_STEPS_TEXT
} = require("../constants/messages");
const STATES = require("../constants/states");
const visaData = require("../constants/visaData");
const {
  updateSession
} = require("../sessions/sessionManager");
const {
  createLead
} = require("../services/leadService");
const {
  exploreDestination,
  getBestTimeToVisit,
  getPackingChecklist,
  getTravelTips
} = require("../services/aiService");
const {
  getCurrentWeather
} = require("../services/weatherService");
const {
  sendButtons,
  sendListMessage,
  sendTextMessage
} = require("../services/whatsappService");
const {
  getBudgetValue,
  getDestinationFromMessage,
  getMessageText,
  parseDays,
  parseTravellers,
  sendBudgetQuestion,
  sendDaysQuestion,
  sendDestinationList,
  sendMainMenu,
  sendTravellersQuestion
} = require("./flowHelpers");

const DAY_IDS = {
  [BUTTON_IDS.DAYS_3]: 3,
  [BUTTON_IDS.DAYS_5]: 5,
  [BUTTON_IDS.DAYS_7]: 7
};

const TRAVELLER_IDS = {
  [BUTTON_IDS.TRAVELLERS_SOLO]: "Solo",
  [BUTTON_IDS.TRAVELLERS_COUPLE]: "Couple",
  [BUTTON_IDS.TRAVELLERS_FAMILY]: "Family"
};

async function sendMoreMenu(to) {
  await sendListMessage(
    to,
    "\u{1F4CB} More Travel Services\n\nChoose an option, or type what you need.",
    "View",
    [
      {
        title: "Travel Information",
        rows: [
          {
            id: BUTTON_IDS.EXPLORE_DESTINATION,
            title: "Explore Places",
            description: "Attractions, food, stay areas"
          },
          {
            id: BUTTON_IDS.VISA_INFO,
            title: "Visa Information",
            description: "Basic visa guidance"
          },
          {
            id: BUTTON_IDS.WEATHER,
            title: "Weather",
            description: "Current destination weather"
          },
          {
            id: BUTTON_IDS.BEST_TIME,
            title: "Best Time",
            description: "Best months and seasons"
          }
        ]
      },
      {
        title: "Travel Tools",
        rows: [
          {
            id: BUTTON_IDS.PACKING_CHECKLIST,
            title: "Packing Checklist",
            description: "Destination-specific checklist"
          },
          {
            id: BUTTON_IDS.TRAVEL_TIPS,
            title: "Travel Tips",
            description: "Safety, currency, food, transport"
          },
          {
            id: BUTTON_IDS.TRAVEL_QUIZ,
            title: "Travel Quiz",
            description: "Get a destination recommendation"
          }
        ]
      },
      {
        title: "Support",
        rows: [
          {
            id: BUTTON_IDS.CONTACT_AGENT,
            title: "Contact Agent",
            description: "Request a consultant callback"
          },
          {
            id: BUTTON_IDS.GET_TRAVEL_QUOTE,
            title: "Get Travel Quote",
            description: "Share details for a quote"
          }
        ]
      }
    ]
  );
}

async function askDestinationForFeature(to, state, introText) {
  updateSession(
    to,
    {
      currentState: state
    }
  );

  await sendDestinationList(to, introText);
}

function createLeadFromSession(session, source) {
  return createLead(
    {
      phoneNumber: session.phoneNumber,
      destination: session.destination,
      days: session.days,
      travellers: session.travellers,
      travelMonth: session.travelMonth,
      budget: session.budget,
      itinerarySummary: session.itinerary
        ? session.itinerary.slice(0, 300)
        : null,
      source
    }
  );
}

async function handleContactAgent(to, session) {
  createLeadFromSession(session, "contact-agent");

  await sendTextMessage(
    to,
    "\u{1F4AC} A travel consultant will contact you shortly."
  );
  await sendMainMenu(to, NEXT_STEPS_TEXT);
}

async function handleTravelTips(to, session) {
  await sendTextMessage(
    to,
    "\u{1F4A1} Preparing travel tips..."
  );

  const tips =
    await getTravelTips(session.destination);

  await sendTextMessage(to, tips);
  await sendMainMenu(to, NEXT_STEPS_TEXT);
}

async function handleFeatureDestination(message, session) {
  const to =
    message.from;

  const selected =
    getDestinationFromMessage(message);

  if (selected.askCustom) {
    await sendTextMessage(
      to,
      "Please type the destination."
    );
    return;
  }

  if (!selected.destination) {
    await sendDestinationList(
      to,
      "Please choose or type a destination."
    );
    return;
  }

  const destination =
    selected.destination;

  updateSession(
    to,
    {
      destination,
      currentState: STATES.MAIN_MENU
    }
  );

  if (session.currentState === STATES.EXPLORE_DESTINATION) {
    await sendTextMessage(
      to,
      "\u{1F4CD} Exploring destination..."
    );

    const response =
      await exploreDestination(destination);

    await sendTextMessage(to, response);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
    return;
  }

  if (session.currentState === STATES.VISA_INFO) {
    const info =
      visaData[destination.toLowerCase()];

    if (!info) {
      await sendTextMessage(
        to,
        `\u{1F4C4} Visa Information

Detailed visa data for ${destination} is not available yet.

- Check official embassy or immigration websites
- Confirm rules before booking
- A TravelBuddy agent can help with updated guidance`
      );
      await sendMainMenu(to, NEXT_STEPS_TEXT);
      return;
    }

    await sendTextMessage(
      to,
      `\u{1F4C4} Visa Information: ${info.destination}

Visa required: ${info.visaRequired}
Processing time: ${info.processingTime}
Stay duration: ${info.stayDuration}`
    );
    await sendMainMenu(to, NEXT_STEPS_TEXT);
    return;
  }

  if (session.currentState === STATES.WEATHER) {
    const weather =
      await getCurrentWeather(destination);

    await sendTextMessage(to, weather);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
    return;
  }

  if (session.currentState === STATES.BEST_TIME) {
    await sendTextMessage(
      to,
      "\u{1F5D3}\u{FE0F} Checking the best time to visit..."
    );

    const response =
      await getBestTimeToVisit(destination);

    await sendTextMessage(to, response);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
    return;
  }

  if (session.currentState === STATES.PACKING_LIST) {
    await sendTextMessage(
      to,
      "\u{1F392} Creating your packing checklist..."
    );

    const response =
      await getPackingChecklist(destination);

    await sendTextMessage(to, response);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
  }
}

async function startQuote(to, session) {
  const quoteData = {
    destination: session.destination,
    days: session.days,
    travellers: session.travellers,
    travelMonth: session.travelMonth,
    budget: session.budget
  };

  const updatedSession =
    updateSession(
      to,
      {
        currentState: STATES.QUOTE,
        quoteData
      }
    );

  await continueQuote(to, updatedSession);
}

async function continueQuote(to, session) {
  const quoteData =
    session.quoteData || {};

  if (!quoteData.destination) {
    updateSession(
      to,
      {
        quoteStep: "destination"
      }
    );

    await sendDestinationList(
      to,
      "\u{1F4DD} Get Travel Quote\n\nChoose destination"
    );
    return;
  }

  if (!quoteData.days) {
    updateSession(
      to,
      {
        quoteStep: "days"
      }
    );

    await sendDaysQuestion(to);
    return;
  }

  if (!quoteData.travellers) {
    updateSession(
      to,
      {
        quoteStep: "travellers"
      }
    );

    await sendTravellersQuestion(to);
    return;
  }

  if (!quoteData.travelMonth) {
    updateSession(
      to,
      {
        quoteStep: "travelMonth"
      }
    );

    await sendTextMessage(
      to,
      "Which month are you planning to travel?\n\nExamples: December, January, March 2027"
    );
    return;
  }

  if (!quoteData.budget) {
    updateSession(
      to,
      {
        quoteStep: "budget"
      }
    );

    await sendBudgetQuestion(to);
    return;
  }

  createLead(
    {
      phoneNumber: to,
      destination: quoteData.destination,
      days: quoteData.days,
      travellers: quoteData.travellers,
      travelMonth: quoteData.travelMonth,
      budget: quoteData.budget,
      itinerarySummary: session.itinerary
        ? session.itinerary.slice(0, 300)
        : null,
      source: "quote"
    }
  );

  updateSession(
    to,
    {
      destination: quoteData.destination,
      days: quoteData.days,
      travellers: quoteData.travellers,
      travelMonth: quoteData.travelMonth,
      budget: quoteData.budget,
      currentState: STATES.MAIN_MENU,
      quoteStep: null,
      quoteData: null
    }
  );

  await sendTextMessage(
    to,
    `\u{1F4DD} Travel Quote Request

Destination: ${quoteData.destination}
Days: ${quoteData.days}
Travellers: ${quoteData.travellers}
Travel month: ${quoteData.travelMonth}
Budget: ${quoteData.budget}

Your quote request has been saved. A consultant will contact you shortly.`
  );
  await sendMainMenu(to, NEXT_STEPS_TEXT);
}

async function handleQuote(message, session) {
  const to =
    message.from;

  const quoteData =
    session.quoteData || {};

  if (session.quoteStep === "destination") {
    const selected =
      getDestinationFromMessage(message);

    if (selected.askCustom) {
      await sendTextMessage(
        to,
        "Please type the destination for your quote."
      );
      return;
    }

    if (!selected.destination) {
      await sendDestinationList(
        to,
        "Please choose or type a destination."
      );
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          quoteData: {
            ...quoteData,
            destination: selected.destination
          }
        }
      );

    await continueQuote(to, updatedSession);
    return;
  }

  if (session.quoteStep === "days") {
    const days =
      parseDays(message, DAY_IDS);

    if (!days) {
      await sendDaysQuestion(
        to,
        "Please enter number of days between 1 and 60.\nExample: 5"
      );
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          quoteData: {
            ...quoteData,
            days
          }
        }
      );

    await continueQuote(to, updatedSession);
    return;
  }

  if (session.quoteStep === "travellers") {
    const travellers =
      parseTravellers(message, TRAVELLER_IDS);

    if (!travellers) {
      await sendTravellersQuestion(
        to,
        "Please enter a valid traveller count.\nExample: 2"
      );
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          quoteData: {
            ...quoteData,
            travellers
          }
        }
      );

    await continueQuote(to, updatedSession);
    return;
  }

  if (session.quoteStep === "travelMonth") {
    const travelMonth =
      getMessageText(message);

    if (travelMonth.length < 3) {
      await sendTextMessage(
        to,
        "Please enter a valid travel month.\nExample: March 2027"
      );
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          quoteData: {
            ...quoteData,
            travelMonth
          }
        }
      );

    await continueQuote(to, updatedSession);
    return;
  }

  if (session.quoteStep === "budget") {
    const budget =
      getBudgetValue(message);

    if (!budget) {
      await sendBudgetQuestion(to);
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          quoteData: {
            ...quoteData,
            budget
          }
        }
      );

    await continueQuote(to, updatedSession);
  }
}

async function handleMoreMenuSelection(message, session) {
  const to =
    message.from;

  const id =
    message.interactiveId;

  if (id === BUTTON_IDS.EXPLORE_DESTINATION) {
    await askDestinationForFeature(
      to,
      STATES.EXPLORE_DESTINATION,
      "\u{1F4CD} Explore Destination\n\nChoose destination"
    );
    return true;
  }

  if (id === BUTTON_IDS.VISA_INFO) {
    await askDestinationForFeature(
      to,
      STATES.VISA_INFO,
      "\u{1F4C4} Visa Information\n\nChoose destination"
    );
    return true;
  }

  if (id === BUTTON_IDS.WEATHER) {
    await askDestinationForFeature(
      to,
      STATES.WEATHER,
      "\u{1F324}\u{FE0F} Weather\n\nChoose destination"
    );
    return true;
  }

  if (id === BUTTON_IDS.BEST_TIME) {
    await askDestinationForFeature(
      to,
      STATES.BEST_TIME,
      "\u{1F5D3}\u{FE0F} Best Time To Visit\n\nChoose destination"
    );
    return true;
  }

  if (id === BUTTON_IDS.PACKING_CHECKLIST) {
    await askDestinationForFeature(
      to,
      STATES.PACKING_LIST,
      "\u{1F392} Packing Checklist\n\nChoose destination"
    );
    return true;
  }

  if (id === BUTTON_IDS.TRAVEL_TIPS) {
    await handleTravelTips(to, session);
    return true;
  }

  if (id === BUTTON_IDS.CONTACT_AGENT) {
    await handleContactAgent(to, session);
    return true;
  }

  if (id === BUTTON_IDS.GET_TRAVEL_QUOTE) {
    await startQuote(to, session);
    return true;
  }

  return false;
}

module.exports = {
  sendMoreMenu,
  handleMoreMenuSelection,
  handleFeatureDestination,
  handleContactAgent,
  startQuote,
  handleQuote
};
