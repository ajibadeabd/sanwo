const express = require('express')

const router = express.Router()
const adminController = require('../controllers/adminController')
const adminValidationMiddleware = require('../functions/adminValidationMiddleware')


router.put('/update-account-status/:userId', adminValidationMiddleware.updateAccountStatusValidation,
  adminController.updateAccountStatus)

router.get('/get-users', adminController.getUsers)
router.put('/', adminValidationMiddleware.profileUpdate,
  adminController.profileUpdate)

module.exports = router
