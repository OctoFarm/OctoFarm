# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.5.5]

### Added
    - New sorting function for Camera, Panel and List view's. You can now filter by Idle, Active, Disconnected and Complete states and your available groups
    - You can now choose the sorting for the view too by Index, Progress and Time.
    - Added support for PrusaSlicer Thumbnail and Ultimaker Format Package Thumbnail plugins. 
        - Usual OctoFarm standard applies, if you've just uploaded you need to re-sync to generate the thumbnail with the rest of the meta. 

### Changed
    - Error's are now captured as a full log set. To be displayed in UI at a later date.
    - History.js is non-destructive to filament

### Removed
    - Old sorting functions

### Deprecated

### Fixed
    - Fixed Printer Manager page name
    - Fixed issue with error message not displaying in hover
    - Fixed Alerts Trigger column not been wide enough to display alert.
    - Fixed Alerts section of printer settings not showing Trigger selection


## [v1.1.5.4]

### Added
    - Seperated out process/system uptimes on server settings

### Fixed
    - Fixed issue with heating trigger not working with floats
    - Fixed issue with Power settings not sending correct command

## [v1.1.5.3]

### Changed
    - Changed message for websocket returning to Alive and Receiving data

### Fixed
    - Websockets terminated correctly when changes are made to edits and farm updates.
    - Fixed filament manager setting not been respected
    - Fixed issue with multiple histories been logged due to websocket termination

## [v1.1.5.2]

### Fixed
    - Alerts manager didn't allow saving of new alerts

## [v1.1.5.1]

### Fixed
    - Fixed issue with history stalling on loading old database entries.
    - Fixed issue with editing printers not correctly clearing out the old ones.

### Security

## [v1.1.5]
 - Notable changes only: to see exact changelog please look at DEVELOPMENT below. 

 - New Dashboard
 - New Printer Management screen
 - Statistics/filters added to most pages
 - Improved octoprint monitor with speration between OctoPrint Host, OctoPrint Server and Websocket connection
 - Filament Manager complete re-design
    - Caveat: Old filament manager database no longer works
 - Overhauled history with information from filament manager and new printer settings i.e. cost. 
 - New Printer settings panel
 - New Printer control panel
 - PSUControl and other power plugin support
 - New Alerts system with ability to fire custom system script.


## [DEVELOPMENTS]

## [v1.1.4.9-dev-4.4]

### Added
    - History Page:
        - File Name Search
        - Path Filter
        - Spool Name Search
    - Filament Manager: 
        - Pagination added to Spools and Profile lists
        - Default sort option for spools
        - Material Filter for Spools
        - Spool Search
        - Statistics bar at the top
            - Used / Remaining Progress Bar
            - Counts for profiles and spools
            - Total Weight/Used/Price
            - Material Breakdowns for Weight/Used/Price
    - File Manager: 
        - Has basic statistics: File/Folder Counts, Largest Smallest and Average Size/Length
        - Displays current printer state
        - Printer list now has a filter for Active,Idle and Disconnected printers
        - Can now select filament from file manager.
            - Change filament and re-sync to update costs.
    - Alerts: This alerts are fired on a specified trigger and run a custom script with a single command passed through
        - Select Triggers: Print Done, Print Failed, Print Errors, Cool Down, Print Paused
        - Custom Script Location
        - Save new script
        - Delete old scripts
        - Edit scripts
    - Printer Settings 
        - Now shows all the current alerts applied to that specific printer
    - List view Extra Info now includes percent remaining. 
    - Printer errors are now logged to a seperate database. 
    - New dependancy for nano events
    
