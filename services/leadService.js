const leads = [];

function createLead(data) {
  const lead = {
    phoneNumber: data.phoneNumber,
    destination: data.destination || null,
    days: data.days || null,
    travellers: data.travellers || null,
    travelMonth: data.travelMonth || null,
    budget: data.budget || null,
    itinerarySummary: data.itinerarySummary || null,
    source: data.source,
    status: "new",
    createdAt: new Date().toISOString()
  };

  leads.push(lead);
  console.log("New lead:", JSON.stringify(lead, null, 2));

  return lead;
}

function getLeads() {
  return leads;
}

module.exports = {
  createLead,
  getLeads
};
