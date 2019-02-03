const express = require('express')
const purchaseValidationMiddleware = require('./../functions/purchaseValidationMiddleware')
const purchaseController = require('../controllers/purchaseController')

const router = express.Router()
router.get('/', purchaseValidationMiddleware.get, purchaseController.get)
router.put('/:purchaseId', purchaseValidationMiddleware.update, purchaseController.update)
module.exports = router
