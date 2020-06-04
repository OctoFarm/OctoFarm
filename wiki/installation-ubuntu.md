# Installing OctoFarm on Ubuntu Server 20.04 (Thanks to GeekFisher!)

April 12th 2020 version

## Key points prior to installation:

1. Choose an IP Address you want to use a. Statically assign it from your DHCP Server prior to first install
2. If running a VM, 1GB is the bare minimum, I used 2 cores 2GB and it runs fine with four printers.

## Ubuntu Server 20.04 installation specs:

It will ask you about upgrading the installer, let it go as it only takes a few seconds and works just fine afterwards. Packages to choose from when installing: Install nothing but OpenSSH.

## User creation:

I highly suggest creating the user as full name “Service User” and username srv as this user will only be used to run Octofarm instance. Everything will be installed in `/home/srv`. You will create another user after the first server boot if you follow this guide.

## Update Ubuntu Server 20.04:

`sudo apt-get update && sudo apt-get dist-upgrade -y` Reboot after update, especially if the kernel was upgraded: `sudo reboot`

## Install nodejs:

`wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash source ~/.profile` `nvm ls-remote` (So you know which version is the latest) `nvm install 13.x.x` (whichever version was the most recent one) Check nodeJS version​ ​ MUST BE​ 13 or later​: `nodejs --version`

## Install MongoDB and git: (git was installed default on my fresh deployment but won’t hurt anything trying)

`sudo apt install mongodb git`

## Download OctoFarm:

`git clone https://github.com/NotExpectedYet/OctoFarm.git`

## Change into the OctoFarm directory:

`cd OctoFarm`

## Do the NPM install:

`npm install`

## Change to config:

`cd config`

Edit mongoDB file:

`sudo nano db.js` Make it look like this with the localhost update:

`module.exports = { MongoURI: "mongodb://localhost:27017/octofarm" };`

Backup a directory to OctoFarm: `cd ..`

Start OctoFarm `npm start`

Install PM2:

`sudo npm install -g pm2`

Start app under PM2:

`pm2 start app.js`

Generate the systemd command:

`pm2 startup systemd`

Copy and paste the systemd command(​ change for your home directory​ )

`sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ​ srv​ --hp /home/​srv` Save PM2 settings:

`pm2 save` Show your apps:

`pm2 list`

Reboot to make sure PM2 is working:

`sudo reboot` Create a new user for management purposes:

`sudo adduser ​newusername` ​ and answer the questions. This will create a home directory as /home/​newusername Add the new user to sudo group so it has sudo access

`sudo usermod -aG sudo ​ newusername`

## References:

[Create a sudo user on ubuntu](https://linuxize.com/post/how-to-create-a-sudo-user-on-ubuntu/)

[Install nodejs on Ubuntu](https://linuxconfig.org/how-to-install-node-js-on-ubuntu-20-04-lts-focal-fossa)

Chris Riley’s video about Octofarm

[Chris Riley's OctoFarm Installation Video](https://www.youtube.com/watch?v=9U-QTOmx49c&t=958s)
