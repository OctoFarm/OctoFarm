const { SystemRunner } = require("../../server_src/runners/systemInfo");

const diskFormats = [
  "NTFS",
  "exFAT",
  "ext4",
  "ext3",
  "ext2",
  "FAT32",
  "FAT16",
  "FAT8",
  "FAT",
];

function clientCPUCalc(systemInfo) {
  const cpuLoad = systemInfo.cpuLoad.currentLoadSystem;
  const octoLoad = systemInfo.sysProcess.cpuu;
  const userLoad = systemInfo.cpuLoad.currentLoadUser;
  const remain = cpuLoad + octoLoad + userLoad;
  return [cpuLoad, octoLoad, userLoad, 100 - remain];
}

function clientMemCalc(systemInfo) {
  const systemUsedRAM = systemInfo.memoryInfo.used;
  const freeRAM = systemInfo.memoryInfo.free;
  // MemRSS is in kB, and total from memoryInfo is in bytes.
  let octoFarmRAM = systemInfo.sysProcess.memRss * 1000;
  if (systemInfo.sysProcess.memRss === undefined) {
    octoFarmRAM = (systemInfo.memoryInfo.total / 100) * systemInfo.sysProcess.mem;
  }

  if (octoFarmRAM !== octoFarmRAM) {
    return null;
  } else {
    return [systemUsedRAM, octoFarmRAM, freeRAM];
  }
}

describe("SystemRunner", () => {
  /**
   * Tests that valid system information is passed from the SystemRunner
   */
  it("should return valid system information with memory correctly calculated", async () => {
    const systemInfo = await SystemRunner.getSystemInfo();

    // Mimic client validation
    expect(systemInfo).toBeTruthy();
    expect(Object.keys(systemInfo).length).toBeGreaterThan(0);

    // Assert client used props
    expect(systemInfo.cpuLoad.currentLoadSystem).toEqual(expect.any(Number)); // Used by client
    expect(systemInfo.cpuLoad.currentLoadSystem).toBeGreaterThan(0);
    expect(systemInfo.sysProcess.cpuu).toEqual(expect.any(Number));
    expect(systemInfo.sysProcess.cpuu).toBeGreaterThan(0);
    expect(systemInfo.cpuLoad.currentLoadUser).toEqual(expect.any(Number));
    expect(systemInfo.cpuLoad.currentLoadUser).toBeGreaterThan(0);
    expect(systemInfo.memoryInfo.total).toBeTruthy();
    expect(systemInfo.memoryInfo.free).toBeTruthy();
    if (!systemInfo.sysProcess.memRss) {
      expect(systemInfo.sysProcess.mem).toBeTruthy();
    } else {
      // Rss is useful
      expect(systemInfo.sysProcess.memRss).toBeTruthy();
      expect(systemInfo.sysProcess.memVsz).toBeTruthy(); // Not actually needed, but nice to know
    }

    // Assert client calculations
    const arrayData = clientCPUCalc(systemInfo);
    expect(arrayData[0]).toBeGreaterThan(0);
    expect(arrayData[1]).toBeGreaterThan(0);
    expect(arrayData[2]).toBeGreaterThan(0);
    expect(arrayData[3]).not.toBeNaN();

    const memArrayData = clientMemCalc(systemInfo);

    expect(memArrayData[0]).toBeGreaterThan(0);
    expect(memArrayData[1]).not.toBeNaN();
    expect(memArrayData[1]).toBeGreaterThan(1E6);
    expect(memArrayData[1]).toBeLessThan(500E6);
    expect(memArrayData[2]).toBeGreaterThan(0);

    // Assert random other properties
    expect(systemInfo.osInfo.platform).toEqual(process.platform);
    expect(systemInfo.cpuInfo.cpu.manufacturer).toBeTruthy();
    expect(systemInfo.cpuInfo.cpu.processors).toEqual(expect.any(Number));
    expect(systemInfo.cpuInfo.cpu.cores).toEqual(expect.any(Number));
    expect(systemInfo.cpuLoad.currentLoad).toEqual(expect.any(Number));
    expect(systemInfo.cpuLoad.currentLoadIdle).toEqual(expect.any(Number));
    expect(systemInfo.memoryInfo.total).toEqual(expect.any(Number));
    expect(systemInfo.memoryInfo.free).toBeGreaterThan(1000000000); // 1GB
    expect(systemInfo.sysUptime.uptime).toBeGreaterThan(50); // s uptime
    expect(systemInfo.sysUptime.current).toBeGreaterThan(1617880660070); // ms time as of writing this test ^^
    expect(systemInfo.sysUptime.timezone).toBeTruthy();
    expect(systemInfo.processUptime).toEqual(expect.any(Number));
    expect(systemInfo.sysProcess.pid).toBeGreaterThan(1);
    expect(systemInfo.sysProcess.name).toEqual(expect.any(String));

    expect(diskFormats).toContain(systemInfo.systemDisk.type);
    expect(systemInfo.warnings).toBeTruthy();
  }, 7000);
});
