const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.post('/', roomController.createRoom);
router.get('/', parseQueryParams('rooms'), roomController.getRooms);
router.get('/stats', roomController.getRoomsStats);
router.get('/:id', roomController.getRoomById);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);
router.get('/:id/schedule', roomController.getRoomSchedule);

module.exports = router;
