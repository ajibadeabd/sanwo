const express = require('express')

const router = express.Router()
const sellerController = require('../controllers/sellerController')
const sellerValidationMiddleware = require('../functions/sellerValidationMiddleware')


router.put('/', sellerValidationMiddleware.profileUpdate,
  sellerController.update)

module.exports = router