### Changed
    - Moved filament manager plugin sync to server settings under Filament Manager Settings. 
    - New Filament Setting: Check if filament selected and warn to add one before starting a print. Default: False.
    - Filament Manager allows selection when printer active IF filament Manager plugin is not linked.
    - History now asks if your sure on deletions...
    - Server settings now only prompts to restart when changing setting that requires restart
    - OctoFarm now rescans the client when updating throttle settings.
    - Temps now all read from unified temperature file, should keep consistency across the board. 
    - Temps are now applied independant of state. Each state has some triggers:
        - Active: Will display orange if temperature drifts out of heating variation settings
        - Complete: Will show blue when fully cooled down
        - Everything else: Will update temperature if figure available.

### Removed

### Fixed
    - Fixed broken printer settings modal
    - File Manager file action buttons on new line
    - Broken total percent in filament manager
    - Broken action buttons on views
    - Indefinate counter on ETA
    - Fixed issue with filamentCheck not getting applied with no setting.
    - Fixed firefox not added editable text boxes in
    - Fixed sticky tables on history
    - Added sticky table to printer management
    

## [v1.1.4.9-dev-3.9]

### Added
    - Farm Utilisation chart on dashboard now calculates Failed Hours. These are the hours totaled registered from history that are set as success = false;
    - Idle hours is now black on the farm unitlisation key, red for failed and active is green.
    - Keys and bar charts added to the Cumulative/Average times on the dashboard
    - Keys added to the Printer Status, Printer Progress, Printer Temps and Printer Utilisation heat charts on dashboard.
    - Current Operations View. Displays full screen the current operations bar. 
    - Panel, List and Camera View all react to groups now. When loading a page it will always default to "All Printers", any modification with the drop down will append a URL to the page. This URL can be re-used as a book mark to automatically load a group. 
    - History page now has metrics.
    - Can now select and save filament changes in history.
    - Server Settings re-activated with the following:
        - Shows server Status here instead of dashboard.
        - Lists current log files and allows for download.
        - Server settings
        - Server timeout settings
    - When saving settings it now asks if you'd like to restart OctoFarm. Confirm will restart the service. 
    - Client settings to show extra information on views. List, Panel and Camera View
    - File manager shows weight when length is calculated. Defaults to 1.24 density with 1.75mm filament.
    - History button to set default sort function button and pagination. Remembers previously set values on client. 
    - File Manager now has sort capabilities. File Name, Print Time, Upload Date.
    - New Printer settings modal. Connection Defaults, Profile Changes, Power Button actions, Gcode Script and Other Settings (Camera / Heating Triggers)
    - History now has filter dropdowns for File Name, Printer Name, Filament Type. 
    - Activated the restart/shutdown host and octoprint buttons
    - Added checks for power state if enabled. Will check every 20 seconds for a state change unless powered off/on/toggled through the UI.
    - Added buttons to activate the settings for power control. You will only see options for which you have setup.
        - Drop down will show "Power On/Off" 
        - As above it will check every 20 seconds for a state change, unless you action power toggle/on/off. 
        - Main power button will toggle the current state.
        - The Main power button will show the following colours:
            - black - No status could be found.
            - red - Printer is turned off.
            - green - Printer is turned on.
    - Filters on history table also now show totals of everything filtered, ignoring pagination.
    - Printer Cost settings calculation
        - Default values added on printer init. 
        - Enter in your printers Power Consumption, kilowat price, purchase price, esitmated life span, maintenance costs
        - Will be calculated on history grab. 
        - Due to cost settings been captured on history grab no backwards compatablility. Have added ability to "Update Cost" settings, if printer doesn't exist in database anymore then a default set of values will be used.
        - History statistic totals now include Total Printer Cost/Highest Printer Cost
        - History filter totals now show printer cost total and combined total.
    - Added drag and drop to all views and printer control panel
        - Currently when you drag a file and hover over a printer/file list you will get a darkened box, dropping your file here will initiate the upload. 
        - If you only have a single file it will ask if you would like to print the file.
        - If you are on Printer Control/File Manager it will choose the current folder to upload too.
        
