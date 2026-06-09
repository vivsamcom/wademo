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
        title: "Solo"
      },
      {
        id: BUTTON_IDS.TRAVELLERS_COUPLE,
        title: "Couple"
      },
      {
        id: BUTTON_IDS.TRAVELLERS_FAMILY,
        title: "Family"
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
        title: "Budget Friendly"
      },
      {
        id: BUTTON_IDS.BUDGET_MID_RANGE,
        title: "Mid Range"
      },
      {
        id: BUTTON_IDS.BUDGET_LUXURY,
        title: "Luxury"
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
  sendTypingText,
  getBudgetValue
};
