#!/bin/bash
##########################################
##	Script Created by James Mackay	    ##
##	Website: https://octofarm.net 	    ##
##	Version 1.1.a 			                ##
##	modified by Manu7irl		            ##
##	Version 1.2 			                  ##
##	modified by James Mackay Again!     ##
##  Big thanks to Manu7irl for keeping  ##
##  this alive!                         ##
##########################################

## Goals of the script...
## 1. Allow easy creation of OctoPrint instances
## 2. Create an import file for OctoFarm...

echo "Hello and welcome to OctoPrint installation script!"
echo "Before we start, I will need some basic information regarding the system this is getting setup on..."
echo "Which linux user would you like to install OctoPrint on?"
read userSelect
installLocation=/home/$userSelect/OctoPrintInstances

echo "Everything will be installed to $installLocation..."

while true; do
	read -p "The octoprint instance(s) will be installed for user $userSelect, are you sure? [Y/N] :" yn
	case $yn in
		[Yy]* ) break;;
   		[Nn]* ) echo "On Which unix user this install should be run on? watch out for typos!"; read userSelect; continue;;
    		* ) echo "Please answer by yes (Y/y) or no (N/n).";;
	esac
done

echo "Which version of OctoPrint would you like to install?"
octoVersion=""
PS3='Please enter your choice: '
options=("1.4.2" "1.4.0" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "1.4.2")
            octoVersion=$opt
            echo "You chose: $opt"
            break;;
        "1.4.0")
            octoVersion=$opt
            echo "You chose: $opt"
            break;;
        "Quit")
            echo "Stopping installation... goodbye!"
            exit;;
        *) echo "invalid option $REPLY";;
    esac
done


echo "How many OctoPrint instances of OctoPrint Version:$octoVersion would you like?"
read printerCount

echo "Thanks! Full steam ahead to install $printerCount OctoPrint instance(s) in $installLocation"
echo "There are sudo commands contained within, you may be asked for your sudo password in the next step"
echo "..."
sleep 5
echo "Just preparing your system for install"
echo "..."
sudo apt update &> /dev/null && sudo apt install git python3-pip python3-dev python3-setuptools python3-virtualenv git libyaml-dev build-essential -y &> /dev/null
echo "Done!"
echo "Just making sure $userSelect has the correct permissions"
echo "..."
sudo usermod -a -G tty $userSelect &> /dev/null
sudo usermod -a -G dialout $userSelect &> /dev/null
echo "Done!"
echo "Now I will install $printerCount OctoPrint instance(s)."
echo "..."
if [ ! -d "$installLocation" ];
then
    echo "Creating service directory..."
    mkdir $installLocation &> /dev/null
fi
cd $installLocation &> /dev/null
echo "Done!"

if [ ! -d OctoPrint-$octoVersion ];
then
    echo "Creating OctoPrints virtual environment... there will be 1 per OctoPrint Version installed..."
    mkdir OctoPrint-$octoVersion
fi
cd OctoPrint-$octoVersion &> /dev/null
virtualenv venv &> /dev/null &> /dev/null
source venv/bin/activate &> /dev/null
echo "Making sure pip is installed and upgraded..."
echo "..."
pip3 install pip --upgrade &> /dev/null
echo "Installing OctoPrint Version:$octoVersion"
echo "..."
pip3 install octoprint==$octoVersion &> /dev/null
echo "Done!"

servicefolder="$installLocation/service-files"
if [ ! -d $servicefolder ];
then
    echo "Service folder doesn't exist... creating..."
    mkdir $servicefolder
    echo "Created... continuing..."
fi

cd $servicefolder
echo $servicefolder

if [ ! -f $servicefolder/octoprint.init ];
then
    echo "Downloading init file...."
    wget https://github.com/foosel/OctoPrint/raw/master/scripts/octoprint.init -P $installLocation/service-files &> /dev/null
    echo "Done!"
fi
if [ ! -f $servicefolder/octoprint.default ];
then
    echo "Downloading default file...."
    wget https://github.com/foosel/OctoPrint/raw/master/scripts/octoprint.default -P $installLocation/service-files &> /dev/null
    echo "Done!"
fi
echo "Now we need to create a system service for each instance. Two sec's I'll get on it!"
echo "..."
sudo systemctl daemon-reload
PRT=5000
CONcounter=0
  if [ -f "$installLocation/oldPrinterCount" ]
  then
      source "$installLocation/oldPrinterCount"
      echo "Detected OctoPrint instances already installed... starting index after $(($oldPrinterCount-1))"
      index=$(($oldPrinterCount))
  else
      index=0
  fi
echo "Making a start on $printerCount instances... You will have a total of $(($printerCount + index))"

