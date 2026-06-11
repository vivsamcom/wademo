const BUTTON_IDS = require("../constants/buttonIds");
const {
  WELCOME_MENU_TEXT
} = require("../constants/messages");
const {
  DESTINATION_SECTIONS,
  getDestinationById
} = require("../constants/destinations");
const {
  sendButtons,
  sendListMessage,
  sendTextMessage
} = require("../services/whatsappService");

function getMessageText(message) {
  return (message.text || "").trim();
}

function getMessageId(message) {
  return message.interactiveId;
}

function getDestinationFromMessage(message) {
  const id =
    getMessageId(message);

  if (id === BUTTON_IDS.DEST_OTHER) {
    return {
      askCustom: true,
      destination: null
    };
  }

  const destinationById =
    getDestinationById(id);

  if (destinationById) {
    return {
      askCustom: false,
      destination: destinationById
    };
  }

  const text =
    getMessageText(message);

  return {
    askCustom: false,
    destination: text || null
  };
}

function parseDays(message, allowedIds) {
  const id =
    getMessageId(message);

  if (allowedIds?.[id]) {
    return allowedIds[id];
  }

  const value =
    Number.parseInt(getMessageText(message), 10);

  if (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 60
  ) {
    return value;
  }

  return null;
}

function parseTravellers(message, allowedIds) {
  const id =
    getMessageId(message);

  if (allowedIds?.[id]) {
    return allowedIds[id];
  }

  const value =
    Number.parseInt(getMessageText(message), 10);

  if (
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  return null;
}

async function sendDestinationList(to, introText) {
  await sendListMessage(
    to,
    `${introText}\n\nYou can also type any destination.`,
    "Choose",
    DESTINATION_SECTIONS
  );
}

async function sendDaysQuestion(to, prefix) {
  const text =
    `${prefix || "How many days?"}\n\nOr type your own number of days.`;

  await sendButtons(
    to,
    text,
    [
      {
        id: BUTTON_IDS.DAYS_3,
        title: "3 Days"
      },
      {
        id: BUTTON_IDS.DAYS_5,
        title: "5 Days"
      },
      {
        id: BUTTON_IDS.DAYS_7,
        title: "7 Days"
      }
    ]
  );
}

async function sendTravellersQuestion(to, prefix) {
  const text =
    `${prefix || "Who is travelling?"}\n\nOr type number of travellers.`;

  await sendButtons(
    to,
    text,
    [
      {
        id: BUTTON_IDS.TRAVELLERS_SOLO,
        title: "\u{1F464} Solo"
      },
      {
        id: BUTTON_IDS.TRAVELLERS_COUPLE,
        title: "\u{1F491} Couple"
      },
      {
        id: BUTTON_IDS.TRAVELLERS_FAMILY,
        title: "\u{1F46A} Family"
      }
    ]
  );
}

async function sendBudgetQuestion(to) {
  await sendButtons(
    to,
    "Do you have a budget in mind?\n\nYou can also type an amount like INR 50000 or $1500.",
    [
      {
        id: BUTTON_IDS.BUDGET_FRIENDLY,
        title: "\u{1F4B8} Budget Friendly"
      },
      {
        id: BUTTON_IDS.BUDGET_MID_RANGE,
        title: "\u{2696}\u{FE0F} Mid Range"
      },
      {
        id: BUTTON_IDS.BUDGET_LUXURY,
        title: "\u{1F48E} Luxury"
      }
    ]
  );
}

async function sendMainMenu(to, message) {
  await sendButtons(
    to,
    message || WELCOME_MENU_TEXT,
    [
      {
        id: BUTTON_IDS.PLAN_TRIP,
        title: "\u{2708}\u{FE0F} Plan Trip"
      },
      {
        id: BUTTON_IDS.BUDGET,
        title: "\u{1F4B0} Budget"
      },
      {
        id: BUTTON_IDS.MORE,
        title: "\u{1F4CB} More"
      }
    ]
  );
}

async function sendLocationOptions(to) {
  await sendButtons(
    to,
    "Would you like nearby travel locations?",
    [
      {
        id: BUTTON_IDS.SEND_HOTEL_LOCATION,
        title: "\u{1F4CD} Hotel"
      },
      {
        id: BUTTON_IDS.SEND_ATTRACTION_LOCATION,
        title: "\u{1F3D6} Attraction"
      },
      {
        id: BUTTON_IDS.QUOTE,
        title: "\u{1F4AC} Quote"
      }
    ]
  );
}

async function sendQuoteActionButtons(to) {
  await sendButtons(
    to,
    "What would you like to do next?",
    [
      {
        id: BUTTON_IDS.SEND_BOOKING_CONFIRMATION,
        title: "\u{2705} Confirm Booking"
      },
      {
        id: BUTTON_IDS.SEND_HOTEL_LOCATION,
        title: "\u{1F4CD} Hotel Location"
      },
      {
        id: BUTTON_IDS.MAIN_MENU,
        title: "\u{1F3E0} Main Menu"
      }
    ]
  );
}

async function sendTypingText(to, text) {
  await sendTextMessage(to, text);
}

function getBudgetValue(message) {
  const id =
    getMessageId(message);

  const values = {
    [BUTTON_IDS.BUDGET_FRIENDLY]: "Budget Friendly",
    [BUTTON_IDS.BUDGET_MID_RANGE]: "Mid Range",
    [BUTTON_IDS.BUDGET_LUXURY]: "Luxury"
  };

  return values[id] || getMessageText(message) || null;
}

module.exports = {
  getMessageText,
  getMessageId,
  getDestinationFromMessage,
  parseDays,
  parseTravellers,
  sendDestinationList,
  sendDaysQuestion,
  sendTravellersQuestion,
  sendBudgetQuestion,
  sendMainMenu,
  sendLocationOptions,
  sendQuoteActionButtons,
  sendTypingText,
  getBudgetValue
};
