const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `
You are TravelBuddy.

You help users:
- plan trips
- suggest itineraries
- estimate budgets
- recommend attractions
- provide travel tips

Rules:
- Keep responses WhatsApp friendly
- Use bullet points
- Maximum 500 words
- Mention approximate budget
`;

async function getTravelResponse(userMessage) {

  const completion =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

  return completion.choices[0].message.content;
}

module.exports = {
  getTravelResponse
};