### Changed
    - Group dropdown only appears if groups exist.
    - Renamed the views removing the "Views" Tag. Added in placeholders on hover to describe function.
    - Filament manager now get's its own page (caveat, full redesign so no longer works with old database, history will show but will not recognise a filament. Editing ability to select the spool as been enabled if you'd like to update them.)
        - New support for the filament manager plugin, press the sync button at the bottom of the filament page to activate. You will require this to automagically track filament usage on your spools.
        - Will now track costs if available. 
        - Can also apply temperature offsets with these, whatever is entered -/+ into the offset field will now be applied at the start of a print.
    - Reduced the width of printer manager, allowing for click close outside of the modal window.
    - History page now loads latest first as default.
    - Removed underscores from history page. 
    - History page will only load now with history added. Message to collect some before activation pops up. 
    - Job information is now captured within history for cancelled prints. May use in UI at a later date. 
    - If filament exists in library then ask if you'd like to select before print. 
    - History now captures information and waits 10 seconds before triggering the collection. This is for filament manager sync to collect the latest values before proceding. 
    - Power Settings and Alerts are now saved in database
    
### Removed
    - Old filament manager and database structure. 
    - Removed serverConfig file, now stored in the database and edited through the UI. 
    - Removed file statistic from dashboard
    - Remove old sort function from History

### Fixed
    - Fixed Panel view file name been stuck in loading...
    - Printer control not correctly displaying step rate.
    - Fixed issue with list view not updating list colour on state change.
    - Fixed issue with history index sort requiring two clicks.
    - Filament calculation now correctly applies to power of.
    - Fixed annoying pop-up with no printers.
    - Fixed groups not hiding when none availabe.
    - Fixed errant blank group showing.
    - Cancelled prints not grabbing name of printer
    - History collection creates unique ID based on the last captured print index, rather than the history length.
    - Fixed issue with selected filament getting overwritten when passing to history.
    - Fixed weight calculation been unusually high.
    - Fix for jobs not been captured
    - Fixed issue with filament manager not adding filaments due to 0.00 on temp offset.
    - Not collecting history if there was none.
    - Fixed issue with ping pong incorrectly fireing for mid-connection websockets
    - Fixed history index not sequencially counting if multiple entries collected at same time.
    - Fixed issue where filament would update on List/Panel view when changes/history captured.
    - Dropdowns for power appearing off page.
    - Fixed power dropdowns showing under cam headings/panel
    - Typo's in client settings
    - Timeout with large file sets

## [v1.1.4.9-dev-2.7]

### Added
    - Printer Control Manager now allows for switching of printers on the fly from the modal. No need to close and re-open. 
    - Historical collection for Farm Statistics, now gathers up to 1 hours of live data. (Temperature). Resets on server restart. 
    - Added loading status to all dashboard graphs and data. 
    - Activity heatmap for the last 7 days - Calculates a percentage of activity per printers in that state for the whole day, calculation will happen all day then save the final days value. 
    - Added check for if printers exist on dashboard load, note tells you to add some.
    - Added new Patreon member EIPS to About page. 
    - Tool tip explanations for states on Printers Page. Host, Printer and Websockets. 
    - New state when printer fresh on the farm, "Setting Up" Whilst awaiting for scanner to finish with other printers. Hits searching state straight after.
    - Tool tip explanations for dashboard Action buttons, and Printer Management setup buttons, camera view, panel view and list view and current operations.
    - Any table headers are now clickable and can be sorted by the text below. This includes, Printer Management, Filament List, List View, History. Hovering will display a sort icon to indicate can be sorted.
    - Sort Index is now viewable on Printer List, will auto update after moving a printer into a new sort index.
    - Note to README regarding thanks to JetBrains for use of their IDE.
    - New dependancy "requests" Required for API calls to user endpoints. 
    - New heat type graphs, Printer Status, Printer Progress, Printer Temps, Printer Utilisation. - Will be adding a key in next version. 
    - Farm Utilisation back and updates live with active printers. 
    - Current Status bar graph. 
    - Current Utilisation graph. 
    
