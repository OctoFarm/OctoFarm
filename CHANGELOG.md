# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.5 - UnReleased]

### Added 

 - Added back in the re-sync all button. This will fire off the same re-sync command as the printer one but for all printers. 
 - Websockets connections are now indicated separately to Printer Status. The Printer Icon on the dashboard will show this status. 
    - Green = Currently connected
    - Yellow = Attempting a connection
    - Red = Disconnected.  
 - State now grabs an Error and displays on the printer status label if one ocurs until recified. 
 - Show printer index on printer with no name
 - Current Operations Card on view's now displays the predicted end date and time, calculated from the current date + print time remaining.
 - More Checks into the API/Websocket connection... if it fails to grab your API Key it will now warn you. You will see "No-API" in the state. Pressing the refresh button for your printer on dashboard will attempt a reconnect. 
 - Current Operations allows you to now de-select a file and remove it from the view. When a print is complete, you will see a "Harvest Your Print!" button, click it to remove the printer from that View.
 - Added configuration options to /serverConfig/server.js - This is for any printer that doesn't respond quick enough.

### Changed
 - Dashboard layout has been updated with a fixed sidebar. Medium sized screens and above will display this. 
 - Refactored mobile views for dashboard - See Deprecated.
 - Current Operations now viewable on mobile.
 - async information reception from server -> client. 
 - State should now show if Serial Error occurs on OctoPrint.
 - Shutdown printers, that have been scanned by the farm will now wait 15-seconds before trying to grab an API connection. This should help those with websockets not connecting initially.
 - History now captures and displays selected rolls of filament. No usage available from OctoPrint currently. 
 
### Removed

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

### Security


## [Released]

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
