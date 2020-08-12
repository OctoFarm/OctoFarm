const express = require('express');

const router = express.Router();

const { ensureAuthenticated } = require('../config/auth');

router.post('/roomData', ensureAuthenticated, async (req, res) => {
    const enviromentData = req.body;
    const RoomData = require("../models/roomData.js");
    const databaseData = await new RoomData(enviromentData);
    databaseData.save();
});
router.get('/roomData', ensureAuthenticated, async (req, res) => {
    const RoomData = require("../models/roomData.js");
    const roomDataCollection = await RoomData.find({});
    console.log(roomDataCollection);
});
module.exports = router;