### Changed
    - Printer web button does not disable when offline
    - Printer re-sync now detroys any established connection and re-sets up the specific printer fresh regardless of state..
    - Uploads done on the Printer Control modal are now not dependant on the status you can check the status by viewing the printer. A complete notification will be done whe the file has been uploaded. 
    - Current upload count no longer uses the +/- mechanism, it counts the uploads and displays the current amount found.
    - New farm status graphs for Temp. Shows Actual and Targets for global tool and bed temperatures with a status at top for total farm temperature. 
    - Dashboard printer list now moved to it's own page Printers. 
    - Printer list has changed to scroll with page. The full list is loaded rather than constraining to a specific height. 
    - View pages no longer inside dropdown
    - Editing printers only re-scans the currently edited set. 
    - Path now shows on hover in printer manager & list view. Panel and Camera will take some time due to wrappers overlaying the tag...
    - History now shows view icon instead of edit for captured prints, Notes are still editable.
    - Changed up the farm Status styling to more match inline with OctoFarm colours
    - All views inc... Printer Control now truncate names to not overflow, add "..." to the end of the string to state it has been truncated. 
    - All views inc... Printer Control now display the full path when hovering over file name.
    - Re-Sync does a full sync of octoprint again. 
    
### Removed
    - Pointless space wasting footers on dashboard
    - CPU Stats from main page. 

### Fixed
    - Printer Camera in printer mananger now displays correct placeholder when no URL detected. Placeholder updated for new URL system. 
    - Added in websocket Ping/Pong which will fire every 30 seconds to check the connection is still alive
    - Fixed annoying browser console output warning of multiple similar id's
    - Fixed saying "Done" when 0 seconds was detected.
    - Fixed issue with history not grabbing relevant job information due to OctoPrint sending null information when prints started without the gcode calculation running. Added checks for progress and currentZ too. 
    - Fixed issue with startup trying to grab currentOp/statistics too fast causing errors. 
    - Fixed logs not been deleted
    - Fixed circular structure errors with moving over to Flatted library for JSON stringify/parse.
    - Fixed overly long filenames causing wrapping issue on Camera View
    - List view not respecting word wrapping for file name
    - Fixed gap in top of list view header when scrolled
    - Fixed error with history page not displaying job information on view
    - Fixed incorrect re-direct to login/registration pages when either is disbaled. Login disabled will re-direct straight to the dashboard now. 
    - Fixed issues with pages loading with no printers. 
    
## [v1.1.4.9-dev-1]

### Added
    - New Node dependancy's, make sure to run "npm install" & "npm update"
        - pm2: Now takes over daemonising your server. Should work cross platform, and allows for server restarts to be done from the GUI. 
            - Log's are still output to the log folder but you can use the following commands to control your installation:
                - pm2 stop OctoFarm: Stops the running OctoFarm service. 
                - pm2 restart OctoFarm: Restarts the running OctoFarm service. 
        - exec: Used for executing the pm2 scripts for restarting OctoFarm server. 
    - Much improved logging for all areas. Now creates new log files as follows:
        - OctoFarm-Server.log: Server errors and information
        - OctoFarm-State.log: Printer logging for state collection...
        - OctoFarm-API.log: Logs all actions made from the client -> OctoFarm.
        - OctoFarm-HistoryCollection.log: Logs all attempts at adding prints to history. 
    - Disonnected state is now counted and shown in Current Operations overview.
    - Terminal input can now be pressed with enter key
    - Terminal input now auto capitalises all inputs.
    - Printer Management now allows editing printers already on the farm. Turn on edit mode on the dashboard.
    - File manager now list upload date next to print time.
    - File manager now has an upload and print option.    
    - Current Operations has a new button "Restart Print" Shows up when print is complete allowing you to quickly restart that specific print. 
    - Views now have a cooldown colour change on the temperature icons. When under a specified limit the icon will go blue indicating the tool/bed is now cool.
    - All views now have 3 buttons, Printer Control, Web View (OctoPrint interface) and Power Control.
    
