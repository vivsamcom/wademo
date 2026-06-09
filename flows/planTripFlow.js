const BUTTON_IDS = require("../constants/buttonIds");
const STATES = require("../constants/states");
const {
  updateSession
} = require("../sessions/sessionManager");
const {
  generateItinerary
} = require("../services/aiService");
const {
  sendButtons,
  sendItineraryButtons,
  sendTextMessage
} = require("../services/whatsappService");
const {
  getBudgetValue,
  getDestinationFromMessage,
  getMessageId,
  getMessageText,
  parseDays,
  parseTravellers,
  sendBudgetQuestion,
  sendDaysQuestion,
  sendDestinationList,
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

async function startPlanTrip(to) {
  updateSession(
    to,
    {
      destination: null,
      days: null,
      travellers: null,
      travelMonth: null,
      budget: null,
      hotelPreference: null,
      itinerary: null,
      currentState: STATES.SELECT_DESTINATION
    }
  );

  await sendDestinationList(
    to,
    "\u{1F5FA}\u{FE0F} Choose Destination"
  );
}

async function askModification(to) {
  updateSession(
    to,
    {
      currentState: STATES.MODIFICATION,
      pendingModification: null
    }
  );

  await sendButtons(
    to,
    "What would you like to modify?",
    [
      {
        id: BUTTON_IDS.MODIFY_BUDGET,
        title: "\u{1F4B0} Budget"
      },
      {
        id: BUTTON_IDS.MODIFY_HOTEL,
        title: "\u{1F3E8} Hotel"
      },
      {
        id: BUTTON_IDS.MODIFY_DAYS,
        title: "\u{1F4C5} Days"
      }
    ]
  );
}

async function regenerateItinerary(to, session) {
  await sendTextMessage(
    to,
    "\u{2728} Creating your updated TravelBuddy itinerary..."
  );

  const itinerary =
    await generateItinerary(session);

  updateSession(
    to,
    {
      itinerary,
      currentState: STATES.SHOW_ITINERARY
    }
  );

  await sendTextMessage(to, itinerary);
  await sendItineraryButtons(to);
}

async function handlePlanTrip(message, session) {
  const to =
    message.from;

  if (session.currentState === STATES.SELECT_DESTINATION) {
    const selected =
      getDestinationFromMessage(message);

    if (selected.askCustom) {
      await sendTextMessage(
        to,
        "Please type the destination you'd like to visit."
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

    updateSession(
      to,
      {
        destination: selected.destination,
        currentState: STATES.SELECT_DAYS
      }
    );

    await sendDaysQuestion(to);
    return;
  }

  if (session.currentState === STATES.SELECT_DAYS) {
    const days =
      parseDays(message, DAY_IDS);

    if (!days) {
      await sendDaysQuestion(
        to,
        "Please enter number of days between 1 and 60.\nExample: 5"
      );
      return;
    }

    updateSession(
      to,
      {
        days,
        currentState: STATES.SELECT_TRAVELLERS
      }
    );

    await sendTravellersQuestion(to);
    return;
  }

  if (session.currentState === STATES.SELECT_TRAVELLERS) {
    const travellers =
      parseTravellers(message, TRAVELLER_IDS);

    if (!travellers) {
      await sendTravellersQuestion(
        to,
        "Please enter a valid traveller count.\nExample: 2"
      );
      return;
    }

    updateSession(
      to,
      {
        travellers,
        currentState: STATES.SELECT_TRAVEL_MONTH
      }
    );

    await sendTextMessage(
      to,
      "Which month are you planning to travel?\n\nExamples: December, January, March 2027"
    );
    return;
  }

  if (session.currentState === STATES.SELECT_TRAVEL_MONTH) {
    const travelMonth =
      getMessageText(message);

    if (travelMonth.length < 3) {
      await sendTextMessage(
        to,
        "Please enter a valid travel month.\nExample: December or March 2027"
      );
      return;
    }

    updateSession(
      to,
      {
        travelMonth,
        currentState: STATES.SELECT_BUDGET
      }
    );

    await sendBudgetQuestion(to);
    return;
  }

  if (session.currentState === STATES.SELECT_BUDGET) {
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
          budget,
          currentState: STATES.SHOW_ITINERARY
        }
      );

    await regenerateItinerary(to, updatedSession);
    return;
  }

  if (session.currentState === STATES.MODIFICATION) {
    const id =
      getMessageId(message);

    if (id === BUTTON_IDS.MODIFY_BUDGET) {
      updateSession(
        to,
        {
          currentState: STATES.MODIFY_VALUE,
          pendingModification: "budget"
        }
      );

      await sendBudgetQuestion(to);
      return;
    }

    if (id === BUTTON_IDS.MODIFY_HOTEL) {
      updateSession(
        to,
        {
          currentState: STATES.MODIFY_VALUE,
          pendingModification: "hotelPreference"
        }
      );

      await sendButtons(
        to,
        "Choose hotel preference, or type your own.",
        [
          {
            id: BUTTON_IDS.HOTEL_3_STAR,
            title: "3 Star"
          },
          {
            id: BUTTON_IDS.HOTEL_4_STAR,
            title: "4 Star"
          },
          {
            id: BUTTON_IDS.HOTEL_5_STAR,
            title: "5 Star"
          }
        ]
      );
      return;
    }

    if (id === BUTTON_IDS.MODIFY_DAYS) {
      updateSession(
        to,
        {
          currentState: STATES.MODIFY_VALUE,
          pendingModification: "days"
        }
      );

      await sendDaysQuestion(to);
      return;
    }

    await sendTextMessage(
      to,
      "Please choose what to modify: Budget, Hotel, or Days."
    );
    await askModification(to);
    return;
  }

  if (session.currentState === STATES.MODIFY_VALUE) {
    const pending =
      session.pendingModification;

    const id =
      getMessageId(message);

    let value =
      getMessageText(message);

    if (pending === "budget") {
      value =
        getBudgetValue(message);
    }

    if (pending === "hotelPreference") {
      const hotelValues = {
        [BUTTON_IDS.HOTEL_3_STAR]: "3 Star",
        [BUTTON_IDS.HOTEL_4_STAR]: "4 Star",
        [BUTTON_IDS.HOTEL_5_STAR]: "5 Star"
      };

      value =
        hotelValues[id] || value;
    }

    if (pending === "days") {
      value =
        parseDays(message, DAY_IDS);

      if (!value) {
        await sendDaysQuestion(
          to,
          "Please enter number of days between 1 and 60.\nExample: 5"
        );
        return;
      }
    }

    if (!value) {
      await sendTextMessage(
        to,
        "Please enter a valid modification value."
      );
      return;
    }

    const updatedSession =
      updateSession(
        to,
        {
          [pending]: value,
          pendingModification: null
        }
      );

    await regenerateItinerary(to, updatedSession);
  }
}

module.exports = {
  startPlanTrip,
  handlePlanTrip,
  askModification
};
