const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const fetch = require("node-fetch");
const Spool = require("../models/Filament.js");
const Profile = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");
const _ = require("lodash");
const Runner = require("../runners/state.js")
module.exports = router;
const filamentManagerReSync = async function(){
  const runner = require("../runners/state.js");
  const Runner = runner.Runner;
  let printerList = Runner.returnFarmPrinters();
  let printer = null;
  for (let i = 0; i < printerList.length; i++) {
    if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
      printer = printerList[i]
      break;
    }
  }
  if(printer === null){
    return "error"
  }
  let spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });
  let profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });
  //Make sure filament manager responds...
  if(spools.status != 200 || profiles.status != 200){
    res.send({ status: false });
  }
  spoolsFM = await spools.json();
  profilesFM = await profiles.json();

  spoolsFM.spools.forEach(async sp => {
    let spools = {
      name: sp.name,
      profile: sp.profile.id,
      price: sp.cost,
      weight: sp.weight,
      used: sp.used,
      tempOffset: sp.temp_offset,
      fmID: sp.id
    };
    let oldSpool = await Spool.findOne({'spools.name': sp.name});
    oldSpool.spools = spools;
    oldSpool.markModified("spools")
    oldSpool.save();
  })
  profilesFM.profiles = _.sortBy(profilesFM.profiles, [function(o) { return o.id; }]);
    let profile = {
      index:   profilesFM.profiles[profilesFM.profiles.length-1].id,
      density:   profilesFM.profiles[profilesFM.profiles.length-1].density,
      diameter:   profilesFM.profiles[profilesFM.profiles.length-1].diameter,
      manufacturer:   profilesFM.profiles[profilesFM.profiles.length-1].vendor,
      material:   profilesFM.profiles[profilesFM.profiles.length-1].material,
    };

    Profile.findOne({'profile.index': 0}).then(oldProfile => {
      oldProfile.profile = profile;
      oldProfile.markModified("profile")
      oldProfile.save();
    });

  return "success"
}
router.get("/get/profile", ensureAuthenticated, async (req, res) => {
  Profile.find({}).then(async profiles => {
    let serverSettings = await ServerSettings.find({});
    res.send({ profiles: profiles, filamentManager: serverSettings[0].filamentManager });
  });
});
router.get("/get/filament", ensureAuthenticated, async (req, res) => {
  Spool.find({}).then(async spool => {
    let serverSettings = await ServerSettings.find({});
    res.send({ Spool: spool, filamentManager: serverSettings[0].filamentManager  });
  });
});
router.get("/get/selected", ensureAuthenticated, async (req, res) => {
  const runner = require("../runners/state.js");
  const Runner = runner.Runner;
  let selected = await Runner.getSelected();
  res.send({status: 200, selected});
})
router.post("/select", ensureAuthenticated, async (req, res) => {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let serverSettings = await ServerSettings.find({});
    if(serverSettings[0].filamentManager && req.body.spoolId != 0){
      let printerList = Runner.returnFarmPrinters();
      let i = _.findIndex(printerList, function(o) {
        return o._id == req.body.printerId;
      });
      let printer = printerList[i];
      let spool = await Spool.findById(req.body.spoolId)
      let selection = {
        "tool": 0, "spool": {"id": spool.spools.fmID}
      };
      let url = `${printer.printerURL}/plugin/filamentmanager/selections/0`;
      let updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        },
        body: JSON.stringify({selection: selection})
      })
    }
    let printerList = await Runner.selectedFilament(req.body.printerId, req.body.spoolId);
    res.send({status: 200});
});
router.post("/save/profile", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  const filament = req.body;
  let filamentManagerID = null;
  if(serverSettings[0].filamentManager) {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < 10; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }
    let profile = {
      "vendor": filament.manufacturer,
      "material": filament.material,
      "density": filament.density,
      "diameter": filament.diameter
    };

    let url = `${printer.printerURL}/plugin/filamentmanager/profiles`;
    let updateFilamentManager = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({profile: profile})
    });
    updateFilamentManager = await updateFilamentManager.json()
    filamentManagerID = updateFilamentManager.profile.id;

  }
  let profile = {
    index: filamentManagerID,
    manufacturer: filament.manufacturer,
    material: filament.material,
    density: filament.density,
    diameter: filament.diameter
  };
  let newFilament = new Profile({
    profile
  });

   newFilament.save().then(async e => {
     if(serverSettings[0].filamentManager) {
       await filamentManagerReSync();
     }
   res.send({ res: "success", profile: newFilament });
  });
});
router.post("/save/filament", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  const filament = req.body;

  let filamentManagerID = null;



  if(serverSettings[0].filamentManager) {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let printerList = Runner.returnFarmPrinters();
    let printer = null;

    for (let i = 0; i < printerList.length; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }
    let profiles = await Profile.find({})
    let findID = _.findIndex(profiles, function(o) {
      return o.profile.index == filament.spoolsProfile;
    });

    let profile = {
      "vendor": profiles[findID].profile.manufacturer,
      "material": profiles[findID].profile.material,
      "density": profiles[findID].profile.density,
      "diameter": profiles[findID].profile.diameter,
      "id": profiles[findID].profile.index
    };
    let spool = {
      "name": filament.spoolsName,
      "profile": profile,
      "cost": filament.spoolsPrice,
      "weight": filament.spoolsWeight,
      "used": filament.spoolsUsed,
      "temp_offset": filament.spoolsTempOffset

    };
    let url = `${printer.printerURL}/plugin/filamentmanager/spools`;
    let updateFilamentManager = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({spool: spool})
    });
    updateFilamentManager = await updateFilamentManager.json()
    filamentManagerID = updateFilamentManager.spool.id;

  }
  let spools = {
    name: filament.spoolsName,
    profile: filament.spoolsProfile,
    price: filament.spoolsPrice,
    weight: filament.spoolsWeight,
    used: filament.spoolsUsed,
    tempOffset: filament.spoolsTempOffset,
    fmID: filamentManagerID
  };
  let newFilament = new Spool({
    spools
  });
  newFilament.save().then(async e => {
    if(serverSettings[0].filamentManager) {
      await filamentManagerReSync();
    }
    res.send({ res: "success", spools: newFilament });
  });


});

