const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.post('/', equipmentController.createEquipment);
router.get('/', parseQueryParams('equipment'), equipmentController.getEquipment);
router.get('/stats', equipmentController.getEquipmentStats);
router.get('/:id', equipmentController.getEquipmentById);
router.put('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;
