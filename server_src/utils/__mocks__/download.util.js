const downloadUtil = jest.createMockFromModule('../download.util');

downloadUtil.downloadFromOctoPrint = async (url, path, callback, apiKey) => {
  console.log('the downloadFromOctoPrint was mocked. Nothing was downloaded');
  return Promise.resolve();
}

module.exports = downloadUtil;
