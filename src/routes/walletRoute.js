const express = require('express')
const walletValidationMiddleware = require('./../functions/walletValidationMiddleware')
const walletController = require('../controllers/walletController')

const router = express.Router()
router.get('/', walletValidationMiddleware.getWallet, walletController.getWallet)
router.get('/statistics', walletController.statistics)
router.post('/request-withdrawal', walletValidationMiddleware.requestWithdrawal, walletController.requestWithdrawal)

module.exports = router
