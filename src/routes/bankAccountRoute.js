const express = require('express')
const bankAccountValidationMiddleware = require('./../functions/bankAccountValidationMiddleware')
const bankAccountController = require('../controllers/bankAccountController')

const router = express.Router()
router.get('/', bankAccountValidationMiddleware.get, bankAccountController.getBankAccounts)
router.post('/', bankAccountValidationMiddleware.create, bankAccountController.createBankAccount)
// router.put('/:bankAccountId',
// bankAccountValidationMiddleware.update, bankAccountController.updateBankAccount)
// router.delete('/:bankAccountId',
// bankAccountValidationMiddleware.destroy, bankAccountController.destroyBankAccount)

module.exports = router
