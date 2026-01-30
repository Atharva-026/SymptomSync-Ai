const express = require('express');
const {
  getDoctors,
  getDoctor,
  updateAvailability
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.put('/availability', protect, authorize('doctor'), updateAvailability);

module.exports = router;