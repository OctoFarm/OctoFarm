import Calc from '../../utils/calc';

export const activeUserListRowTemplate = (user) => {
  let forwardedIpAddress = '';
  if (user.forwardIp) {
    forwardedIpAddress = `<h6><i class="fa-solid fa-network-wired"></i> ${user.forwardIp}</h6>`;
  }
  return `
      <div class="col-sm-12 col-md-4 col-lg-2">
        <div class="card text-white bg-dark mb-3">
          <div class="card-header"><i class="fa-solid fa-user"></i> ${user.userName}</div>
          <div class="card-body">
            <h5 class="card-title"><i class="fa-solid fa-user-group"></i> ${user.group}</h5>
           <h6><i class="fa-solid fa-ethernet"></i> ${user.ip}</h6>
           ${forwardedIpAddress}
            <p class="card-text">
                Session Start: <br>
                ${Calc.dateClean(new Date(user.connectionDate))}
                <br>
                Time Active: <br>
                ${Calc.timeSince(new Date(user.connectionDate))}
            </p>    
          </div>
        </div>
      </div>    
    `;
};