for((i=$CONcounter;i<$printerCount;++i))
do
  echo "Setting up instance: $(($CONcounter + index + 1)) out of $(($printerCount + index))"
	if [ ! -d "$installLocation/.octoprint-$(($CONcounter + index))" ]; then
	  echo "Creating directory $installLocation/.octoprint-$(($CONcounter + index)) as it does not exist..."
	  echo "..."
 	  mkdir $installLocation/.octoprint-$(($CONcounter + index))
 	  echo "Done!"
	fi
	PORTcounter=$(($PRT + $CONcounter + index))
	cp $servicefolder/octoprint.init $installLocation/octoprint.init
	cp $servicefolder/octoprint.default $installLocation/octoprint.default
	sed -i "s/USER=pi/USER=$userSelect/g" $installLocation/octoprint.default
	sed -i "s/PORT=5000/PORT=$PORTcounter/g" $installLocation/octoprint.default
	sed -i "s+#DAEMON=/home/pi/OctoPrint/venv/bin/octoprint+DAEMON=$installLocation/OctoPrint-$octoVersion/venv/bin/octoprint+g" $installLocation/octoprint.default
	sed -i 's|#BASEDIR=/home/pi/.octoprint|BASEDIR='$installLocation'/.octoprint-'$(($CONcounter + index))'|g' $installLocation/octoprint.default
	sed -i 's|#CONFIGFILE=/home/pi/.octoprint/config.yaml|CONFIGFILE='$installLocation'/.octoprint-'$(($CONcounter + index))'/config.yaml|g' $installLocation/octoprint.default
	sed -i "s/UMASK=022/UMASK=022/g" $installLocation/octoprint.default
	sed -i "s+DESC=\"OctoPrint\" Daemon\"+DESC=\"OctoPrint-$(($CONcounter + index)) Daemon\"+g" $installLocation/octoprint.init
	sed -i "s+NAME=\"OctoPrint\"+NAME=\"OctoPrint-$(($CONcounter + index))\"+g" $installLocation/octoprint.init
	sed -i "s/PKGNAME=octoprint/PKGNAME=octoprint-$(($CONcounter + index))/g" $installLocation/octoprint.init
	sudo mv $installLocation/octoprint.init /etc/init.d/octoprint-$(($CONcounter + index))
	sudo mv $installLocation/octoprint.default /etc/default/octoprint-$(($CONcounter + index))
	sudo chmod +x /etc/init.d/octoprint-$(($CONcounter + index))
	sudo update-rc.d octoprint-$(($CONcounter + index)) defaults
	sudo systemctl daemon-reload
	sudo service octoprint-$(($CONcounter + index)) start
	sleep 10
	echo "Service octoprint-$(($CONcounter + index)) has started on http://$(hostname -I):$PORTcounter or http://localhost:$PORTcounter"
	echo "Adding to printer.json"
	((CONcounter++))
done

echo "Done!"
echo "..."
sleep 5
echo "Congratulations.... You should have $printerCount Octoprint instance(s) running!"


echo "Adding permission to Octoprint $userSelect to sudo without password..."
echo "..."
mv /etc/sudoers.d/octoprint-shutdown /etc/sudoers.d/octoprint-shutdown_bak &> /dev/null
cat &> /dev/null<<SUDOER | sudo tee -a /etc/sudoers.d/octoprint-shutdown
	$userSelect ALL=(ALL) NOPASSWD:ALL
SUDOER
echo "Done!"

echo "Saving printer index in $installLocation/oldPrinterCount, Do not delete this if you require adding more installations to this server."
echo "oldPrinterCount=$(($printerCount + index))" > $installLocation/oldPrinterCount
echo "..."

echo "Setup one of your by completing the wizard and I will copy the config to every available instance?"
echo "NOTE: This doesn't currently work if you setup access control. If you setup your 'sudo service octoprint-x restart' command then it will correct that for you too."
while true; do
	read -p "Have you setup your instance? [Y/N] :" yn
	case $yn in
		[Yy]* ) break;;
   		[Nn]* ) echo "Have you setup your instance??????"; continue;;
    		* ) echo "Please answer by yes (Y/y) or no (N/n).";;
	esac
done

echo "Which index did you setup? this is your port number without 5000 or config directory."
read instanceSelect;

for((i=0;i<$printerCount;++i))
do
    echo "Copying $installLocation/.octoprint-$instanceSelect/config.yaml to $installLocation/.octoprint-$i/config.yaml"
    cp $installLocation/.octoprint-$instanceSelect/config.yaml $installLocation/.octoprint-$i/config.yaml
    sed -i "s/        serverRestartCommand: sudo service octoprint-$instanceSelect restart/        serverRestartCommand: sudo service octoprint-$i restart/g" $installLocation/.octoprint-$i/config.yaml
    echo "done"
done


echo "Everything is Done!"