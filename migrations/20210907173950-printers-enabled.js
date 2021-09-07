module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $set: { enabled: true } });
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
        // Do the migration (destructive!)
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { unset: { enabled: "" } });
      });
    } finally {
      await session.endSession();
    }
  }
};
