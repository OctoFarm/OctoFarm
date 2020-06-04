# Installation d’OctoFarm sur Ubuntu Server 20.04 (Grand merci GeekFisher!)
## Guide GeekFisher version 12 avril 2020

### Quelques points avant l’installation:
1. Choisissez l’adresse IP que vous comptez utiliser
2. Configurez l’assignation statique dans votre routeur pare-feu si désiré. Je le suggère, ça facilite lors d’un changement d’équipement car votre serveur se prendra malgré tout une adresse si vous devez changer votre routeur pare-feu ou votre sous-réseau.
3. Si vous comptez rouler le serveur dans une machine virtuelles, le minimum à assigner à la machine est 1go de mémoire vive. J’ai personnellement assigné 2go et 2 coeurs processeurs.

### Spécifications d’installation Ubuntu Server 20.04:
Il est possible que le système vous demande de mettre à jour l’installeur, faites-le, ça ne prend que quelques secondes et tout fonctionne parfaitement par la suite. Paquets à choisir pendant l’installation: Rien sauf OpenSSH. Le système vous demandra séparément si vous voulez installer OpenSSH

### Création de l’utilisateur:
Je vous suggère fortement de créer l’utilisateur avec ​ “Service User” ​ comme nom complet et ​ srv ​ comme nom d’utilisateur. Cet utilisateur est destiné uniquement à rouler l’instance d’Octofarm. En faisant de cette façon, tout sera installé et roulera depuis /home /srv. Vous allez créer un utilisateur de gestion si vous suivez ce guide au complet.

### Mettez à jour Ubuntu Server 20.04:
`sudo apt-get update && sudo apt-get dist-upgrade -y` Il est préférable de redémarrer après les MAJ, spécialement si le kernel a été mis à jour: `sudo reboot`

### Installation de nodejs:
`wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash source ~/.profile` `nvm ls-remote` (So you know which version is the latest) `nvm install 13.x.x` (whichever version was the most recent one) Valider la version de nodeJS (​ DOIT ÊTRE SUPÉRIEURE À 13​ ): `nodejs --version`

### Installation de MongoDB et git: (git a été installé par défaut sur mon instance, mais ça ne nuit pas de
le réessayer) sudo apt install mongodb git

### Cloner OctoFarm depuis le git:
`git clone https://github.com/NotExpectedYet/OctoFarm.git`

### Se déplacer dans le répertoire d’OctoFarm:
`cd OctoFarm`

### Installer OctoFarm:
`npm install`

### Se déplacer dans le dossier de configuration:
`cd config`

Éditer mongoDB file:

`sudo nano db.js` Faire en sorte que mongodb écoute sur l’hôte local ( localhost ):

`module.exports = { MongoURI: "mongodb://localhost:27017/octofarm" };`

Revenir au répertoire racine d’OctoFarm: `cd ..`

Démarrer OctoFarm `npm start`

### Faire en sorte qu’OctoFarm roule comme un service Installer PM2:

`sudo npm install -g pm2`

Démarrer Octofarm via PM2:

`pm2 start app.js`

Generer la commande de démarrage systemd:

`pm2 startup systemd`

Copier-coller la commande systemd qui est sortie à la commande précédente (​ changer pour le nom d’utilisateur utilisé, devrait l’avoir suggéré par défaut, srv si vous avez suivi le guide à la lettre​ )

`sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ​ srv​ --hp /home/​srv` Sauvegarder les paramètres PM2:

`pm2 save` Lister les applications:

`pm2 list`

Redémarrer le serveur pour s’assurer du bon fonctionnement de PM2:

`sudo reboot` Créer un utilisateur pour les tâches de gestion (Remplacez ​ newusername ​ par le nom désiré:

`sudo adduser  newusername` ​Répondez aux questions. Ceci va créer un répertoire local /home/​ newusername sudo `usermod -aG sudo ​ newusername`

## Références:
[Create a sudo user on ubuntu](https://linuxize.com/post/how-to-create-a-sudo-user-on-ubuntu/)

[Install nodejs on Ubuntu](https://linuxconfig.org/how-to-install-node-js-on-ubuntu-20-04-lts-focal-fossa)

Chris Riley’s video about Octofarm

[Chris Riley's OctoFarm Installation Video](https://www.youtube.com/watch?v=9U-QTOmx49c&t=958s)