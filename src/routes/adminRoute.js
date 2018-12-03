const express = require('express')

const router = express.Router()
const adminController = require('../controllers/adminController')
const adminValidationMiddleware = require('../functions/adminValidationMiddleware')


router.put('/update-account-status/:userId', adminValidationMiddleware.updateAccountStatusValidation,
  adminController.updateAccountStatus)

module.exports = router