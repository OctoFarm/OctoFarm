# Release Notes

 - A full changelog can be found on the github page. https://github.com/OctoFarm/OctoFarm

## [v1.2]

### Added

- Added #546: Node 13 or lower issue webpage with instructions, doesn't restart server anymore
- Added #509: HTTP/HTTPS support for websocket connections
- Task scheduler: runs periodic tasks for OctoFarm in a controllable, periodic manner.
- Added line counter to ticker log
- Refactored task manager so it becomes easier to use
- Global Client Error Handler: Grabs any errant / uncaught errors and displays a modal
- Bulk actions will now produce a modal to track the actions which produces a status and message. This replaces the alert notification that flooded the screen previously.
- Added #607: The user Octofarm connects with is now no longer static... You can open the settings modal and change the user OF connects with. It's still automatically selected on boot.
- Added #295: Support for DisplayLayerProgress plugin. The List, Panel, Camera and Printer Manager views all now display this information if it's available. Works automatically on detection of the plugin!
- Added #761: All filament selection boxes now show manufacture.
- Added #763: Allow file multi-upload to create folders if they don't exist.
- Added a new Actions Bar to views. These contain filters and bulk commands for controlling printers.
- OctoFarm now listens on the websocket for Plugin/System updates. After a command is fired for updating you will see a "Restart Required" flag in Printer Manager for the printer that requires it.
- OctoPrint plugin / software update actions are printed to the Connection Logs in printer manager.
- Added #762: Current Operations may now be sorted. Sorting is remembered on server side and resets with a server reset currently. You can sort by progress/time remaining/file name/printers sort index in ascending and descending.
- Added a new option to the new action bar: Multi-Print!
   - Multi-Print is for starting... multiple prints. It also takes care of checking if your printer is "Operational", uploading the file if it doesn't exist and actioning the print.
   - There are two modes, based on how many files you upload.
   - Single file mode: Detected when you select only 1 file. This will upload that file to all the selected printers.
   - Multi file mode: Detected when you select more than 1 file. This will upload those files, one by one in a round-robin to each printer. This works best with the same amount of files and printers. More printers than files, or more files than printers will result in some been missed off... It's not very smart!
- New server side settings to enable and disable any monitoring views... You can now turn on/off each view in System -> Server -> Monitoring Views.
- Added #299: New View combined mode, is a bulked out list view. Pretty much a combination of Panel/List/Camera views rolled into one super view.
- New section in System for Release Notes. This will display the current version changes from the previous version.
- New user CRUD endpoints: /users/users. Required administrator rights to access.
- New system tab called "Users". Can created, edit, read, update all users. There is also a password reset option.
- You can now see UserLoggedIn/UserLoggedOut/ClientAuthed/ClientClosed events for OctoPrints websocket and user interface in the Printer Managers connections log.
- New columns setting for the Group Views, added in System -> Client -> Views.
- Added Another new view named "Group". Group view will organise your printers by their common groupings. This view is great for fire and forget type farms.
   - Group view will action on Print/Pause/etc commands for all printers in the group.
   - There is a special cut down file list you can bring up that collates all available files on each printer in the group. You may start prints from here. Note: There is no folders and the list may get large. The file name becomes the path to halp see which file is which. Search isn't available yet.
