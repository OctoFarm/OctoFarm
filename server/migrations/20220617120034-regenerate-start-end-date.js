const doesDateEqualEpoch = function (date) {
  if (!date) {
    return true;
  }
  return new Date(date) < new Date("1980-01-01T00:00:00.000+00:00");
};

const generateStartDate = function (endDate, printTime) {
  const printTimeDateObj = new Date(printTime * 1000);
  return new Date(endDate.getTime() - printTimeDateObj.getTime());
};

const isObject = function (id) {
  return typeof id === "object";
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
          if (isObject(data._id) && doesDateEqualEpoch(data?.printHistory?.startDate)) {
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
          if (isObject(data._id) && doesDateEqualEpoch(data?.printHistory?.endDate)) {
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
