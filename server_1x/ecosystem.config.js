module.exports = {
    apps: [
        {
            out_file: "./logs/pm2.out.log",
            error_file: "./logs/pm2.error.log",
            name: "OctoFarm",
            script: 'app.js',
            listen_timeout: 10000,
            watch: '.'
        }
    ],
    deploy: {
        production: {
            user: 'SSH_USERNAME',
            host: 'SSH_HOSTMACHINE',
            ref: 'origin/master',
            repo: 'GIT_REPOSITORY',
            path: 'DESTINATION_PATH',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-setup': ''
        }
    }
};
