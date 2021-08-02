module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $rename: { settingsApperance: "settingsAppearance" } });
        await dbCollection.updateMany({}, { $rename: { apikey: "apiKey" } });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the inverse migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $rename: { settingsAppearance: "settingsApperance" } });
        await dbCollection.updateMany({}, { $rename: { apiKey: "apikey" } });
      });
    } finally {
      await session.endSession();
    }
  }
};