router.post("/delete/filament", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  let searchId = req.body.id;
  if(serverSettings[0].filamentManager) {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }

    searchId = await Spool.findById(searchId)
    let url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
    let updateFilamentManager = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
    });


    let rel = await Spool.deleteOne({ _id: searchId }).exec();
    rel.status = 200;
    Spool.find({}).then(spools => {
      res.send({ spool: spools });
    });
  }else{
    let rel = await Spool.deleteOne({ _id: searchId }).exec();
    rel.status = 200;
    Spool.find({}).then(spools => {
      res.send({ spool: spools });
    });
  }
});
router.post("/delete/profile", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  let searchId = req.body.id;
  if(serverSettings[0].filamentManager) {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }
    let url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
    let updateFilamentManager = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
    });
    let profiles = await Profile.find({})
    let findID = _.findIndex(profiles, function(o) {
      return o.profile.index == searchId;
    });
    let rel = await Profile.deleteOne({ _id: profiles[findID]._id }).exec();
    rel.status = 200;
    res.send({ profiles: profiles });
  }else{
    let rel = await Profile.deleteOne({ _id: searchId }).exec();
    rel.status = 200;
    Profile.find({}).then(profiles => {
      res.send({ profiles: profiles });
    });
  }

});
router.post("/edit/filament", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  let searchId = req.body.id;
  let newContent = req.body.spool
  let spools = await Spool.findById(searchId);
  const runner = require("../runners/state.js");
  const Runner = runner.Runner;
  if(serverSettings[0].filamentManager) {

    let printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }
    let filamentManagerID = newContent[5];
    let profiles = await Profile.find({})
    let findID = _.findIndex(profiles, function(o) {
      return o.profile.index == filamentManagerID;
    });

    let profile = {
      "vendor": profiles[findID].profile.manufacturer,
      "material": profiles[findID].profile.material,
      "density": profiles[findID].profile.density,
      "diameter": profiles[findID].profile.diameter,
      "id": profiles[findID].profile.index
    };
    let spool = {
      "name": newContent[0],
      "profile": profile,
      "cost": newContent[1],
      "weight": newContent[2],
      "used": newContent[3],
      "temp_offset": newContent[4]
    };
    let url = `${printer.printerURL}/plugin/filamentmanager/spools/${spools.spools.fmID}`;
    let updateFilamentManager = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({spool: spool})
    });
  }
  if(spools.spools.name != newContent[0]){
    spools.spools.name = newContent[0];
    spools.markModified("spools")
  }
  if(spools.spools.profile != newContent[5]){
    spools.spools.profile = newContent[5];
    spools.markModified("spools")
  }
  if(spools.spools.price != newContent[1]){
    spools.spools.price = newContent[1];
    spools.markModified("spools")
  }
  if(spools.spools.weight != newContent[2]){
    spools.spools.weight = newContent[2];
    spools.markModified("spools")
  }
  if(spools.spools.used != newContent[3]){
    spools.spools.used = newContent[3];
    spools.markModified("spools")
  }
  if(spools.spools.tempOffset != newContent[4]){
    spools.spools.tempOffset = newContent[4];
    spools.markModified("spools")
  }
  await spools.save();
  Runner.updateFilament();
  Spool.find({}).then(spools => {
    Runner.updateFilament();
    res.send({ spools: spools });
  });
});
router.post("/edit/profile", ensureAuthenticated, async (req, res) => {
  let serverSettings = await ServerSettings.find({});
  let searchId = req.body.id;
  let newContent = req.body.profile
  if(serverSettings[0].filamentManager) {
    const runner = require("../runners/state.js");
    const Runner = runner.Runner;
    let printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
        printer = printerList[i]
        break;
      }
    }
    let profile = {
      "vendor": newContent[0],
      "material": newContent[1],
      "density": newContent[2],
      "diameter": newContent[3]
    };
    let url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
    let updateFilamentManager = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({profile: profile})
    });
    updateFilamentManager = await updateFilamentManager.json()
    filamentManagerID = updateFilamentManager.profile.id;
    let profiles = await Profile.find({})
    let findID = _.findIndex(profiles, function(o) {
      return o.profile.index == searchId;
    });
    searchId = profiles[findID]._id
  }
  let profile = await Profile.findById(searchId);
  if(profile.profile.manufacturer != newContent[0]){
    profile.profile.manufacturer = newContent[0];
    profile.markModified("profile")
  }
  if(profile.profile.material != newContent[1]){
    profile.profile.material = newContent[1];
    profile.markModified("profile")
  }
  if(profile.profile.density != newContent[2]){
    profile.profile.density = newContent[2];
    profile.markModified("profile")
  }
  if(profile.profile.diameter != newContent[3]){
    profile.profile.diameter = newContent[3];
    profile.markModified("profile")
  }
  await profile.save();

  Profile.find({}).then(profiles => {
    Runner.updateFilament();
    res.send({ profiles: profiles });
  });
});

