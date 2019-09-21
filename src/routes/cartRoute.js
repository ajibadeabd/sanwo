const express = require('express')
const authMiddleware = require('./../functions/authMiddleware')
const cartValidationMiddleware = require('./../functions/cartValidationMiddleware')

const cartController = require('../controllers/cartController')

const router = express.Router()

router.get('/update-approval-status/:token/:userId/:status',
  cartValidationMiddleware.updateApprovalStatus, cartController.updateApprovalStatus)

router.use(authMiddleware.isAuthenticated)
router.get('/', cartValidationMiddleware.get, cartController.get)
router.get('/installment', cartValidationMiddleware.get, cartController.getInstallment)

router.post('/', cartValidationMiddleware.create, cartController.create)
router.post('/request-approval', cartValidationMiddleware.requestApproval, cartController.requestApproval)
router.put('/:cart', cartValidationMiddleware.reduceCartQuantity, cartController.reduceCartQuantity)
router.delete('/:cart', cartValidationMiddleware.destroy, cartController.destroy)

router.get('/approval-requests', cartValidationMiddleware.get, cartController.getApprovalRequests)
module.exports = router
