const axios = require("axios");
const {
  NEXT_STEPS_TEXT,
  WELCOME_MENU_TEXT
} = require("../constants/messages");

const url =
  `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`;

const headers = {
  Authorization:
    `Bearer ${process.env.WHATSAPP_TOKEN || process.env.ACCESS_TOKEN}`,
  "Content-Type": "application/json"
};

async function postMessage(payload) {
  await axios.post(
    url,
    payload,
    { headers }
  );
}

async function sendTextMessage(to, message) {

  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message
      }
    }
  );
}

async function sendButtons(to, bodyText, buttons) {
  const safeButtons =
    buttons.slice(0, 3);

  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText
        },
        action: {
          buttons: safeButtons.map((button) => ({
            type: "reply",
            reply: {
              id: button.id,
              title: button.title
            }
          }))
        }
      }
    }
  );
}

async function sendListMessage(to, bodyText, buttonText, sections) {
  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections.map((section) => ({
            title: section.title,
            rows: section.rows.slice(0, 10).map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description
            }))
          }))
        }
      }
    }
  );
}

async function sendDocument(to, documentUrl, filename) {
  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: {
        link: documentUrl,
        filename
      }
    }
  );
}

async function sendLocation(to, latitude, longitude, name, address) {
  const numericLatitude =
    Number(latitude);

  const numericLongitude =
    Number(longitude);

  if (
    !Number.isFinite(numericLatitude) ||
    !Number.isFinite(numericLongitude)
  ) {
    throw new Error("Invalid location coordinates");
  }

  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "location",
      location: {
        latitude: numericLatitude,
        longitude: numericLongitude,
        ...(name ? { name } : {}),
        ...(address ? { address } : {})
      }
    }
  );
}

function normalizeTemplateParameters(parameters) {
  if (!Array.isArray(parameters)) {
    return [];
  }

  return parameters
    .filter((parameter) => parameter !== null && parameter !== undefined)
    .map((parameter) => {
      if (
        typeof parameter === "object" &&
        parameter.type
      ) {
        return parameter;
      }

      return {
        type: "text",
        text: String(parameter)
      };
    });
}

async function sendTemplateMessage(
  to,
  templateName,
  languageCode,
  parameters,
  options = {}
) {
  if (!templateName) {
    throw new Error("Template name is required");
  }

  const templateParameters =
    normalizeTemplateParameters(parameters);

  const template = {
    name: templateName,
    language: {
      code: languageCode || "en_US"
    }
  };

  const components = [];

  if (options.headerImageUrl) {
    components.push(
      {
        type: "header",
        parameters: [
          {
            type: "image",
            image: {
              link: options.headerImageUrl
            }
          }
        ]
      }
    );
  }

  if (templateParameters.length > 0) {
    components.push(
      {
        type: "body",
        parameters: templateParameters
      }
    );
  }

  if (components.length > 0) {
    template.components =
      components;
  }

  await postMessage(
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template
    }
  );
}

async function sendMessage(to, message) {
  return sendTextMessage(to, message);
}

async function sendWelcomeButtons(to) {
  return sendButtons(
    to,
    WELCOME_MENU_TEXT,
    [
      {
        id: "PLAN_TRIP",
        title: "\u{2708}\u{FE0F} Plan Trip"
      },
      {
        id: "BUDGET",
        title: "\u{1F4B0} Budget"
      },
      {
        id: "MORE",
        title: "\u{1F4CB} More"
      }
    ]
  );
}

async function sendItineraryButtons(to) {

  return sendButtons(
    to,
    NEXT_STEPS_TEXT,
    [
      {
        id: "PDF",
        title: "\u{1F4C4} PDF"
      },
      {
        id: "MODIFY",
        title: "\u{270F}\u{FE0F} Modify"
      },
      {
        id: "QUOTE",
        title: "\u{1F4AC} Quote"
      }
    ]
  );
}

module.exports = {
  sendTextMessage,
  sendButtons,
  sendListMessage,
  sendMessage,
  sendWelcomeButtons,
  sendDocument,
  sendItineraryButtons,
  sendLocation,
  sendTemplateMessage
};
