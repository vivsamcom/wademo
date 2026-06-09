const BUTTON_IDS = require("./buttonIds");

const DESTINATION_BY_ID = {
  [BUTTON_IDS.DEST_GOA]: "Goa",
  [BUTTON_IDS.DEST_KERALA]: "Kerala",
  [BUTTON_IDS.DEST_RAJASTHAN]: "Rajasthan",
  [BUTTON_IDS.DEST_KASHMIR]: "Kashmir",
  [BUTTON_IDS.DEST_BALI]: "Bali",
  [BUTTON_IDS.DEST_THAILAND]: "Thailand",
  [BUTTON_IDS.DEST_DUBAI]: "Dubai",
  [BUTTON_IDS.DEST_SINGAPORE]: "Singapore"
};

const DESTINATION_SECTIONS = [
  {
    title: "Domestic",
    rows: [
      {
        id: BUTTON_IDS.DEST_GOA,
        title: "Goa",
        description: "Beaches, nightlife, cafes"
      },
      {
        id: BUTTON_IDS.DEST_KERALA,
        title: "Kerala",
        description: "Backwaters and nature"
      },
      {
        id: BUTTON_IDS.DEST_RAJASTHAN,
        title: "Rajasthan",
        description: "Forts, palaces, desert"
      },
      {
        id: BUTTON_IDS.DEST_KASHMIR,
        title: "Kashmir",
        description: "Mountains and valleys"
      },
      {
        id: BUTTON_IDS.DEST_OTHER,
        title: "Other Destination",
        description: "Type your own place"
      }
    ]
  },
  {
    title: "International",
    rows: [
      {
        id: BUTTON_IDS.DEST_BALI,
        title: "Bali",
        description: "Beaches and culture"
      },
      {
        id: BUTTON_IDS.DEST_THAILAND,
        title: "Thailand",
        description: "Islands, food, temples"
      },
      {
        id: BUTTON_IDS.DEST_DUBAI,
        title: "Dubai",
        description: "Shopping and attractions"
      },
      {
        id: BUTTON_IDS.DEST_SINGAPORE,
        title: "Singapore",
        description: "Family and city break"
      },
      {
        id: BUTTON_IDS.DEST_OTHER,
        title: "Other Destination",
        description: "Type your own place"
      }
    ]
  }
];

function getDestinationById(id) {
  return DESTINATION_BY_ID[id] || null;
}

module.exports = {
  DESTINATION_SECTIONS,
  DESTINATION_BY_ID,
  getDestinationById
};
