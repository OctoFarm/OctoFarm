const downloadUtil = jest.createMockFromModule('../download.util');

downloadUtil.downloadFromOctoPrint = async (url, path, callback, apiKey) => {
  return Promise.resolve();
}

module.exports = downloadUtil;
