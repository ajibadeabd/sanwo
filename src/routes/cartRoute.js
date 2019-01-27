const express = require('express')
const cartValidationMiddleware = require('./../functions/cartValidationMiddleware')

const cartController = require('../controllers/cartController')

const router = express.Router()

router.get('/', cartValidationMiddleware.get, cartController.get)
router.post('/', cartValidationMiddleware.create, cartController.create)
router.put('/:cart', cartValidationMiddleware.reduceCartQuantity, cartController.reduceCartQuantity)
router.delete('/:cart', cartValidationMiddleware.destroy, cartController.destroy)

module.exports = router
