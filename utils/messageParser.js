function parseMessage(payload) {
  const message =
    payload?.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  const parsed = {
    from: message.from,
    type: message.type,
    text: "",
    interactiveId: null,
    interactiveTitle: null
  };

  if (message.type === "text") {
    parsed.text = message.text?.body || "";
  }

  if (message.type === "interactive") {
    const buttonReply = message.interactive?.button_reply;
    const listReply = message.interactive?.list_reply;

    if (buttonReply) {
      parsed.type = "button";
      parsed.text = buttonReply.title || buttonReply.id || "";
      parsed.interactiveId = buttonReply.id || null;
      parsed.interactiveTitle = buttonReply.title || null;
    }

    if (listReply) {
      parsed.type = "list";
      parsed.text = listReply.title || listReply.id || "";
      parsed.interactiveId = listReply.id || null;
      parsed.interactiveTitle = listReply.title || null;
    }
  }

  if (message.type === "document") {
    parsed.text = message.document?.filename || "";
  }

  return parsed;
}

module.exports = parseMessage;
