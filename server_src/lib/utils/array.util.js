/**
 * Find key equality in array and return first element
 * @param nameProp
 * @param array
 * @returns {*}
 */
function checkNested(nameProp, array) {
  if (!nameProp || !array?.length) {
    return;
  }
  return array.find((kv) => kv?.name === nameProp);
}

/**
 * Find key equality in array returning index
 * @param nameProp
 * @param array
 */
function checkNestedIndex(nameProp, array) {
  if (!nameProp || !array?.length) {
    return;
  }
  return array.findIndex((kv) => kv?.name === nameProp);
}

module.exports = {
  checkNested,
  checkNestedIndex,
};
