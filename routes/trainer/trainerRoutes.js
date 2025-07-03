const express = require('express');
const router = express.Router();
const { getTrainerList } = require('../../controllers/trainer/trainer');

router.get('/', getTrainerList);

module.exports = router;
