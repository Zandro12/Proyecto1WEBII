const express = require('express');
const router = express.Router();
const musicianController = require('../controllers/musicianController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.post('/', musicianController.createMusician);
router.get('/', parseQueryParams('musicians'), musicianController.getMusicians);
router.get('/:id', musicianController.getMusicianById);
router.put('/:id', musicianController.updateMusician);
router.delete('/:id', musicianController.deleteMusician);

module.exports = router;
