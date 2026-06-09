const parseMessage =
  require("./messageParser");

function extractMessage(payload) {
  const message =
    parseMessage(payload);

  if (!message) {
    return null;
  }

  return {
    from: message.from,
    text: message.interactiveId || message.text
  };
}

module.exports = extractMessage;
