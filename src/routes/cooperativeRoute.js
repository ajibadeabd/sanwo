const express = require('express')

const router = express.Router()
const cooperativeController = require('../controllers/cooperativeController')
const cooperativeValidationMiddleware = require('../functions/cooperativeValidationMiddleware')


router.put('/', cooperativeValidationMiddleware.profileUpdate,
  cooperativeController.update)

module.exports = router
