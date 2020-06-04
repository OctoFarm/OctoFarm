# Installation and Updating for Debian Linux (Thanks to Noxin!)

## Install the Pre-requisites

curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash - sudo apt-get install -y nodejs sudo apt install mongodb sudo apt install git

## Alternative

`curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash - sudo apt-get install -y nodejs wget https://repo.mongodb.org/apt/ubuntu/dists/bionic/mongodb-org/4.2/multiverse/binary-amd64/mongodb-org-server_4.2.5_amd64.deb sudo dpkg -i mongodb-org-server_4.2.5_amd64.deb sudo apt install git`

## Clone the OctoFarm and cd into it's directory.

`curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash - sudo apt-get install -y nodejs wget https://repo.mongodb.org/apt/ubuntu/dists/bionic/mongodb-org/4.2/multiverse/binary-amd64/mongodb-org-server_4.2.5_amd64.deb sudo dpkg -i mongodb-org-server_4.2.5_amd64.deb sudo apt install git`

## Install NPM packages

npm install

Edit the `/config/db.js` file with your database and grab your hosts IP.
nano config/db.js

Change 192.168.1.5 to the mongodb server's IP Address (127.0.0.1 if you installed on the same machine, the actual IP Address otherwise), Save the File hostname -I (Take note of the IP Address returned here)

## Start the system

`npm start`

If the last message you see is '> node app.js > production.log 2> productionError.log' You did it correctly!

## Load up a browser and add your printers.

Open a browser and go to http://<IP from hostname -I>:4000 Register a New User ## Password must be six characters Login as that new User Click the Setup Printers button Enter Your First Printers information

- IP
- Port (Typically 80)
- Camera URL (Typically IP:8081/webcam/?action=stream if using a USB camera or Pi Camera )
- APIKey (Gathered during the PreRequisites)
- Click Add Printer
- Repeat for all your OctoPrint Instances
- Click Save

The production version will run without interaction, but currently there are no way to persist other than something like screen on linux, or using a service you create yourself. The logs will be outputted to /logs folder for error and standard operations. Check the error log if your server unexpectedly halts.

Updating... CTRL+C or close your current session however you made it persist.

- `git pull`
- `npm update`
- `npm install`
- `npm start`

Done
