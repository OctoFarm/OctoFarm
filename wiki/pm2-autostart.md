# pm2 AutoStart

All future versions of OctoPrint come packaged with pm2. The startup scripts default to using this now across all systems. 

To setup pm2 to automatically boot OctoFarm when your system boots do the following. To keep things simple run all the following commands inside of the OctoFarm folder. OctoFarm MUST be running as well before generating your start up script. 

###### 1. Make sure pm2 is installed globally on the system.
 `npm install -g pm2`

###### 2. Detect available init system, generate configuration and enable startup system
 `pm2 startup`

 If your on linux then do not use sudo to run this command.
 
###### 3. Generate a startup command
  `pm2 startup`
 
 This will give you a system specific command that you can paste exactly as it is presented and re-run it on your system. 
 
 ###### 3. Save the current process list
   `pm2 save`
 