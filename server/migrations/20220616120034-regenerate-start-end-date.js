const doesDateEqualEpoch = function (date) {
  return date === new Date("1970-01-01Z00:00:00:000");
};

const generateStartDate = function (endDate, printTime) {
  const printTimeDateObj = new Date(printTime * 1000);
  return endDate.getTime() - printTimeDateObj.getTime();
};

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("histories");

        await dbCollection.find({}).forEach(function (data) {
          if (doesDateEqualEpoch(data.printHistory.startDate)) {
            dbCollection.findOneAndUpdate(
              { _id: data._id },
              {
                $set: {
                  "printHistory.startDate": generateStartDate(
                    data._id.getTimestamp(),
                    data?.printHistory?.printTime ? data.printHistory.printTime : 0
                  )
                }
              }
            );
          }
          if (doesDateEqualEpoch(data.printHistory.endDate)) {
            dbCollection.findOneAndUpdate(
              { _id: data._id },
              {
                $set: {
                  "printHistory.endDate": data._id.getTimestamp()
                }
              }
            );
          }
        });
      });
    } finally {
      await session.endSession();
    }
  }
};
