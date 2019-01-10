const express = require('express')
const wishListValidationMiddleware = require('./../functions/wishListValidationMiddleware')

const wishListController = require('../controllers/wishListController')

const router = express.Router()

router.get('/', wishListController.getWishList)
router.post('/', wishListValidationMiddleware.create, wishListController.createWishList)
router.delete('/:id', wishListValidationMiddleware.deleteWishList, wishListController.destroyWishList)

module.exports = router
