const express = require('express')
const purchaseValidationMiddleware = require('./../functions/purchaseValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')
const purchaseController = require('../controllers/purchaseController')

const router = express.Router()

router.get('/', authMiddleware.isSeller, purchaseValidationMiddleware.get, purchaseController.get)
router.put('/:purchaseId', authMiddleware.isSeller, purchaseValidationMiddleware.update, purchaseController.update)
router.put('/buyer/:purchaseId', authMiddleware.isBuyer,
  purchaseValidationMiddleware.update, purchaseController.buyerStatusUpdate)
module.exports = router
