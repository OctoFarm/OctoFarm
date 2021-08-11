const { defaultSortBy, defaultFilterBy } = require("../../constants/filter-sorting.constants");

class SortingFilteringCache {
  #filterBy = defaultFilterBy;

  #sortBy = defaultSortBy;

  constructor({}) {}

  getSorting() {
    return this.#sortBy;
  }

  getFilter() {
    return this.#filterBy;
  }

  updateSorting(sorting) {
    this.#sortBy = sorting;
  }

  updateFilter(filter) {
    this.#filterBy = filter;
  }
}

module.exports = SortingFilteringCache;
