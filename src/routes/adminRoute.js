const express = require('express')

const router = express.Router()
const adminController = require('../controllers/adminController')
const adminValidationMiddleware = require('../functions/adminValidationMiddleware')


router.put('/update-account-status/:userId', adminValidationMiddleware.updateAccountStatusValidation,
  adminController.updateAccountStatus)

router.put('/update-inventory-status/:product', adminValidationMiddleware.updateInventoryStatus,
  adminController.updateInventoryStatus)

router.get('/get-users', adminController.getUsers)
router.get('/user-stats', adminController.getUserStatistics)
router.put('/', adminValidationMiddleware.profileUpdate,
  adminController.profileUpdate)

module.exports = router
