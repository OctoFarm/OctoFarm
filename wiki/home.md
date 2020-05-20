Welcome to the OctoFarm wiki!

# Platform
Confirmed working on: Linux (Ubuntu, Debian), RaspberryPi (Rasbian), Windows 10. Should also work on but not tested: MacOS, anything else nodejs will run on.

Note: Raspberry Pi's Raspbian OS doesn't officially support running MongoDB yet (MongoDB requires a 64bit kernel, whereas Raspbian's is 32bit), so in that case, you'll need an external database running on some other machine or VM.

# Prerequisites
* [MongoDB](https://www.mongodb.com/) - v3.6+
* [NodeJS](https://nodejs.org/) - v12+
* [NPM](https://www.npmjs.com/) - v6+
* [OctoPrint](https://octoprint.org/) - v1.3.9+


On your OctoPrint instance

Settings -> API
Copy the API Key someplace easy to get to
Enabled the "Allow Cross Origin Resource Sharing (CORS)
Restart OctoPrint
Repeat for all OctoPrints that will be added to the Farm
Due to me been a one man band the majority of the work here has been donated by the wonderful members in my discord!

You can thank them for all of these instructions. It gives me plenty of time to focus on development and making this platform stable with great features. Big thanks to everyone mentioned here, and on the discord who continue to support the work, not just with Patreon/Donations but with helping users out who struggle with the installation steps.

Click the image below to go to the very details installation instructions made by Brother Chris! Many thanks man!

You can also check out the donated text instructions made by other users.

Chris Riley Installation Video

[![Octofarm - Octoprint Dashboard - Server Install - Linux & Windows - Chris's Basement](https://img.youtube.com/vi/9U-QTOmx49c/0.jpg)](https://youtu.be/9U-QTOmx49c)