# TravelBuddy

WhatsApp Business Platform demo for a travel assistant powered by Groq AI.

## Features

- WhatsApp Cloud API webhook verification and message handling
- Reply buttons, list messages, documents, location pins, templates, and text messages
- Flexible free-text input in every flow
- In-memory session state machine per phone number
- Groq AI itinerary, budget, destination, packing, tips, and quiz responses
- PDF itinerary generation with PDFKit
- OpenWeatherMap weather lookup with friendly fallback
- In-memory lead capture for contact-agent and quote requests

## Folder Structure

```text
app.js
routes/
  webhook.js
controllers/
  webhookController.js
services/
  aiService.js
  weatherService.js
  pdfService.js
  whatsappService.js
  leadService.js
flows/
  planTripFlow.js
  budgetFlow.js
  quizFlow.js
  moreMenuFlow.js
  flowHelpers.js
sessions/
  sessionManager.js
constants/
  buttonIds.js
  states.js
  destinations.js
  visaData.js
utils/
  messageParser.js
  extractMessage.js
public/
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
VERIFY_TOKEN=
WHATSAPP_TOKEN=
ACCESS_TOKEN=
PHONE_NUMBER_ID=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENWEATHER_API_KEY=
BASE_URL=
WHATSAPP_BOOKING_TEMPLATE_NAME=booking_confirmation
WHATSAPP_TEMPLATE_LANGUAGE=en_US
```

`WHATSAPP_TOKEN` is preferred. `ACCESS_TOKEN` is still supported for compatibility with the earlier demo.

`BASE_URL` must be a public URL for PDF document sharing, for example an ngrok URL.

`WHATSAPP_BOOKING_TEMPLATE_NAME` must match an approved WhatsApp template in Meta Business Manager. `WHATSAPP_TEMPLATE_LANGUAGE` should match that template language, for example `en_US`.

## Build And Start

Install dependencies:

```bash
cd wademo
npm install
```

Start the server:

```bash
npm start
```

The app starts from `app.js` and listens on `PORT`, or `3000` if `PORT` is not set.

For local WhatsApp testing, expose the server with a public tunnel such as ngrok:

```bash
ngrok http 3000
```

Then set `BASE_URL` to the public HTTPS URL:

```env
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

Configure the WhatsApp webhook callback URL in Meta Developer settings as:

```text
https://your-public-url/
```

Use the same `VERIFY_TOKEN` in Meta Developer settings and `.env`.

## Useful Commands

Run the app:

```bash
npm start
```

Check JavaScript syntax:

```bash
node --check app.js
```

There is no automated test suite configured yet.

## File Guide

### Root

- `app.js`: Express server entry point. Loads `.env`, parses JSON, verifies the WhatsApp webhook, mounts routes, serves `/public`, and starts the server.
- `package.json`: Project metadata, scripts, and dependencies.
- `package-lock.json`: Locked dependency versions.
- `.env`: Local secrets and configuration. This file is ignored by Git.
- `.gitignore`: Keeps secrets, dependencies, logs, and generated files out of Git.

### Routes And Controllers

- `routes/webhook.js`: Express router for `POST /`. It delegates webhook handling to the controller.
- `controllers/webhookController.js`: Main traffic controller. It parses incoming messages, handles global restart words, routes button/list IDs, sends PDFs, and dispatches to flow handlers.

### Services

- `services/aiService.js`: Groq AI integration. Generates itineraries, budgets, destination exploration, best-time advice, packing checklists, travel tips, and quiz recommendations.
- `services/whatsappService.js`: WhatsApp Cloud API helper. Sends text messages, reply buttons, list messages, and documents.
- `services/pdfService.js`: Generates itinerary PDFs with PDFKit and saves them under `public/`.
- `services/weatherService.js`: Calls OpenWeatherMap for current weather. Returns a friendly fallback if the API key is missing or the request fails.
- `services/leadService.js`: In-memory lead capture for contact-agent and quote flows.

### Flows

- `flows/planTripFlow.js`: Plan Trip state machine. Captures destination, days, travellers, month, budget, generates itinerary, and supports modification.
- `flows/budgetFlow.js`: Budget Calculator state machine. Captures destination, travellers, days, and generates an estimated budget.
- `flows/moreMenuFlow.js`: More menu features: explore destination, visa info, weather, best time, packing checklist, travel tips, contact agent, and quote.
- `flows/quizFlow.js`: Interactive travel quiz and destination recommendation flow.
- `flows/flowHelpers.js`: Shared helpers for common questions, list messages, parsing days/travellers, and main menu buttons.

### Sessions And Constants

- `sessions/sessionManager.js`: In-memory session manager keyed by phone number. Supports get, update, reset, and clear.
- `constants/buttonIds.js`: Stable IDs for all WhatsApp buttons and list rows.
- `constants/states.js`: State names used by the flow state machine.
- `constants/destinations.js`: Destination list sections and destination ID mapping.
- `constants/locationData.js`: Static hotel and attraction coordinates for supported destination location pins.
- `constants/visaData.js`: Static visa guidance for supported destinations.

### Utils And Public Files

- `utils/messageParser.js`: Normalizes WhatsApp text, button, list, and document messages into one object shape.
- `utils/extractMessage.js`: Backward-compatible wrapper around the new message parser.
- `public/`: Stores generated PDFs and exposes them through `/public/...`.

## Example Conversations

```text
User: hi
Bot: Welcome menu
User taps: Plan Trip
Bot: Destination list
User: Manali
Bot: How many days?
User: 5
Bot: Who is travelling?
User taps: Couple
Bot: Which month?
User: December
Bot: Budget preference?
User: INR 50000
Bot: AI itinerary + PDF / Modify / Quote buttons
User taps: PDF
Bot: Sends Travel-Itinerary.pdf
Bot: Would you like nearby travel locations?
User taps: Hotel
Bot: Sends hotel location pin
User taps: Quote
Bot: Saves quote request and shows Confirm Booking / Hotel Location / Main Menu
User taps: Confirm Booking
Bot: Sends the booking confirmation template, or a text fallback if the template is unavailable
```

```text
User taps: More
User taps: Weather
Bot: Destination list
User: Tokyo
Bot: Current weather or friendly fallback
```

```text
User taps: More
User taps: Get Travel Quote
Bot captures missing destination, days, travellers, month, and budget
Bot logs lead and confirms consultant follow-up
```

## State Transitions

- `START` / restart text -> `MAIN_MENU`
- `PLAN_TRIP` -> `SELECT_DESTINATION` -> `SELECT_DAYS` -> `SELECT_TRAVELLERS` -> `SELECT_TRAVEL_MONTH` -> `SELECT_BUDGET` -> `SHOW_ITINERARY`
- `MODIFY` -> `MODIFICATION` -> `MODIFY_VALUE` -> `SHOW_ITINERARY`
- `PDF` -> sends document -> location choices: Hotel / Attraction / Quote
- `BUDGET` -> `BUDGET_SELECT_DESTINATION` -> `BUDGET_SELECT_TRAVELLERS` -> `BUDGET_SELECT_DAYS` -> `MAIN_MENU`
- `MORE` -> list option -> destination feature state -> `MAIN_MENU`
- `TRAVEL_QUIZ` -> `QUIZ` preference -> budget -> region -> `MAIN_MENU`
- `QUOTE` -> `QUOTE` missing-field capture -> lead creation -> Confirm Booking / Hotel Location / Main Menu

Global restart text works at any point:

```text
menu
main menu
restart
start over
hi
hello
start
/start
```
