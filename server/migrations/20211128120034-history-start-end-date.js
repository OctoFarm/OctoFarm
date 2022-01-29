const { ALL_MONTHS } = require("../constants/cleaner.constants");
const convertDateStringToDateTime = function (date) {
  let dateSplit = date.split(" ");
  let month = ALL_MONTHS.indexOf(dateSplit[1]);
  let dateString = `${parseInt(dateSplit[3])}-${month + 1}-${dateSplit[2]}T${dateSplit[5]}Z`;
  return new Date(dateString);
};
const convertDateObjectToDateString = function (date) {
  const startDDMM = date.toDateString();
  const startTime = date.toTimeString();
  const startTimeFormat = startTime.substring(0, 8);
  return `${startDDMM} - ${startTimeFormat}`;
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
          if (typeof data?.printHistory?.startDate === "string") {
            dbCollection.findOneAndUpdate(
              { _id: data._id },
              {
                $set: {
                  "printHistory.startDate": convertDateStringToDateTime(
                    data.printHistory.startDate
                  ),
                  "printHistory.endDate": convertDateStringToDateTime(data.printHistory.endDate)
                }
              }
            );
          }
        });
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
        const dbCollection = db.collection("histories");

        await dbCollection.find({}).forEach(function (data) {
          if (Object.prototype.toString.call(data?.printHistory?.endDate) === "[object Date]") {
            dbCollection.findOneAndUpdate(
              { _id: data._id },
              {
                $set: {
                  "printHistory.startDate": convertDateObjectToDateString(
                    data.printHistory.startDate
                  ),
                  "printHistory.endDate": convertDateObjectToDateString(data.printHistory.endDate)
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