- Added a quick setup button for Filament Manager Plugin in System. This will run through all online instances and set the up with the database settings you provide.
- Filament manager can now clone spools. Pressing the button will insert a new row defaulting to 1000g and 0g usage. The name will be incremented with (#).
- System manager can now view the running OctoFarm tasks.
- HistoryRoutes now has server side pagination, should reduce resources some and make the history page load snappier.
- Any history data requests are now filtered starting from the first day of the last month. You should see at least 1
  months worth of data( when available ) as well as any from the current month.
- Filament Manager has some new settings in System -> Server -> Filament Manager:
   - Hide Empty Spools: If enabled this will hide empty spools from the spool selection dropdowns and also the main
     printer list. They are still visible in the Spool Manager. (with or without OP Filament Manager Plugin).
   - Downdate successful usage: If enabled history will attempt to take the OctoPrints gram calculation and add it to
     the amount used on the currently selected spool.  (only without OP Filament Manager Plugin).
   - Downdate failed/cancelled usage: If enabled history will calculate the percentage through a print and using
     OctoPrints gram calculation add it to the amount used of the currently selected spool. (only without OP Filament
     manager Plugin).
- New detection for multiple user OctoPrint setups. If your user is named "OctoFarm" / "octofarm" & an Administrator it
  will automatically choose this user to use.
- Graceful shutdown to OctoFarms service. The app will not close all tasks, printer connections and database connections
  before killing itself.
- Added the ability to set the logging level by environment variables. Example: LOG_LEVEL=info. Accepted
  values=info,debug,verbose
- New alerts section on printer manager, moved all the OP updates, and printer issues to here with their own dedicated
  icon and action button.
- New button to do a Re-Scan and Forced Re-Scan of OctoPrint's API. This is to update information from OctoPrint ->
  OctoFarm. Does nothing to your websocket connection.
- New button to do a websocket reconnect if one is available. It will close the socket and re-open to refresh.
- New websocket management system that keeps itself sustained. Should not require re-connecting to it at all unless
  purposefully closed.
- Added git repo information to system page, and also added git check for update commands.
- Printer manager now has a ticker for the printer alerts. Displays planned websocket/api scans, octoprint updates, plugin updates and more.
- Add current Miliseconds since Jan 1970 string to log dump zip name.
- Made enhancements to the log system:
   - Logs now show created date, as well as modified.
   - Log files can now be deleted.
   - Additional button to house keep log files. Cleans any logs older than a day.
- Added support for additional file types. These should allow the further support of OctoPrint-BetterGrblSupport Plugin and OctoPrint-Chituboard Plugin ".gcode,.gco,.g,.ctb,.fdg,.nc,.gc" - Added to docs.octofarm.net
- Active sessions now viewable on System -> System Information page.

### Changed
- Completely reworked history cache, prepared and tested for OctoFarm V2
- Slightly reworked file cache, prepared for V2 and made it robust - "robust"
- Made API tests less prone to unnecessary failure
- Reworked the Settings modal to be more resilient to failure and cleaned up code
- Slightly reworked job cache, prepared for V2
- Added the ability to override the automatic wss:// select for HTTPS in printer settings modal.
- Added the ability for settings dialog to return to "Printer Online" view when printer comes online in background / from settings changes.
- Amended the functions for Global OctoPrint update and Global OctoPrint plugin update
- The core `state` of OctoFarm is split off of OctoPrint and added possibilities to test it fully
- Rewrote imports and entrypoint of frontend javascript for webpack
- Added Webpack to replace Gulp frontend bundler
- Rewrote dashboard page and completely refactored javascript code in browser
- Moved filament cleaner startup to app-core
- Made NODE_ENV to be production by default causing the @octofarm/client bundle to be loaded and console logging to be filtered with level INFO/ERROR
- File manager: gave printer titles a badge. Gave selected printer a yellow border.
- Refactor of HistoryRoutes Runner with new OctoPrint Client service and added test coverage.
- Refactor of Printer Manager client view templates. All Manager functions under seperate dropdowns, wider connection log.
- Refactor of Printer Manager client code bringing a little speed boost (avg 40fps -> 50fps) and better fault tolerance.
- Refactor of SSE client into re-usable file.
- Moved the "API Errors" button, now appears on the start of a printer row and clicking will take you straight into Printer Settings.
- Refactor monitoring pages (panel, list, camera) with latest SSE client reusability.
- Refine the printer map layout with borders and printer quick actions (page not public yet).
- Reduced logging (we will bring it back later in different shape with an Exception handler)
- Replaced fetch with axios in the local OctoFarm client calls.
- Moved all error handling for client connections into axios calls
- Refactored System page into separate manageable files ejs/js, cleaned up a lot of code.
- Updated the system page layout.
- Moved filament manager plugin actions to separate service file.
- Printer offline logs (specifically connection refused) are now silenced after the first one.
- Bulk commands are no longer in Printer Manager -> Moved to the action bar on views...
- Custom gcode editor has been moved -> Files Manager and given a functionality boost.
   - You can now change the colour of the button displayed in the UI. Old buttons will default to "Green".
   - You can now filter the buttons by printers. Old buttons will default to ALL printers.
- All octoprint plugin/client update commands have been moved under "OctoPrint Management" dropdown on Printer Manager.
- Cleaned up OctoPrint Management icons, no longer all the plug.
- Continual work on improving readability and contrast across the application.
- Dashboard statistics are now produced on demand, should improve loading times a touch.
- Printer Action buttons have been split up. I've left Web, Quick connect, ReSync and Power on the top bars for printer
  actions. Then the Printer Control from before has been split up.
   - Printer control is now Files, Control and Terminal. You will find these on most of the views in various places.
- Client settings are no longer global. They are now attached to a user, so different users can have different
  settings/dashboard configurations.
- File manager improvements, re-sync's are near instantaneous now.
- Improved OctoFarms initial scan on boot and re-sync scans. Is much faster and will run multiple printers at once.
- Removed the limits from Filament Manager that isn't using Filament Manager Plugin. You can now edit and see your
  remaining filament.
- Improved filament manager plugin syncing. Now runs through various checks including making sure the plugin is setup
  correctly. It will fail to enable if that is so.
- Enabling filament manager now toggles the spool check "on" by default. You can still turn off in the settings if
  required. Existing setups unaffected.
- Filament managers spools only accept a +/- 50 on the temperature offsets. This is all OctoPrint allows.
- Added the ability for spools to have a bed offset. Caveat with multiple spools on a printer is that it will pick the
  first spool to apply an offset.
- Filament Manager can no longer delete spools if attached to printer.
- Filament Manager can no longer delete profiles if attached to spool.
- Filament Manager totals are now displayed in KG.
- Re-enabled the filament manager spool assignment:
   - Without filament manager plugin this will be a multi-select option. You can CTRL + Click to select mutliple, or
     normal left click to select a single.
   - With filament manager plugin this will be a single dropdown menu only allowing to select a single spool as per the
     plugins requirements.
- Printers with selected spools are now disabled from selection without filament manager plugin.
- System information now shows OctoFarms usage as a pure value rather than just on the donut charts.
- Cut down the history table view. Now only shows State/Printer Name/File Name/ Start/ Duration/End/ Cost/Hourly Cost.
  All other info is inspectable in the "view" button.
- Refreshed the HistoryRoutes page Layout. Now has headers that show Monthly Totals, Statistics modal, Monthly Statistics
  Modal, Pagination, Sorting, Range and Filters.
- Printer Manager "Re-Sync" button renamed to "Re-Connect" to differentiate it from the file manager action.
- Improved filament usage estimates, if a jobs previous print time exists it will utilise that over the estimated value
  from OctoPrint which is often wildly inaccurate.
- Completely reworked the history UI.
- Client's Am I Alive server check is now through the Server Side Events, rather than constantly polling the API.
- OctoPi-Plugin/OctoPrint-SystemInfoPlugin are now saved to the database. Printer firmware is remembered as long as the
  printer has been scanned online once!
- If OctoFarm detects OctoPrint a multiple user setup then it will warn you rather than just producing a stale
  connection with no indication to what's happening.
- Decoupled the API and Websocket calls. Printers will now connect in the following manor following fail hard and fast.
   - Attempt to grab the octoprint version
   - Attempt to grab both Settings and Users endpoints for initial multi-user setup and global api key checks
   - Attempts to grab all required information from OctoPrint.
   - Creates Websocket Client.
   - Attempts to grab optional information from endpoints.
- Initial scan times changed, all data is now stored in database and will only update on a forced re-scan.
- Due to the inclusion of User CRUD manager registration is now disabled after creation of first admin user.
- Plugin lists/notices are now grabbed from octoprint.org not the printer. Removed one api call per printer and a lot of
  pointless duplicated data chunking.
- Plugin enable now only shows disabled plugins available on all printers.
- Plugin disable now only shows enabled plugins available on all printers.
- Plugin uninstall now only shows plugins installed available on all printers.
- OctoFarm now periodically (once per day) will run a scan to see if any updates are available for your instances
- Converted to a basic mono-repo to aid in development. Scripts have been created for backwards compatibility with current start instructions.
- Restart, Check for Update and Update OctoFarm buttons have been moved to the top of the "System" tab on the System page. This is to aid in security and stop users messing with system functions.
- Changed server API logging over to morgan.
- Moved the change background functionality out of client and into Server settings for admins only.
- Quick actions is now a Quick Connect, Power Toggle, Menu. Menu contains:
   - OctoPrint Web, Resync Socket, Power settings. More coming soon!

### Removed

- Gulp packages and gulp as bundler
- Some bulk actions notification alert
- Ping/Pong message on connection log, redundant and ends up flooding the log.
- Removed Offline count from Current Operations. Feel it's pointless please open an issue if it's required back.
- state.js - WOOP HAPPY DAYS! Ripped out and gone for good!
- runners folder - Boom more feel goods!
- Reset Power Settings Option - No longer needed after settings saving refactor.

### Fixed

- Fixed #531 - Updated settings are not grabbed when opening settings modal
- Fixed #532 - Actual save port is not checked against live ports on OctoPrint on settings Modal
- Fixed #567: heatmap error (race condition) in PrinterCleanerService for any newly created database
- Fixed #576, #577: correct some function calls in PrinterCleanerService
- Fixed #542, #381: ensureIndex mongoose warning and circular Runner import resolved
- Fixed #598: printer settingsAppearance missing will not cause failure anymore
- Fixed #596: changed OctoPrint plugin manager repository to new route with backwards compatibility version check
- Fixed #608: Global update button was not appearing
- Fixed #555: Offline after error not caught by OctoFarm. 1.6.0+
- Fixed #609: Bulk printer functions wouldn't load due to small regression bug
- Fixed #587: Changing printer URL doesn't rescan for changes when using settings modal
- Fixed #592: Printer host is marked Online when URL is not correct / fake
- Fixed #574: Reworked the statejs OctoPrint client and added tests
- Fixed #630: System Info calls took huge amount of event-loop time (>2000ms) on Windows with a 2500ms interval period. Disabled for huge performance loss.
- Fixed #641: Opening the console on the Printers Page with offline printers would crash the browser due to spam.
- Fixed #638: Fixed login not working anymore after refactor
- Fixed `snapshots` instead of `snapshot` bug on client system Javascript bundle
- Fixed #655: Server-sent events were failing due to breaking import path of the flatted package. Fixed that path server-side.
- Fixed #625 - Incorrect html tags on Printer Manager
- Fixed #548 - Smaller screen action buttons wrapped incorrectly on Printer Manager
- Fixed #665: If Global API check fails due to intial time out, never recovered and tried again increasing timeout.
- Fixed #670: File manager initial and subsequent scans we're not recursive.
- Fixed #669: File manager scroll wouldnt reset after switching printer.
- Fixed #590: The Back button now disables when there's no folder to go back to.
- Fixed #679: OctoFarm would stall on air gapped farms due to checking for OP updates.
- Added Filament Clean back to start up so filament manager and spools list load.
- Fixed #605: Tool total would show "null" if no spool selected.
- Issue with totals not been counted with/without a spool selected on Printer Control.
- Fixed #667: Weekly Utility was not loading the previous days values.
- Fixed #698: Current Operations would try to load the old browser worker. Replaced with sse client.
- Fixed #681: Current Operations would load on dashboard even when not enabled in settings
- Fixed an issue with gcode scripts table
- Fixed issue with Pre-Heat bulk command sending commands without a value inputted / value at 0.
- Fixed bulk control function trying to display camera image when non available.
- Fixed issue where disable, enable and uninstall plugins would show duplicate plugin list.
- Fixed #730: Group selections we're not working as intended...
- Fixed #672: Tool temperature offset's we're not applied before a print.
- Fixed file manager showing folders with "_" in folder name.
- Fixed and issue with file manager crashing if searching an empty directory.
- Fixed "No Files Available" not been removed after uploading a file...
- Fixed current operations on mobile views... now stacks the cards correctly.
- Fixed an issue we're Printer Statistics wouldn't open if printer had never been live.
- Fixed websocket issue not updating when printer url changed.
- Fixed issue where user could enter updated URL with http:// prefix and would cause errors in backend.
- Fixed an issue where the client would repeatedly * printer amount call for filament manager settings...
- Fixed changelog been considered a block via parsers.
- Fixed the buggy behaviour of the printer swap drop down in Printer Control.
- Fixed system settings saving not correctly checking if reboot required on server and only requests client to reboot if required.
- Fixed history chart colours for Failed and Cancelled been mixed up.
- Fixed OctoFarm sending tool/printhead commands when cancelling a print.
- Decoupled the historyByDay stats so they generate if you don't use spools/filament mananger at all.
- Fixed history trying to capture timelapse, thumbnails and influxdb without been enabled...
- Fixed history not registering spools when cancelled in some situations.
- Fixed Latest file re-syncs we're not saved to database.
- Fixed Put an SSE event source re-connect using debounce function. If connections lost, every browser should attempt
  to reconnect now. Chrome didn't sometimes.
- Fixed an issue where SSE would lose the connection url if server connection lost.
- Fixed File manager been an outright bag of crap. Files now load correctly after commands, instantly too.
- Fixed Improved the OctoPrint file update grab so it doesn't end up making multiple calls.
- Fixed Fix an issue with folders not reflecting their state correctly after command in file manager.
- Fixed the utter mess of saving printer settings.

# Security
- Protected all system CRUD endpoints by ensuring user is Administrator.
- Protected all user CRUD endpoints by ensuring user is Administrator.
- Protected all Alerts CRUD endpoints by ensuring user is Administrator.
- Protected Filament Manager Plugin Enable and Filament Manager Full Resync endpoints by ensuring user is
  Administrator.
- Protected all administrator only actions as additional protection.
- Added basic http server protection to express with helmet.
- Added rate limiting to all endpoints, 100 requests in 5 seconds will trigger the global one protecting all endpoints.
   - /printers: 100 requests in 1 minute.
- Validated inputs on endpoints:
   - /printers: update, add, delete,
   - /settings: server/delete/database, server/get/database
  