### Changed
    - Dashboard has had a re-vamp.
        - Printers are now added inline. Clicking "+ Add Printer" will pop up a box to the top of your printer list. Deleting it can be removed, and saving the printer it will be added to a new row on the list and start off a scan. A notification will be generated after a connection attempt. 
    - Closed is now renamed to Disconnected. This is when your USB port is not connected to OctoPrint. 
    - Server Settings only accessible by Administrator.
    - Filament moved from System Menu to the navigation bar. 
    - Switched over to new platform for feature requests: https://features.octofarm.net
    - Split the Printer states for the dashboard to make it clearer. There is now the following: 
        - WebSocket: 
            - Green: connected.
            - Yellow: Live but not receiving data. This is usually due to your printer been disconnected from OctoPrint when added as no data is transmitted from OctoPrint. 
            - Red: not connected.
        - Host State:
            - Online: Host connection active
            - Shutdown: Cannot connect to host
        - Printer State: 
            - Disconnected: Printer not connected to OctoPrint.
            - No-API: Failed to grab API status, usually due to CORS if Host State = Online.
            - The usual OctoPrint states: Idle, Printing, Cancelling, Error, Paused, Pausing
    - Full file manager added to Printer Control pop-up.
    - Printer Manager now split (Old Setting Cog):
        - Printer Control (Printer Icon): Connection and Printer Control inc... file manager. 
            - File selection here now has the majority of the File Manager functionality for a single printer. 
        - Printer Settings (Cog Icon): Anything that's a 1 time settings, so Settings, Alerts, Power and Gcode Scripts
        - Printer Power (Power Icon): Will open the power menu for shutdown, restart, reboot and custom buttons setup in the Printer Settings Modal.
    - Split the information generation for Server -> Client comminication, will save some CPU on serverside and client side... 
    - If printer name not available will default to IP. 
    - Converted to using a full URL string for printer connection... 
        - If you already have port:ip set in the database this will be automagically converted for you. It will default to http:// when creating the new field. 
        - Anyone adding and setting up new printers will have to use the full URL string now. If you leave http:// out it will automatically add that in as default. 
    - Camera URL is similar to above, it will automagically add in the http:// for you if you have previous items in the database, you may also specify your own connection string with https://.
    - Temperature values no longer use the external buttons on the input. This is now a number field and uses the original HTML up and down arrows that appear on focus.
    - Export printers now exports with the following tags: Printer Name, Printer Group, Printer URL, Camera URL and API Key
    - Import printers no longer deletes all old printers to import new ones. The new printers are added to your existing list. 
    - Completed Prints are now triggered by percent complete rather than Print time left as it seems prints can get left with time left when actually completed.
    - Moved all detailed instructions to the WIKI page, and removed from README.md.
    - Views progress bars now display colours to corrospond with state. Yellow = Currently printing, Green = Complete. 
    - Camera View now displays text on the print and cancel buttons. 
    - File manager brought inline with the printer manager version after update.
    
### Removed
    - Printer Management, see changed regarding dashboard. 
    - History and file statistics from Dashboard.
    - Removed systemInfo from database, extra uneeded steps as data is all gathered live anyway. 

### Fixed
    - Long server starts due to second information grab. Now runs in the background to not effect start up.
    - Fixed issues with throttle and server re-start checking printers whom the hosts are not online. 
    - Fixed issue with multiple connected clients causing bubbling when grabbing information from the server. 
    - Fixed issue with JSON Stringify error and clients receiving duff data due to it. 
    - Fixed file manager single file refresh.
    - Fixed and issue with folders not allowing entry when created inside a path. 
    - Fixed issue with newly created folder not recognising new file till refresh.
    - Fixed issue with newly created files not moving to folders until refresh.
    - Fixed issue with Camera view reacting to Panel view Hide Disconnected Setting.
    - Fixed spacing icon on temperature displays
    - Fixed views not updating temperature for complete/idle printers.
    - Fixed cameras not applying multiple rotate settings

