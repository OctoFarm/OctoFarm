module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $rename: { settingsApperance: "settingsAppearance" } });
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
      });
    } finally {
      await session.endSession();
    }
  }
};