router.post("/filamentManagerReSync", ensureAuthenticated, async (req, res) => {
  //Find first online printer...
  let reSync = await filamentManagerReSync();
  //Return success
  if(reSync === "success"){
    res.send({ status: true });
  }else{
    res.send({ status: false })
  }
});

router.post("/filamentManagerSync", ensureAuthenticated, async (req, res) => {
  let searchId = req.body.id;
  //Find first online printer...
  const runner = require("../runners/state.js");
  const Runner = runner.Runner;
  let printerList = Runner.returnFarmPrinters();
  let printer = null;
  for (let i = 0; i < printerList.length; i++) {
    if (printerList[i].stateColour.category === "Disconnected" || printerList[i].stateColour.category === "Idle" || printerList[i].stateColour.category === "Active" || printerList[i].stateColour.category === "Complete") {
      printer = printerList[i]
      break;
    }
  }

  if(printer === null){
    res.send({ status: false });
  }
  let spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
  let profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });
  //Make sure filament manager responds...
  if(spools.status != 200 || profiles.status != 200){
    res.send({ status: false });
  }
  await Spool.deleteMany({})
  await Profile.deleteMany({})
  spools = await spools.json();
  profiles = await profiles.json();
  spools.spools.forEach(sp => {

    let spools = {
      name: sp.name,
      profile: sp.profile.id,
      price: sp.cost,
      weight: sp.weight,
      used: sp.used,
      tempOffset: sp.temp_offset,
      fmID: sp.id
    };
    let newS = new Spool({
      spools
    });
    newS.save();
  })
  profiles.profiles.forEach(sp => {
    let profile = {
      index: sp.id,
      density: sp.density,
      diameter: sp.diameter,
      manufacturer: sp.vendor,
      material: sp.material,
    };
    let newP = new Profile({
     profile
    });
    newP.save();
  })

  let serverSettings = await ServerSettings.find({});
  serverSettings[0].filamentManager = true;
  serverSettings[0].markModified("filamentManager");
  serverSettings[0].save();

  //Return success
  if(spools.status === 200 || profiles.status != 200){
    res.send({ status: true });
  }
});
router.post("/disableFilamentPlugin", ensureAuthenticated, async (req, res) => {
  await Spool.deleteMany({})
  await Profile.deleteMany({})
  let serverSettings = await ServerSettings.find({});
  serverSettings[0].filamentManager = false;
  serverSettings[0].markModified("filamentManager");
  serverSettings[0].save();

  //Return success
    res.send({ status: true });
});