## [Released]

## [v1.1.4-6-bugfix]

### Added 

 - Added back in the re-sync all button. This will fire off the same re-sync command as the printer one but for all printers. 
 - Websockets connections are now indicated separately to Printer Status. The Printer Icon on the dashboard will show this status. 
    - Green = Currently connected
    - Yellow = Attempting a connection
    - Red = Disconnected.  
 - State now grabs an Error and displays on the printer status label if one occurs until rectified. 
 - Show printer index on printer with no name
 - Current Operations Card on view's now displays the predicted end date and time, calculated from the current date + print time remaining.
 - More Checks into the API/Websocket connection... if it fails to grab your API Key it will now warn you. You will see "No-API" in the state. Pressing the refresh button for your printer on dashboard will attempt a reconnect. 
 - Current Operations allows you to now de-select a file and remove it from the view. When a print is complete, you will see a "Harvest Your Print!" button, click it to remove the printer from that View.
 - Added configuration options to /serverConfig/timeout.js - This is for any printer that doesn't respond quick enough i.e the Prusa instances have shown to have this issue. Issue #26.

### Changed
 - Dashboard layout has been updated with a fixed sidebar. Medium sized screens and above will display this. 
 - Refactored mobile views for dashboard - See Deprecated.
 - Current Operations now viewable on mobile.
 - async information reception from server -> client. 
 - State should now show if Serial Error occurs on OctoPrint.
 - Shutdown printers, that have been scanned by the farm will now wait 15-seconds before trying to grab an API connection. This should help those with websockets not connecting initially.
 - History now captures and displays selected rolls of filament. No usage available from OctoPrint currently.
 - An initial API connection timeout now increases until it hit's an upper limit. So all API connections will attempt at the default of 1000ms, this will then increase to 10000ms after the first attempt hitting the upper limit and hard fail afterwards. These are configurable in serverConfig/server.js.
 
### Deprecated

 - Mobile view printer list no longer available due to dashboard changes. Will be returning in later release. 

### Fixed
 - Issue #21 - Camera View and Panel view don't respect Offline/Shutdown printer hiding.
 - Sometimes when removing printers would incorrectly try to update the state still.
 - Some offline/shutdown Printers would try ask to Re-Sync when not required due to still been offline/shutdown.
 - My git account... pushes as myself now. Hopefully...
 - Camera View Current Operations now updates with printers.
 - Fixed issue with Current Operations not clearing final finished or ended print card. 
 - Issue #22 - File Manager crashes when using Canvas Hub.
 - Docker should now correctly put logs into log folder.
 - Freshly created filament is now found and saved in the history logs. 
 - Issue #26 - File timeout issues. 
    - This issue is down to a ludicrously large amount of gcode files stored on a persons OctoPrint system. If your a gcode hoarder and having issues with your files scanning into OctoFarm you will need to play with the API connections, or do some house keeping. Anyone else you won't know any different.
    - Some numbers reported back from a user:
        - sub 200 files, was completely fine. 
        - 380 + files will nearly hit the full second api timeout which is 10 seconds...
        - 670 + files you will need to play with the system timeout I've created to get those to scan. 
    - I will be working to make improvements to this in the future where possible but for now the timeout changes will succeed and I believe it's only an edge set of users that get this effect going by reports I've had. If you do not, do not worry. 

## [v1.1.4-2-bugfix]

### Added
 - New states to OctoPrint detection... Now includes and reacts to "Searching..." + "Shutdown".
    - Searching... will be shown when OctoFarm is trying to make a connection to to OctoPrint... 
    - If the OctoPrint host is unreachable it will enter an Shutdown state... NOTE: If OctoPrint instance is added in a shutdown state, it currently get's stuck in Searching... a Re-Sync will refresh this.
    
