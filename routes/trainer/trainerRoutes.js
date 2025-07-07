const express = require('express');
const router = express.Router();
const {
  getTrainerList,
  getTrainerDetail,
  getTrainerReview,
  getTrainerProduct,
} = require('../../controllers/trainer/trainer');

router.get('/', getTrainerList);
router.get('/:id/product', getTrainerProduct);
router.get('/:id/review', getTrainerReview);
router.get('/:id', getTrainerDetail);

module.exports = router;
