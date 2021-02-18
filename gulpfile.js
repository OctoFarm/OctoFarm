const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const sourcemaps = require("gulp-sourcemaps");
const declare = require("gulp-declare");
const rename = require("gulp-rename");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const browserify = require("browserify");
const babelify = require("babelify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const cache = require("gulp-cached");

const { src, series, parallel, dest, watch } = require("gulp");

const jsCameraView = "cameraViewRunner.js";
const jsCurrentOperationsView = "currentOperationsViewRunner.js";
const jsDashboardView = "dashboardRunner.js";
const jsFilamentManager = "filamentManagement.js";
const jsFileManager = "fileManagerRunner.js";
const jsListView = "listViewRunner.js";
const jsPanelView = "panelViewRunner.js";
const jsPrinterManagement = "printerManagementRunner.js";
const jsSettings = "serverAliveCheck.js";
const jsServerAliveCheck = "settings.js";
const jsHistory = "historyRunner.js";
const jsClientFolder = "client_src/js/";
const jsClientFiles = [
  jsCameraView,
  jsCurrentOperationsView,
  jsDashboardView,
  jsFilamentManager,
  jsFileManager,
  jsListView,
  jsPanelView,
  jsPrinterManagement,
  jsSettings,
  jsServerAliveCheck,
  jsHistory,
];

const jsServerFolder = "server/";
const jsServerFiles = [
  jsCameraView,
  jsCurrentOperationsView,
  jsDashboardView,
  jsFilamentManager,
  jsFileManager,
  jsListView,
  jsPanelView,
  jsPrinterManagement,
  jsSettings,
  jsServerAliveCheck,
  jsHistory,
];

const jsDashboardWorker = "dashboardWorker.js";
const jsFileManagerWorker = "fileManagerWorker.js";
const jsMonitoringViewsWorker = "monitoringViewsWorker.js";
const jsPrinterManagerWorker = "printersManagerWorker.js";
const workerJsFolder = "client_src/js/lib/workers/";
const workerJsFiles = [
  jsDashboardWorker,
  jsFileManagerWorker,
  jsMonitoringViewsWorker,
  jsPrinterManagerWorker,
];

const cssFolder = "client_src/css";
const cssOctoFarm = "client_src/css/octofarm.css";

const octofarmClient = "views/assets/";

function octofarmImg() {
  return src("client_src/images/*")
    .pipe(imagemin())
    .pipe(gulp.dest("views/images"));
}
function vendorJS() {
  return src("client_src/js/vendor/*")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("views/assets/js/vendor"));
}
function vendorCSS() {
  return src("client_src/css/vendor/*")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("views/assets/css/vendor"));
}
function octofarmJS(done) {
  jsClientFiles.map(function (entry) {
    return browserify({
      entries: [jsClientFolder + entry],
    })
      .transform(babelify, {
        presets: [
          [
            "@babel/preset-env",
            {
              corejs: 2,
              useBuiltIns: "entry",
            },
          ],
        ],
      })
      .bundle()
      .pipe(source(entry))
      .pipe(cache("clientJS"))
      .pipe(rename({ extname: ".min.js" }))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(terser())
      .pipe(sourcemaps.write("./"))
      .pipe(dest(octofarmClient + "js"));
  });
  done();
}

function octofarmWorkersJS(done) {
  workerJsFiles.map(function (entry) {
    return browserify({
      entries: [workerJsFolder + entry],
    })
      .transform(babelify, {
        presets: [
          [
            "@babel/preset-env",
            {
              corejs: 2,
              useBuiltIns: "entry",
            },
          ],
        ],
      })
      .bundle()
      .pipe(source(entry))
      .pipe(cache("clientWorkerJS"))
      .pipe(rename({ extname: ".min.js" }))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(terser())
      .pipe(sourcemaps.write("./"))
      .pipe(dest(octofarmClient + "js/workers"));
  });
  done();
}

function octofarmCSS() {
  return src(cssOctoFarm)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat("octofarm.css"))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("./"))
    .pipe(dest(octofarmClient + "css"));
}
function reloadClient(done) {
  return done();
}

function watchTask() {
  watch(
    [cssFolder, jsClientFolder],
    { interval: 2000, events: "change" },
    parallel(octofarmImg, octofarmJS, octofarmWorkersJS, octofarmCSS, vendorJS)
  );
}

exports.octoFarmImg = octofarmImg;
exports.octofarmJS = octofarmJS;
exports.vendorJS = vendorJS;
exports.vendorCSS = vendorCSS;
exports.octofarmCSS = octofarmCSS;
exports.octofarmWorkersJS = octofarmWorkersJS;
exports.default = series(
  parallel(
    octofarmImg,
    octofarmJS,
    octofarmWorkersJS,
    octofarmCSS,
    vendorJS,
    vendorCSS
  )
);
