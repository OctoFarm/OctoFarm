const EVENT_ID_MAP = {
  coolDown: "COOL_DOWN"
};

const eventListConstants = {
  COOL_DOWN: {
    id: "coolDown",
    icon: "fa-solid fa-fan",
    name: "Temperature Cool Down",
    amount: "Once Per Print",
    description:
      "Fires once when your printer is in the 'Complete' state and temperature drops below the value in your 'Cool Down' trigger settings.",
    defaultTriggerValue: "30 (°C)",
    relatedSettings: "Trigger Settings -> Cool Down"
  }
};

module.exports = {
  eventListConstants,
  EVENT_ID_MAP
};
