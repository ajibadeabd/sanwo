const express = require('express')

const orderController = require('../controllers/orderController')
const orderValidationMiddleware = require('../functions/orderValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')

const router = express.Router()


router.get('/update-approval-status/:token/:adminId/:status',
  orderValidationMiddleware.updateApprovalStatus, orderController.updateApprovalStatus)

router.use(authMiddleware.isAuthenticated)
router.post('/', orderValidationMiddleware.create, orderController.create)

router.put('/update-order-status', orderValidationMiddleware.updateOrderStatus,
  orderController.updateOrderStatus)

router.get('/', orderValidationMiddleware.get, orderController.getOrders)

module.exports = router
