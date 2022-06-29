const parseAllOctoPrintUsers = (userList) => {
  const users = [];
  for (let currentUser of userList) {
    if (!!currentUser.admin) {
      if (!users.includes(currentUser.name)) {
        users.push(currentUser.name);
      }
    }
  }
  return users;
};

const findCurrentUserForOctoFarmConnection = (userList) => {
  let selectedUser;
  for (const user of userList) {
    // First check if we have "octofarm" user...
    if (user.toLowerCase() === "octofarm") {
      selectedUser = user;
      break;
    }
    // Second check if we have an octofarm based user...
    if (user.toLowerCase().includes("octofarm")) {
      selectedUser = user;
      break;
    }
  }
  //fall back to first user in list as no user could be found
  if (!selectedUser) {
    selectedUser = userList[0];
  }
  return selectedUser;
};

module.exports = {
  parseAllOctoPrintUsers,
  findCurrentUserForOctoFarmConnection
};
