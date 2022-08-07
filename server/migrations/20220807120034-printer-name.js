module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("printers");

        await dbCollection.find({}).forEach(function (data) {
          dbCollection.findOneAndUpdate(
            { _id: data._id },
            {
              $set: {
                printerName: data.settingsAppearance.name
              }
            }
          );
        });
      });
    } finally {
      await session.endSession();
    }
  }
};
