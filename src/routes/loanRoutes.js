const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { parseQueryParams } = require('../middlewares/queryParser');

router.get('/', parseQueryParams('loans'), loanController.getLoans);
router.get('/:id', loanController.getLoanById);

module.exports = router;
