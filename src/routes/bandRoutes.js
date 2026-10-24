const express = require('express');
const router = express.Router();
const bandController = require('../controllers/bandController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.post('/', bandController.createBand);
router.get('/', parseQueryParams('bands'), bandController.getBands);
router.get('/:id', bandController.getBandById);
router.put('/:id', bandController.updateBand);
router.delete('/:id', bandController.deleteBand);
router.get('/:id/musicians', bandController.getBandMusicians);
router.get('/:id/bookings', bandController.getBandBookings);

module.exports = router;
