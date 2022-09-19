const express = require('express');

const router = express.Router();
const _ = require('lodash');
const HistoryRoutes = require('../models/History.js');
const { ensureAuthenticated } = require('../middleware/auth');
const Printers = require('../models/Printer.js');
const Spools = require('../models/Filament.js');
const Profiles = require('../models/Profiles.js');
const { getHistoryCache } = require('../cache/history.cache');
const { sortOptions } = require('../constants/history-sort.constants');
const { generatePrinterStatistics } = require('../services/printer-statistics.service');
const { getPrinterStoreCache } = require('../cache/printer-store.cache');
const { validateParamsMiddleware } = require('../middleware/validators');
const M_VALID = require('../constants/validate-mongo.constants');

router.post('/update', ensureAuthenticated, async (req, res) => {
  // Check required fields
  const note = req.bodyString('note');
  const filamentId = req.body.filamentId;
  const id = req.bodyString('id');
  const history = await HistoryRoutes.findById(id);
  if (history.printHistory.notes !== note) {
    history.printHistory.notes = note;
  }
  for (let f = 0; f < filamentId.length; f++) {
    if (Array.isArray(history.printHistory.filamentSelection)) {
      if (
        typeof history.printHistory.filamentSelection[f] !== 'undefined' &&
        history.printHistory.filamentSelection[f] !== null &&
        history.printHistory.filamentSelection[f]._id === filamentId
      ) {
        //Skip da save
      } else {
        if (filamentId[f] !== 0) {
          const spool = await Spools.findById(filamentId[f]);
          const profile = await Profiles.findById(spool.spools.profile);
          spool.spools.profile = profile.profile;
          history.printHistory.filamentSelection[f] = spool;
        } else {
          filamentId.forEach((theID, index) => {
            history.printHistory.filamentSelection[index] = null;
          });
        }
      }
    } else {
      if (
        history.printHistory.filamentSelection !== null &&
        history.printHistory.filamentSelection._id == filamentId
      ) {
        //Skip da save
      } else {
        history.printHistory.filamentSelection = [];
        if (filamentId[f] !== 0) {
          const spool = await Spools.findById(filamentId[f]);
          const profile = await Profiles.findById(spool.spools.profile);
          spool.spools.profile = profile.profile;
          history.printHistory.filamentSelection[f] = spool;
        }
      }
    }
  }
  history.markModified('printHistory');
  history.save().then(() => {
    getHistoryCache().initCache();
  });
  res.send('success');
});
//Register Handle for Saving printers
router.post('/delete', ensureAuthenticated, async (req, res) => {
  //Check required fields
  const deleteHistory = req.bodyString('id');
  await HistoryRoutes.findOneAndDelete({ _id: deleteHistory }).then(() => {
    getHistoryCache().initCache();
  });
  res.send('success');
});

router.get('/get', ensureAuthenticated, async (req, res) => {
  const page = req.queryString('page');
  const limit = req.queryString('limit');
  const sort = req.queryString('sort');

  let paginationOptions = {};

  paginationOptions.page = page;

  paginationOptions.limit = limit;

  paginationOptions.sort = sortOptions[sort];

  const firstDate = req.queryString('firstDate');
  const lastDate = req.queryString('lastDate');
  const fileFilter = req.queryString('fileFilter');
  const pathFilter = req.queryString('pathFilter');
  const spoolManuFilter = req.queryString('spoolManuFilter');
  const spoolMatFilter = req.queryString('spoolMatFilter');
  const fileSearch = req.queryString('fileSearch');
  const spoolSearch = req.queryString('spoolSearch');
  const printerNameFilter = req.queryString('printerNameFilter');
  const printerGroupFilter = req.queryString('printerGroupFilter');
  const printerSearch = req.queryString('printerSearch');

  const findOptions = {
    'printHistory.endDate': { $gte: new Date(lastDate), $lte: new Date(firstDate) },
  };

  if (fileFilter) {
    findOptions['printHistory.fileName'] = fileFilter;
  }

  if (printerNameFilter) {
    findOptions['printHistory.printerName'] = printerNameFilter;
  }

  if (printerGroupFilter) {
    findOptions['printHistory.printerGroup'] = printerGroupFilter;
  }

  if (pathFilter) {
    findOptions['printHistory.job.file.path'] = new RegExp(pathFilter, 'g');
  }
  if (spoolManuFilter) {
    findOptions['printHistory.filamentSelection.spools.profile.manufacturer'] = new RegExp(
      spoolManuFilter.replace(/_/g, ' '),
      'g'
    );
  }
  if (spoolMatFilter) {
    findOptions['printHistory.filamentSelection.spools.profile.material'] = new RegExp(
      spoolMatFilter.replace(/_/g, ' '),
      'g'
    );
  }

  if (fileSearch) {
    findOptions['printHistory.fileName'] = new RegExp(fileSearch.replace(/_/g, ' '), 'i');
  }

  if (printerSearch) {
    findOptions['printHistory.printerName'] = new RegExp(printerSearch.replace(/_/g, ' '), 'i');
  }

  if (spoolSearch) {
    findOptions['printHistory.filamentSelection.spools.name'] = new RegExp(
      spoolSearch.replace(/_/g, ' '),
      'i'
    );
  }

  const historyCache = getHistoryCache();

  const { historyClean, statisticsClean, pagination } = await historyCache.initCache(
    findOptions,
    paginationOptions
  );

  const historyFilterData = historyCache.generateHistoryFilterData(historyClean);

  res.send({
    history: historyClean,
    statisticsClean,
    pagination,
    monthlyStatistics: historyCache.monthlyStatistics,
    historyFilterData,
  });
});

router.get('/statisticsData', ensureAuthenticated, async (req, res) => {
  const historyCache = getHistoryCache();
  const stats = historyCache.generateStatistics();

  res.send({ history: stats });
});
router.post('/updateCostMatch', ensureAuthenticated, async (req, res) => {
  const latest = req.bodyString('id');

  // Find history and matching printer ID
  const historyEntity = await HistoryRoutes.findOne({ _id: latest });
  const printers = await Printers.find({});
  const printer = _.findIndex(printers, function (o) {
    return o.settingsAppearance.name === historyEntity.printHistory.printerName;
  });
  if (printer > -1) {
    historyEntity.printHistory.costSettings = printers[printer].costSettings;
    historyEntity.markModified('printHistory');
    historyEntity.save();
    const send = {
      status: 200,
      printTime: historyEntity.printHistory.printTime,
      costSettings: printers[printer].costSettings,
    };
    res.send(send);
  } else {
    historyEntity.printHistory.costSettings = {
      powerConsumption: 0.5,
      electricityCosts: 0.15,
      purchasePrice: 500,
      estimateLifespan: 43800,
      maintenanceCosts: 0.25,
    };
    const send = {
      status: 400,
      printTime: historyEntity.printHistory.printTime,
      costSettings: historyEntity.printHistory.costSettings,
    };
    historyEntity.markModified('printHistory');
    historyEntity.save().then(() => {
      getHistoryCache().initCache();
    });

    res.send(send);
  }
});
router.get(
  '/statistics/:id',
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async function (req, res) {
    const printerID = req.paramString('id');
    let stats = getPrinterStoreCache().getPrinterStatistics(printerID);
    if (!stats) {
      stats = await generatePrinterStatistics(printerID);
      getPrinterStoreCache().updatePrinterStatistics(printerID, stats);
    }
    res.send(stats);
  }
);

module.exports = router;
