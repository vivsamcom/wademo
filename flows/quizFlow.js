const BUTTON_IDS = require("../constants/buttonIds");
const {
  NEXT_STEPS_TEXT
} = require("../constants/messages");
const STATES = require("../constants/states");
const {
  updateSession
} = require("../sessions/sessionManager");
const {
  recommendDestination
} = require("../services/aiService");
const {
  sendButtons,
  sendTextMessage
} = require("../services/whatsappService");
const {
  getMessageId,
  getMessageText,
  sendMainMenu
} = require("./flowHelpers");

async function startQuiz(to) {
  updateSession(
    to,
    {
      currentState: STATES.QUIZ,
      quizStep: "preference",
      quizData: {}
    }
  );

  await sendButtons(
    to,
    "What do you prefer?",
    [
      {
        id: BUTTON_IDS.QUIZ_BEACH,
        title: "Beach"
      },
      {
        id: BUTTON_IDS.QUIZ_MOUNTAINS,
        title: "Mountains"
      }
    ]
  );
}

async function handleQuiz(message, session) {
  const to =
    message.from;

  const id =
    getMessageId(message);

  const text =
    getMessageText(message).toLowerCase();

  if (session.quizStep === "preference") {
    let preference = null;

    if (id === BUTTON_IDS.QUIZ_BEACH || text.includes("beach")) {
      preference = "Beach";
    }

    if (id === BUTTON_IDS.QUIZ_MOUNTAINS || text.includes("mountain")) {
      preference = "Mountains";
    }

    if (!preference) {
      await sendTextMessage(
        to,
        "Please choose Beach or Mountains."
      );
      await startQuiz(to);
      return;
    }

    updateSession(
      to,
      {
        quizStep: "budget",
        quizData: {
          preference
        }
      }
    );

    await sendButtons(
      to,
      "What is your budget style?",
      [
        {
          id: BUTTON_IDS.QUIZ_LOW,
          title: "Low"
        },
        {
          id: BUTTON_IDS.QUIZ_MEDIUM,
          title: "Medium"
        },
        {
          id: BUTTON_IDS.QUIZ_LUXURY,
          title: "Luxury"
        }
      ]
    );
    return;
  }

  if (session.quizStep === "budget") {
    const budgetMap = {
      [BUTTON_IDS.QUIZ_LOW]: "Low",
      [BUTTON_IDS.QUIZ_MEDIUM]: "Medium",
      [BUTTON_IDS.QUIZ_LUXURY]: "Luxury"
    };

    const budget =
      budgetMap[id] ||
      (["low", "medium", "luxury"].includes(text) ? text : null);

    if (!budget) {
      await sendTextMessage(
        to,
        "Please choose Low, Medium, or Luxury."
      );
      return;
    }

    updateSession(
      to,
      {
        quizStep: "region",
        quizData: {
          ...session.quizData,
          budget
        }
      }
    );

    await sendButtons(
      to,
      "Domestic or International?",
      [
        {
          id: BUTTON_IDS.QUIZ_DOMESTIC,
          title: "Domestic"
        },
        {
          id: BUTTON_IDS.QUIZ_INTERNATIONAL,
          title: "International"
        }
      ]
    );
    return;
  }

  if (session.quizStep === "region") {
    let region = null;

    if (id === BUTTON_IDS.QUIZ_DOMESTIC || text.includes("domestic")) {
      region = "Domestic";
    }

    if (
      id === BUTTON_IDS.QUIZ_INTERNATIONAL ||
      text.includes("international")
    ) {
      region = "International";
    }

    if (!region) {
      await sendTextMessage(
        to,
        "Please choose Domestic or International."
      );
      return;
    }

    const quizData = {
      ...session.quizData,
      region
    };

    updateSession(
      to,
      {
        quizData,
        currentState: STATES.MAIN_MENU
      }
    );

    await sendTextMessage(
      to,
      "\u{1F3AF} Finding a destination match for you..."
    );

    const recommendation =
      await recommendDestination(quizData);

    await sendTextMessage(to, recommendation);
    await sendMainMenu(to, NEXT_STEPS_TEXT);
  }
}

module.exports = {
  startQuiz,
  handleQuiz
};
