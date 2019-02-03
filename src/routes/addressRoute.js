const express = require('express')
const addressValidationMiddleware = require('./../functions/addressValidationMiddleware')

const addressController = require('../controllers/addressController')

const router = express.Router()

router.get('/', addressValidationMiddleware.get, addressController.get)
router.post('/', addressValidationMiddleware.create, addressController.create)
router.put('/:id', addressValidationMiddleware.update,
  addressController.update)
router.delete('/:id', addressValidationMiddleware.deleteAddressBook, addressController.destroy)

module.exports = router
