# OctoFarm Server Environment Variables
OctoFarm Server can be configured with environment variables. In each setup there are ways to do this:
- specify a `.env` file. This works for all setups:
    - node, nodemon and pm2
    - docker-compose: using the `environment` section [(Read docker-compose environment)](https://docs.docker.com/compose/environment-variables/)
        - docker: using the `--env-file ./.env` command [(Read docker options)](https://docs.docker.com/engine/reference/commandline/run/#options)
    - (FUTURE) windows setup (not available yet)
    - (FUTURE) Unix setup (not available yet)
- specify each variable separately, this can become tedious:
    - docker: using the `-e VARIABLE=value` command repeatedly

## Required and optional variables
The following variables are read and used by OctoFarm at startup. Always restart your server after a change.

- MONGO (Required) **the connection to mongodb**
> MONGO=mongodb://127.0.0.1:27017/octofarm
- OCTOFARM_PORT (Optional, default=4000) **the port of the local OctoFarm website**
> 
> OCTOFARM_PORT=4000
- OCTOFARM_ALLOW_PRERELEASE_INSTALL **you want to have the latest premature releases as well, accepting unstable code.**
> OCTOFARM_PORT=true_or_anything_which_is_not_empty

## (Optional) .env file
A very simple text file with a variable per line. The following `.env`is already enough to make sure OctoFarm works as you like:
```
MONGO=mongodb://127.0.0.1:27017/octofarm
OCTOFARM_PORT=4000
```

## Applying it to your setup
So, you understand the variables to configure OctoFarm now. How do I set this up for my environment? Read below for your specific scenario.

### NodeJS with pm2 (or nodemon)
Create a `.env` file in the folder you cloned (or downloaded and extracted) OctoFarm with the **required** and/or _optional_ variables!
OctoFarm will automatically create this file for you, and if anything is not working a webpage will help you through the basics.

Feel adventurous? Customize the file to your liking, but again ALWAYS make sure the **required** variables are correctly set.

### Docker-compose 
With docker-compose you have a great tool to pass environment variables use the `environment` section.
Be aware of the following notes:
- the `.env` file for docker-compose is not applied to OctoFarm unless you use the variables in your `environment` section (more on that below)

Entirely up to you!

Here is how the environment section in docker would look.

to specify variables or use a `.env` file. Note that this .env file will not work like before, you still have to apply those variables.
### Docker 
Please add each environment variable in a file named `.env` in the folder where you run you docker command.
If you don't like a file, `-e VARIABLE_NAME=value` is a possible fix, although it is quite hard to maintain it like that.

We advise if you find this too hard, to consider using [docker-compose](#docker-compose)