### Changed 
 - All screens updated to respond to the changes.

### Fixed

- Fixed issue with passworded/non-passworded OctoPrint instances running on 1.4.0 not re-establishing web sockets. 
- Fixed issue with adding printers offline, not correctly re-establishing websocket connection.
- Fixed issue with Shutdown Instances, ie. the OctoPrint host been turned off, causing server crash.
- Current Operations correctly loads if all printers are added offline, no display error requiring refresh.


## [Released]

## [v1.1.4-bugfix]

### Added

- Added windows specific docker-compose example to README

### Changed

- Offline Polling is now back. System -> Server Settings to change and click save to update.
- Updated the note on the settings screen to better reflect this and it's affect. Yes I like potato's.
- Changed the whole websocket implementation to help with issue #15. NOTE: If you add your printer to the farm offline, you may still need to re-sync (dashboard re-sync button) it to get it detected by the farm. I'm working on why this is happening still. Printers added Online then going Offline do not encounter this. This is also the case for restarting the server with offline printers. 

### Removed

### Deprecated

### Fixed

- Fixed the errant " displayed on all views
- Fixed the errant . when loading offline printers.
- Fixed issue with printer's not collecting correct data issue #15 ie _default bug... Should no longer exist.
- Fixed issue with retract button not working issue #18

### Security

## [Released]

## [v1.1.4]

### Added

- Massive readme update, installation instructions will hopefully be a bit more clear now. Especially for docker!
- Closed printers are tracked better.
- Ability to change port - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off login requirement - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off registration pages - Setting available in serverConfig/server.js requires server restart to take effect.
  - For docker check the README.md it contains the paths you need to make persistent.
- Notes to printer manager regarding HTTP and the use of port:ip combo.
- Padded our the installation instructions on the README.md file.
- Dashboard now has the ability to refresh the printers connection/information. Good incase you encounter crashes and the websocket doesn't automatically update, or you make changes to OctoPrints settings outside of OctoFarm.
  - Pressing on an Offline printer will attempt to re-establish the lost websocket connection then update the instace from OctoPrint.
  - Pressing on an Online printer will update the instance from OctoPrint.
- New button on Printer List in Dashboard. You can drag and drop this button to re-order your printer list. This will also persist a reboot, all views respect this order.
- History list delete button is now enabled.
- History list edit button is now enabled.

### Changed

- Docker now checks for updated packages on start.
- Client will automatically reload the page in 10 seconds if connection to server is lost.
- Tables should now be somewhat responsive on smaller screens. This isn't perfect, tables aren't great for smaller screen sizes but hope this mitigates it some. Anyone with access to smaller devices (mobiles and tablets) send me your screenshots and I will try and improve further.
- Printer Database now stores: FeedRate, FlowRate, PrinterName, Custom Sort Index and filament selected.
- All monitoring views added truncate for filename. Overflows will be replaced with "..."
- Farm Utilisation Idle hours is now correctly multiplied by the total printers in the farm.
- Farm Statistics updated on a longer interval
- Updated port example to show 80 instead of 5001 which is the more common application due to most people using the Pi installation of OctoPrint.
- Printer Manager is restricted to the Admin user only. (This is the first user created).
- Get a warning when adding printers to remove http:// from IP and Camera URL.
- Printers displayed on page will respect the sortedIndex.
- added AutoComplete tags to password and username forms.
- Panel view will now display printers without a CameraURL attached.
- Camera Columns setting is now activated. You can choose from 1-6 columns per row, including 5!.

### Removed


### Deprecated

### Fixed

