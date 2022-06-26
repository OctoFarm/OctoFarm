// Setup user edits
// import { returnSaveBtn, userActionElements } from "./pages/system/server.options";
// import {deleteUser, editUser, fillInEditInformation} from "./pages/system/server.actions";
//
// const userEditButtons = document.querySelectorAll("*[id^=\"editUserBtn-\"]");
// userEditButtons.forEach((btn) => {
//     const split = btn.id.split("-");
//     btn.addEventListener("click", async (e) => {
//         userActionElements.editUserFooter.innerHTML = `
//     ${returnSaveBtn()}
//   `;
//         await fillInEditInformation(split[1]);
//         const userActionSave = document.getElementById("userActionSave");
//         userActionSave.addEventListener("click", async () => {
//             await editUser(split[1]);
//         });
//     });
// });
//
// // Setup user deletes
// const deleteButtons = document.querySelectorAll("*[id^=\"deleteUserBtn-\"]");
// deleteButtons.forEach((btn) => {
//     const split = btn.id.split("-");
//     btn.addEventListener("click", (e) => {
//         deleteUser(split[1]);
//     });
// });
//
// $("#userCreateModal").on("hidden.bs.modal", function (e) {
//     const userActionSave = document.getElementById("userActionSave");
//     userActionElements.userCreateMessage.innerHTML = "";
//     userActionSave.remove();
// });
// $("#usersResetPasswordModal").on("hidden.bs.modal", function (e) {
//     const userActionSave = document.getElementById("userActionSave");
//     userActionElements.userResetMessage.innerHTML = "";
//     userActionSave.remove();
// });
// $("#userEditModal").on("hidden.bs.modal", function (e) {
//     const userActionSave = document.getElementById("userActionSave");
//     userActionElements.userEditMessage.innerHTML = "";
//     userActionSave.remove();
// });


import e from "./utils/elements";
import {MENU_IDS} from "./pages/users/users.constants";
import {updateActiveSessions} from "./pages/users/users.actions";

// const taskMenu = e.get(MENU_IDS.adminTasks);
// setInterval(async () => {
//     if(e.active(taskMenu)){
//         await updateActiveSessions();
//     }
// }, 2000);