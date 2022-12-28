import Calc from '../../utils/calc';

export const activeUserListRowTemplate = (user) => {
  let forwardedIpAddress = '';
  if (user.forwardIp) {
    forwardedIpAddress = `<h6><i class="fa-solid fa-network-wired"></i> ${user.forwardIp}</h6>`;
  }
  return `
      <div class="col-sm-12 col-sm-12 col-md-6 col-lg-6">
        <div class="card text-white bg-dark mb-3">
          <div class="card-header">
            <span><i class="fa-solid fa-user"></i> ${user.userName}</span><br>
            <span><i class="fa-solid fa-pager"></i> ${user.endpoint}</span>
          </div>
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
