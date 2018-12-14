const express = require('express')

const purchaseController = require('../controllers/purchaseController')
const purchaseValidationMiddleware = require('../functions/purchaseValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')

const router = express.Router()


router.get('/update-approval-status/:token/:adminId/:status',
  purchaseValidationMiddleware.updateApprovalStatus, purchaseController.updateApprovalStatus)

router.use(authMiddleware.isAuthenticated)
router.post('/', purchaseValidationMiddleware.create, purchaseController.create)

router.put('/update-order-status', purchaseValidationMiddleware.updateOrderStatus,
  purchaseController.updateOrderStatus)

router.get('/', purchaseController.getOrders)

module.exports = router