module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection('serversettings');

        await dbCollection.find({}).forEach(function (data) {
          if (data?.filamentManager) {
            dbCollection.findOneAndUpdate(
              { _id: data._id },
              {
                $set: {
                  'filament.downDateSuccess': true,
                  'filament.filamentCheck': true,
                  'filament.downDateFailed': true,
                  'filament.allowMultiSelect': false,
                },
                $unset: {
                  filamentManager: 1,
                },
              }
            );
          }
        });
      });
    } finally {
      await session.endSession();
    }
  },
};
