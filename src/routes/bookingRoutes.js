const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.post('/', bookingController.createBooking);
router.get('/', parseQueryParams('bookings'), bookingController.getBookings);
router.get('/stats', bookingController.getBookingsStats);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
