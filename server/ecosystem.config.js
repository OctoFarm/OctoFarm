module.exports = {
  apps: [
    {
      name: "OctoFarm",
      script: "app.js",
      listen_timeout: 10000,
      exp_backoff_restart_delay: 1500,
      restart_delay: 1000,
      // no_treekill: true,
      wait_ready: true,
      time: true,
      shutdown_with_message: true,
      update_env: true,
      // out_file: "../logs/pm2.out.log", //Taken care of by application logging
      error_file: "../logs/pm2.error.log"
    }
  ]
  // deploy: {
  //   production: {
  //     user: "SSH_USERNAME",
  //     host: "SSH_HOSTMACHINE",
  //     ref: "origin/master",
  //     repo: "GIT_REPOSITORY",
  //     path: "DESTINATION_PATH",
  //     "pre-deploy-local": "",
  //     "post-deploy":
  //       "npm install && pm2 reload ecosystem.config.js --env production",
  //     "pre-setup": ""
  //   }
  // }
};
