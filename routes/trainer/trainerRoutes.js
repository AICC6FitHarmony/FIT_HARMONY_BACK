const express = require('express');
const router = express.Router();
const {
  getTrainerList,
  getTrainerDetail,
} = require('../../controllers/trainer/trainer');

router.get('/', getTrainerList);
router.get('/:id', getTrainerDetail);
module.exports = router;
