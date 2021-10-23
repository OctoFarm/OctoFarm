const ITERIES = {
  PROGRESS: "progress",
  TIME_REMAIN: "timeRemaining",
  FILE_NAME: "fileName",
  SORT_INDEX: "sortIndex"
};

const ORDERS = {
  ASCENDING: "asc",
  DESCENDING: "desc"
};

let currentIterie = ITERIES.PROGRESS;
let currentOrder = ORDERS.DESCENDING;

function returnCurrentOrdering() {
  return {
    currentIterie,
    currentOrder
  };
}

function updateOrdering({ iterie, order }) {
  currentIterie = iterie || ITERIES.PROGRESS;
  currentOrder = order || ORDERS.DESCENDING;
}
module.exports = {
  returnCurrentOrdering,
  updateOrdering
};
