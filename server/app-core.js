const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { octofarmGlobalLimits, printerActionLimits } = require('./middleware/rate-limiting');
const morganMiddleware = require('./middleware/morgan');
const passport = require('passport');
const ServerSettingsDB = require('./models/ServerSettings');
const expressLayouts = require('express-ejs-layouts');
const Logger = require('./handlers/logger.js');
const { OctoFarmTasks } = require('./tasks');
const { optionalInfluxDatabaseSetup } = require('./services/influx-export.service.js');
const { getViewsPath } = require('./app-env');
const { SettingsClean } = require('./services/settings-cleaner.service');
const { TaskManager } = require('./services/task-manager.service');
const exceptionHandler = require('./exceptions/exception.handler');
const { AppConstants } = require('./constants/app.constants');
const { fetchSuperSecretKey } = require('./app-env');
const { sanitizeString } = require('./utils/sanitize-utils');
const { ensureClientServerVersion } = require('./middleware/client-server-version');
const { LOGGER_ROUTE_KEYS } = require('./constants/logger.constants');
const { ensureAuthenticated } = require('./middleware/auth');
const { validateParamsMiddleware } = require('./middleware/validators');
const { proxyOctoPrintClientRequests } = require('./middleware/octoprint-proxy');

const M_VALID = require('./constants/validate-mongo.constants');

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVER_CORE);

/**
 *
 * @returns {*|Express}
 */
function setupExpressServer() {
  let app = express();

  app.use(octofarmGlobalLimits);
  app.use(require('sanitize').middleware);
  require('./middleware/passport.js')(passport);

  //Morgan middleware
  app.use(morganMiddleware);

  // Helmet middleware. Anymore and would require customising by the user...
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.originAgentCluster());
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.referrerPolicy());
  app.use(helmet.xssFilter());

  app.use(express.json());

  const viewsPath = getViewsPath();

  app.set('views', viewsPath);
  app.set('view engine', 'ejs');
  app.use(expressLayouts);
  app.use(express.static(viewsPath));

  app.use('/images', express.static('../images'));

  if (process.env.NODE_ENV === 'development') {
    app.use('/assets', express.static('../client/assets'));
  }else{
    app.use('/assets', express.static('./assets'));
  }
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(
    session({
      secret: fetchSuperSecretKey(),
      resave: false,
      saveUninitialized: true,
      store: new MongoStore({
        mongoUrl: process.env[AppConstants.MONGO_KEY],
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native',
      }),
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate('remember-me')); // Remember Me!

  app.use(flash());
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

  return app;
}

/**
 *
 * @returns {Promise<void>}
 */
async function ensureSystemSettingsInitiated() {
  logger.info('Checking Server Settings...');
  await ServerSettingsDB.find({}).catch((e) => {
    if (e.message.includes('command find requires authentication')) {
      throw new Error('Database authentication failed.');
    } else {
      throw new Error('Database connection failed.');
    }
  });

  // Setup Settings as connection is established
  return SettingsClean.initialise();
}

/**
 *
 * @param app
 */
function serveOctoFarmRoutes(app) {
  app.use(ensureClientServerVersion);

  app.use('/', require('./routes/index', { page: 'route' }));
  app.use(
    '/camera',
    ensureAuthenticated,
    require('./routes/camera-proxy.routes.js', { page: 'route' })
  );
  app.use(
    '/octoprint/:id/:item(*)',
    ensureAuthenticated,
    validateParamsMiddleware(M_VALID.MONGO_ID),
    proxyOctoPrintClientRequests
  );
  app.use('/users', require('./routes/users.routes.js', { page: 'route' }));
  app.use(
    '/printers',
    printerActionLimits,
    require('./routes/printer-manager.routes.js', { page: 'route' })
  );
  app.use('/settings', require('./routes/system-settings.routes.js', { page: 'route' }));
  app.use('/filament', require('./routes/filament-manager.routes.js', { page: 'route' }));
  app.use('/history', require('./routes/history.routes.js', { page: 'route' }));
  app.use('/scripts', require('./routes/local-scripts-manager.routes.js', { page: 'route' }));
  app.use('/input', require('./routes/external-data-collection.routes.js', { page: 'route' }));
  app.use('/client', require('./routes/printer-sorting.routes.js', { page: 'route' }));
  app.use('/printersInfo', require('./routes/sse.printer-manager.routes.js', { page: 'route' })); // DEPRECATE IN FAVOR OF EVENTS, WILL TAKE SOME WORK
  app.use('/dashboardInfo', require('./routes/sse.dashboard.routes.js', { page: 'route' })); // DEPRECATE IN FAVOR OF EVENTS, WILL TAKE SOME WORK - This may as well be an API call
  app.use(
    '/monitoringInfo',
    require('./routes/sse.printer-monitoring.routes.js', { page: 'route' })
  ); // DEPRECATE IN FAVOR OF EVENTS, WILL TAKE SOME WORK
  app.use('/events', require('./routes/sse.events.routes.js', { page: 'route' }));

  app.get('*', function (req, res) {
    const originalURL = sanitizeString(req.originalUrl);
    if (originalURL.endsWith('.min.js')) {
      res.status(404);
      res.send('Resource not found ' + originalURL);
      return;
    }
    res.redirect('/');
  });

  app.use(exceptionHandler);
}

/**
 *
 * @param app
 * @param quick_boot
 * @returns {Promise<any>}
 */
async function serveOctoFarmNormally(app, quick_boot = false) {
  if (!quick_boot) {
    logger.info('Starting OctoFarm server tasks...');

    TaskManager.registerJobOrTask(OctoFarmTasks.SYSTEM_STARTUP_TASKS);

    TaskManager.registerJobOrTask(OctoFarmTasks.PRINTER_INITIALISE_TASK);

    for (let task of OctoFarmTasks.RECURRING_BOOT_TASKS) {
      TaskManager.registerJobOrTask(task);
    }
    try {
      await optionalInfluxDatabaseSetup();
    } catch (e) {
      logger.error("Couldn't setup influx database connection...", e.toString());
    }
  }

  serveOctoFarmRoutes(app);

  return app;
}

module.exports = {
  setupExpressServer,
  ensureSystemSettingsInitiated,
  serveOctoFarmRoutes,
  serveOctoFarmNormally,
};
