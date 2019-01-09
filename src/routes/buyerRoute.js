const express = require('express')

const router = express.Router()
const buyerController = require('../controllers/buyerController')
const buyerValidationMiddleware = require('../functions/buyerValidationMiddleware')


router.put('/', buyerValidationMiddleware.profileUpdate,
  buyerController.update)

module.exports = router
