function extractMessage(payload) {

  const message =
    payload?.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  let text = "";

  if (message.type === "text") {
    text = message.text?.body || "";
  }

  if (
    message.type === "interactive" &&
    message.interactive?.button_reply
  ) {
    text =
      message.interactive.button_reply.id;
  }

  return {
    from: message.from,
    text
  };
}

module.exports = extractMessage;