- Blue screen (selecting) when double clicking a camera view to enlarge.
- Fixed file manager not loading when no Active/Idle/Closed printers are present. Now requires at least 1 Active/Idle/Closed printer to open.
- Fixed Panel View action buttons not working.
- OctoFarm.net Mobile Menu fix
- Percent values correctly rounded to 1 decimal place on dashboard.
- A blank field in the cameraURL now actually pulls through your camera settings from OctoPrint.
- Cameral URL now saves to database after been updated in UI.
- Dashboard now shows printer name if available when offline.
- Statistic runners now close with printer update.
- Fixed annoying message in logs when a client connects
- Times no longer chop off multiple's of 10
- Fixed issue where filament was sometimes not collected in History.
- Fixed issue where flowRate was getting confused with feedRate. Both values are correctly applied now.
- Never online printers now correctly re-grab printer information when connection is re-established.
- Deleting a printer should not require server restart anymore. Please inform me if this is not the case, my testings suggests it's fine now.
- Fixed circular reference error with filaments
- Fixed Panel view not updating filament selection if not previously selected.
- Fixed Colour heading on Filament Type Selection.
- Fixed issue with Printer Manager locking when pressing a few action buttons.
- Printer Manager shows no camera message when none inputted.
- I've found an issue with the \_default profile on File Manager, I think there's some setup specific settings that I can't replicate. I've mitigated this with some checks, but please if your File Manager shows the warning please update issue [#15](https://github.com/NotExpectedYet/OctoFarm/issues/15) with a screen shot of your profile page so I can replicate it further here on my test boxes.
- Fixed the ability to change your background to a URL.

### Security

- Updated some packages with security vulnerabilities. Please make sure to do npm update before starting the application to update these.

## [1.1.3 - BETA :: includes 1.1.1 + 1.1.2] - 13/03/2020

### Added

- Updated to async JSON.stringify implentation to alleviate any further stringify issues.
- 2 Docker installation options:
  https://hub.docker.com/r/thetinkerdad/octofarm - Big thanks to youtuber TheTinkerDad for creating and managing this one.
  https://hub.docker.com/repository/docker/octofarm/octofarm - Thanks to user Knoker for the help and PR with this.

### Changed

- Nothing

### Removed

- Nothing

### Deprecated

- Nothing

### Fixed

- Issue #1 - Panel View wasn't respecting the Hide Closed client setting
- Issue regarding octoprint (I believe, need to test further and reproduce) missing sending temperature data for history
- Cured the memory issue by sending malformed and large objects through JSON.parse

### Securit

- Nothing

## [1.1.0 - BETA] - 12/03/2020

### Added

- Converted to server, database and client package
- Uses websocket for real time information from your octoprint instances
- Uses Server Side Events to keep the OctoFarm web client up to date with what your Server is tracking.
- History section which will
- Filament Manager to track what's on your printer and what you used on a print stored in history
- Brand new file manager with multi upload and queue features.
- Current Operations window configurable to be viewable on any of the monitoring screens as well as it's home on the dashboard.
- Login system, first user created become Admin. (for a future release).
- System information to see the current load of the server OctoFarm runs on.
- Farm Information which will show some grouped farm information about your current jobs.
- Famm Statistics which will give you a quick overview on your farm.
- Print Statistitcs which will collate the history page into some fancy metrics.
- Added Terminal output to interface.

### Changed

- Updated with a brand new Dashboard to include some of the above.
- Revamped monitoring views, all have been neatened.
- Revamped Printer manager accessible from all views: - remembering your printer connection settings - Merged control/tune/file manager tab. - As above, this is where the terminal lives.

### Removed

    - All of version 1.0... this is brand new!

### Deprecated

- Wallpaper can no longer be changed (to be fixed in future release)
- Camera view is currently locked... (to be fixed in a future release)

Nothing else from 1.0 I believe

### Fixed

- Camera rotation not sticking with double click enlarge.

## [TEMPLATE]

## [v]

### Added

### Changed

### Removed

### Deprecated

### Fixed

### Security
