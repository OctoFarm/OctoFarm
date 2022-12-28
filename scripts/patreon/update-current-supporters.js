const fetch = require("../../server/node_modules/node-fetch");
const fs = require("fs");
const { findIndex } = require("../../server/node_modules/lodash");

const SETTINGS = {
    CAMPAIGN_ID: process.argv[2],
    TOKEN: process.argv[3]
}

const pledgesList = [];

async function fetchPatreons() {
    // const url = new URL(`https://www.patreon.com/api/oauth2/api/campaigns/${CAMPAIGN_ID}/pledges?page%5Bcount%5D=200`).href
    const url = `https://www.patreon.com/api/oauth2/api/campaigns/${SETTINGS.CAMPAIGN_ID}/pledges?page%5Bcount%5D=200`
    let grab = await fetch(
        url,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": ` Bearer ${SETTINGS.TOKEN}`
            },
        }
    );
    if (grab.status === 200) {
        grab = await grab.json();
        for(let i=0; i < grab.data.length; i++){
            const pledgeAmmount = grab.data[i]?.attributes?.amount_cents / 100
            if(pledgeAmmount < 10) continue;
            const user_id = grab.data[i]?.relationships?.patron?.data?.id
            const userInformationIndex = findIndex(grab?.included, function(o) { return o.id == user_id; });
            if(userInformationIndex !== -1){
                const userData = grab.included[userInformationIndex];
                const currentUser = {
                    id: userData.id,
                    name: userData.attributes.full_name,
                    thumb: userData.attributes.thumb_url
                }
                const savedUserIndex = findIndex(pledgesList, function(o) { return o.id == user_id; });
                if(savedUserIndex === -1){
                    pledgesList.push(currentUser);
                }else{
                    pledgesList[savedUserIndex] = currentUser;
                }
            }
        }
    } else {
        console.error("Patreon is down...");
    }
}

const writeToConstantsFile = async () => {
    try{
        console.table(pledgesList)
        await fs.writeFileSync("../../server/constants/patreon.constants.js", `module.exports = ${JSON.stringify(pledgesList)}`, 'utf-8')
    }catch(e){
        console.error(e)
    }
}

const writeToReadMeFile = async () => {
    let markDownString = "\n ###Patreons#### \n"
    for(const pledge of pledgesList){
        markDownString += `- ${pledge.name} \n`
    }
    await fs.writeFileSync("../../SPONSORS.md", markDownString, 'utf-8')
}

(async () => {
    await fetchPatreons();
    await writeToConstantsFile();
    await writeToReadMeFile();
})();
