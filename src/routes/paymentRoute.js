const express = require('express')
const paymentValidationMiddleware = require('./../functions/paymentValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')

const paymentController = require('../controllers/paymentController')

const router = express.Router()

router.get('/processed', paymentController.notification)
router.use(authMiddleware.isAuthenticated)

router.post('/order', paymentValidationMiddleware.generateOrderPaymentRRR,
  paymentController.generateOrderPaymentRRR)

router.get('/order/:orderNumber', paymentValidationMiddleware.getOrderPayments,
  paymentController.getOrderPayments)

router.get('/order/:orderNumber', paymentValidationMiddleware.getOrderPayments,
  paymentController.getOrderPayments)

router.get('/:paymentId', paymentValidationMiddleware.getPayment,
  paymentController.getPayment)

module.exports = router
