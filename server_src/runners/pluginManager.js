const fetch = require("node-fetch");

async function updatePluginList() {
  return fetch("https://plugins.octoprint.org/plugins.json")
    .then((response) => response.json())
    .then((data) => {
      //console.log(data);
      return "Updated Plugin List...";
    });
}

module.exports = {
  updatePluginList,
};
