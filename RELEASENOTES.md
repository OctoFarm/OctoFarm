# Release Notes

 - A full changelog can be found on the github page. https://github.com/OctoFarm/OctoFarm

## [v1.2]

### Added
    - Added #546: Node 13 or lower issue webpage with instructions, doesnt restart server anymore
    - Added #509: HTTP/HTTPS support for websocket connections
    - Task scheduler: runs periodic tasks for OctoFarm in a controllable, periodic manner.
    - Added line counter to ticker log
    - Refactored task manager so it becomes easier to use
    - Global Client Error Handler: Grabs any errant / uncaught errors and displays a modal
    - Bulk actions will now produce a modal to track the actions which produces a status and message. This replaces the alert notification that flooded the screen previously.
    - Added #607: The user Octofarm connects with is now no longer static... You can open the settings modal and change the user OF connects with. It's still automatically selected on boot.
    - Added #295: Support for DisplayLayerProgress plugin. The List, Panel, Camera and Printer Manager views all now display this information if it's available. Works automatically on detection of the plugin!
    - Added #761: All filament selection boxes now show manufactuere.
    - Added #763: Allow file multi-upload to create folders if they don't exist.
    - Added a new Actions Bar to views. These contain filters and bulk commands for controlling printers.
    - OctoFarm now listens on the websocket for Plugin/System updates. After a command is fired for updating you will see a "Restart Required" flag in Printer Manager for the printer that requires it.
    - OctoPrint plugin / software update actions are printed to the Connection Logs in printer manager.
    - Added #762: Current Operations may now be sorted. Sorting is remembered on server side and resets with a server reset currently. You can sort by progress/time remaining/file name/printers sort index in ascending and descending.
    - Added a new option to the new action bar: Multi-Print!
        - Multi-Print is for starting... multple prints. It also takes care of checking if your printer is "Operational", uploading the file if it doesn't exist and actioning the print.
        - There are two modes, based on how many files you upload.
        - Single file mode: Detected when you select only 1 file. This will upload that file to all of the selected printers.
        - Multi file mode: Detected when you select more than 1 file. This will upload those files, one by one in a round robin to each printer. This works best with the same amount of files and printers. More printers than files, or more files than printers will result in some been missed off... It's not very smart!
    - New server side settings to enable and diable any monitoring views... You can now turn on/off each view in System -> Server -> Monitoring Views.
    - Added #299: New View combined mode, is a bulked out list view. Pretty much a combination of Panel/List/Camera views rolled into one super view.
    - New section in System for Release Notes. This will display the current version changes from the previous version.

### Changed

    - Completely reworked history cache, prepared and tested for OctoFarm V2
    - Slightly reworked file cache, prepared for V2 and made it robust - "robust"
    - Made API tests less prone to unnecessary failure
    - Reworked the Settings modal to be more resiliant to failure and cleaned up code
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
    - Refactor of History Runner with new OctoPrint Client service and added test coverage.
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
    - Printer Action buttons have been given a new breath of life. They are now a full bar of main actions with a dropdown for lesser used actions.
        - From left to right:
            - File Manager: New modal that just brings up the file manager, allowing a quicker access to starting prints, also includes the custom gcode buttons.
            - Printer Control: Same as before, Got a refactor to keep it all on a page without scrolling, and now nicely collapses for mobile views.
            - Quick Connect: Same as before.
            - Power Toggle: Same as before, if a power control is setup for printer it will display the toggle button. The previous dropdown for further actions has been removed.
            - Dropdown menu:
                - Starts with lesser used functions: Web Interface, Terminal (new modal for terminal focus, includes custom gcode), Re-sync printers.
                - Normal OctoPrint related power commands: Restart OP, Reboot and shutdown host.
                - Any inputted power function buttons so turn on/off printer.
    - Client settings are no longer global. They are now attached to a user, so different users can have different settings.

### Removed

    - Gulp packages and gulp as bundler
    - Some bulk actions notification alert
    - Ping/Pong message on connection log, redundant and ends up flooding the log.
    - Removed Offline count from Current Operations. Feel it's unessasary please open an issue if it's required back.

### Fixed

    - Fixed #531 - Updated settings are not grabbed when opening settings modal
    - Fixed #532 - Actual save port is not checked against live ports on OctoPrint on settings Modal
    - Fixed #567: heatmap error (race condition) in PrinterClean for any newly created database
    - Fixed #576, #577: correct some function calls in PrinterClean
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

