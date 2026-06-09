const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const model =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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
- Use emojis where helpful
- Avoid markdown tables
- Avoid long paragraphs
- Focus on actionable travel information
`;

async function createTravelResponse(userMessage) {

  const completion =
    await groq.chat.completions.create({
      model,
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

async function getTravelResponse(userMessage) {
  return createTravelResponse(userMessage);
}

async function generateItinerary(session) {
  return createTravelResponse(`
Create a travel itinerary with:
- Destination: ${session.destination}
- Days: ${session.days}
- Travellers: ${session.travellers}
- Travel month: ${session.travelMonth}
- Budget preference: ${session.budget}
- Hotel preference: ${session.hotelPreference || "Not specified"}

Include:
- Day-wise itinerary
- Attractions
- Food recommendations
- Local transport suggestions
- Approximate budget
- Best area to stay
- Travel tips
  `);
}

async function generateBudgetEstimate(data) {
  return createTravelResponse(`
Create a travel budget estimate.

Destination: ${data.destination}
Travellers: ${data.travellers}
Days: ${data.days}

Format:
\u{1F4B0} Estimated Budget

\u{2708}\u{FE0F} Flights
\u{1F3E8} Hotels
\u{1F37D}\u{FE0F} Food
\u{1F695} Transport

Total

Keep it practical and approximate.
  `);
}

async function exploreDestination(destination) {
  return createTravelResponse(`
Explore ${destination} for a traveller.

Include:
- Top attractions
- Local food
- Best areas to stay
- Approximate daily budget
  `);
}

async function getBestTimeToVisit(destination) {
  return createTravelResponse(`
Tell me the best time to visit ${destination}.

Include:
- Best months
- Peak season
- Off season
- Weather overview
- Practical travel tip
  `);
}

async function getPackingChecklist(destination) {
  return createTravelResponse(`
Create a packing checklist for ${destination}.

Include:
- Documents
- Clothing
- Electronics
- Health and safety
- Destination-specific items
  `);
}

async function getTravelTips(destination) {
  const target =
    destination || "general travel";

  return createTravelResponse(`
Give ${target} tips.

Categories:
- Safety
- Currency
- Transport
- Food
  `);
}

async function recommendDestination(quiz) {
  return createTravelResponse(`
Recommend one travel destination based on:
- Preference: ${quiz.preference}
- Budget: ${quiz.budget}
- Region: ${quiz.region}

Include:
- Recommended destination
- Why it fits
- Ideal trip duration
- Approximate budget
- Quick planning tip
  `);
}

module.exports = {
  getTravelResponse,
  generateItinerary,
  generateBudgetEstimate,
  exploreDestination,
  getBestTimeToVisit,
  getPackingChecklist,
  getTravelTips,
  recommendDestination
};
