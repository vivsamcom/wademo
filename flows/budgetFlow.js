const BUTTON_IDS = require("../constants/buttonIds");
const {
  NEXT_STEPS_TEXT
} = require("../constants/messages");
const STATES = require("../constants/states");
const {
  updateSession
} = require("../sessions/sessionManager");
const {
  generateBudgetEstimate
} = require("../services/aiService");
const {
  sendButtons,
  sendTextMessage
} = require("../services/whatsappService");
const {
  getDestinationFromMessage,
  parseDays,
  parseTravellers,
  sendDestinationList,
  sendMainMenu
} = require("./flowHelpers");

const BUDGET_TRAVELLER_IDS = {
  [BUTTON_IDS.BUDGET_TRAVELLERS_1]: 1,
  [BUTTON_IDS.BUDGET_TRAVELLERS_2]: 2,
  [BUTTON_IDS.BUDGET_TRAVELLERS_3_PLUS]: "3+"
};

const BUDGET_DAY_IDS = {
  [BUTTON_IDS.BUDGET_DAYS_3]: 3,
  [BUTTON_IDS.BUDGET_DAYS_5]: 5,
  [BUTTON_IDS.BUDGET_DAYS_7]: 7
};

async function startBudgetFlow(to) {
  updateSession(
    to,
    {
      budgetData: {},
      currentState: STATES.BUDGET_SELECT_DESTINATION
    }
  );

  await sendDestinationList(
    to,
    "\u{1F4B0} Budget Calculator\n\nChoose destination"
  );
}

async function sendBudgetTravellerQuestion(to, prefix) {
  await sendButtons(
    to,
    `${prefix || "Number of travellers?"}\n\nYou can also type a custom traveller count.`,
    [
      {
        id: BUTTON_IDS.BUDGET_TRAVELLERS_1,
        title: "1"
      },
      {
        id: BUTTON_IDS.BUDGET_TRAVELLERS_2,
        title: "2"
      },
      {
        id: BUTTON_IDS.BUDGET_TRAVELLERS_3_PLUS,
        title: "3+"
      }
    ]
  );
}

async function sendBudgetDaysQuestion(to, prefix) {
  await sendButtons(
    to,
    `${prefix || "Number of days?"}\n\nYou can also type your own number of days.`,
    [
      {
        id: BUTTON_IDS.BUDGET_DAYS_3,
        title: "3 Days"
      },
      {
        id: BUTTON_IDS.BUDGET_DAYS_5,
        title: "5 Days"
      },
      {
        id: BUTTON_IDS.BUDGET_DAYS_7,
        title: "7 Days"
      }
    ]
  );
}

async function handleBudgetFlow(message, session) {
  const to =
    message.from;

  if (session.currentState === STATES.BUDGET_SELECT_DESTINATION) {
    const selected =
      getDestinationFromMessage(message);

    if (selected.askCustom) {
      await sendTextMessage(
        to,
        "Please type the destination for your budget estimate."
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
        budgetData: {
          destination: selected.destination
        },
        currentState: STATES.BUDGET_SELECT_TRAVELLERS
      }
    );

    await sendBudgetTravellerQuestion(to);
    return;
  }

  if (session.currentState === STATES.BUDGET_SELECT_TRAVELLERS) {
    const travellers =
      parseTravellers(message, BUDGET_TRAVELLER_IDS);

    if (!travellers) {
      await sendBudgetTravellerQuestion(
        to,
        "Please enter a valid traveller count.\nExample: 2"
      );
      return;
    }

    updateSession(
      to,
      {
        travellers,
        budgetData: {
          ...session.budgetData,
          travellers
        },
        currentState: STATES.BUDGET_SELECT_DAYS
      }
    );

    await sendBudgetDaysQuestion(to);
    return;
  }

  if (session.currentState === STATES.BUDGET_SELECT_DAYS) {
    const days =
      parseDays(message, BUDGET_DAY_IDS);

    if (!days) {
      await sendBudgetDaysQuestion(
        to,
        "Please enter number of days between 1 and 60.\nExample: 5"
      );
      return;
    }

    const budgetData = {
      ...session.budgetData,
      days
    };

    updateSession(
      to,
      {
        days,
        budgetData,
        currentState: STATES.MAIN_MENU
      }
    );

    await sendTextMessage(
      to,
      "\u{1F4B0} Estimating your travel budget..."
    );

    const estimate =
      await generateBudgetEstimate(budgetData);

    await sendTextMessage(to, estimate);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
  }
}

module.exports = {
  startBudgetFlow,
  handleBudgetFlow
};
