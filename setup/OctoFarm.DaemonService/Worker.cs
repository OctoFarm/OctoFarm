using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace OctoFarm.DaemonService
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private Process _octoFarmServer;

        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            
            Console.WriteLine("DONE");
            while (!stoppingToken.IsCancellationRequested)
            {
                EnsureOctoFarmServerRunning();
                await Task.Delay(1000, stoppingToken);
                _logger.LogInformation("Worker running at: {time}. OctoFarm server stopped: {value}", DateTimeOffset.Now, _octoFarmServer?.HasExited);
            }
        }

        private void EnsureOctoFarmServerRunning()
        {
            if (this._octoFarmServer != null && this._octoFarmServer.HasExited)
            {
                //this._octoFarmServer.Dispose();
            }

            if (this._octoFarmServer == null || this._octoFarmServer.HasExited) {
                _logger.LogInformation("Worker booting OctoFarm server.");
                this._octoFarmServer = Process.Start(@".\octofarm-win.exe");
                _octoFarmServer.Exited += OnServerExit;
                _logger.LogInformation("Worker has booted OctoFarm server.");
            }
        }

        private void OnServerExit(object sender, EventArgs e)
        {
            _logger.LogWarning("OF Server stopped! This will not go unnoticed.");
        }
    }
}
