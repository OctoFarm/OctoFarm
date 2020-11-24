const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

let filterBy = "none";

let sortBy = "index";

const getSorting = function () {
  return sortBy;
};

const getFilter = function () {
  return filterBy;
};

const updateSorting = function (sorting) {
  sortBy = sorting;
};
const updateFilter = function (filter) {
  filterBy = filter;
};
exports.getSorting = getSorting;
exports.getFilter = getFilter;
