const STATES = require("../constants/states");

const sessions = new Map();

function createSession(phoneNumber) {
  return {
    phoneNumber,
    destination: null,
    days: null,
    travellers: null,
    travelMonth: null,
    budget: null,
    hotelPreference: null,
    itinerary: null,
    currentState: STATES.START,
    lastUpdated: new Date().toISOString()
  };
}

function getSession(phoneNumber) {
  if (!sessions.has(phoneNumber)) {
    sessions.set(phoneNumber, createSession(phoneNumber));
  }

  return sessions.get(phoneNumber);
}

function updateSession(phoneNumber, data) {
  const currentSession = getSession(phoneNumber);

  const updatedSession = {
    ...currentSession,
    ...data,
    lastUpdated: new Date().toISOString()
  };

  sessions.set(phoneNumber, updatedSession);

  return updatedSession;
}

function resetSession(phoneNumber) {
  const session = createSession(phoneNumber);
  session.currentState = STATES.MAIN_MENU;
  sessions.set(phoneNumber, session);

  return session;
}

function clearSession(phoneNumber) {
  sessions.delete(phoneNumber);
}

module.exports = {
  getSession,
  updateSession,
  resetSession,
  clearSession
};
