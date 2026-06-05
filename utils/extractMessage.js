function extractMessage(payload) {

  const message =
    payload?.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  return {
    from: message.from,
    text: message.text?.body
  };
}

module.exports = extractMessage;