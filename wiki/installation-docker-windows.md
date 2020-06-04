# Docker Installation & Updating OctoFarm for Windows with Portainer (Thanks to BlueWyvern)
## Download and install Docker
https://hub.docker.com/editions/community/docker-ce-desktop-windows/ (during install ensure that it is set for LINUX containers)

the install will ask you to reboot

sign up for an account with docker hub if you don't already have one https://hub.docker.com/signup

## Install Portainer (I pulled info from this site)

https://www.portainer.io/installation/

open powershell

`docker volume create portainer_data`

`docker run -d -p 8000:8000 -p 9000:9000 --name=portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer`

open your favorite browser and head to: http://127.0.0.1:9000/

create your admin account for portainer

select Local for the docker environment you want to manager

## Setup your MongoDB Container

on the home page click on local in the right side (main page) click on container Click add container

in the image field type mongo turn on always pull the image click publish a new network port and put in 27017-27019 in both fields click "Restart Policy" Select Always Click Deploy the container

make a note of the internal IP given, in my case it was 172.17.0.3

## Setup your OctoFarm Container

Click add container Give it a name "OctoFarm" in the image field type octofarm/octofarm:latest turn on always pull the image click publish a new network port and put in 4000 in both boxes

Click on Env Click Add environment variable name: MONGO value: mongodb://172.17.0.3/octofarm

Click Restart Policy and set to always Click Deploy the container

give it a moment and head on over to http://127.0.0.1:4000/ and start using OctoFarm!

## Updating

Head over to your portainer installation in your favourite browser: http://127.0.0.1:9000/

Go into the OctoFarm container and click Recreate!

Done.