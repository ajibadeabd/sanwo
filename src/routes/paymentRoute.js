const express = require('express')
const paymentValidationMiddleware = require('./../functions/paymentValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')

const paymentController = require('../controllers/paymentController')

const router = express.Router()

router.get('/processed', paymentController.notification)
router.post('/debit-notification', paymentController.debitNotification)
router.use(authMiddleware.isAuthenticated)

router.post('/order', paymentValidationMiddleware.generateOrderPaymentRRR,
  paymentController.generateOrderPaymentRRR)

router.get('/order/:orderNumber', paymentValidationMiddleware.getOrderPayments,
  paymentController.getOrderPayments)

router.get('/order/:orderNumber', paymentValidationMiddleware.getOrderPayments,
  paymentController.getOrderPayments)

router.get('/:paymentId', paymentValidationMiddleware.getPayment,
  paymentController.getPayment)

router.get('/mandate-status/:orderId', paymentValidationMiddleware.installmentMandateStatus,
  paymentController.installmentMandateStatus)

router.get('/installment-payment-history/:orderId', paymentValidationMiddleware.installmentMandateStatus,
  paymentController.installmentPaymentHistory)


module.exports = router
