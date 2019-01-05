const express = require('express')
const authMiddleware = require('./../functions/authMiddleware')
const categoryValidationMiddleware = require('./../functions/categoryValidationMiddleware')

const categoryController = require('../controllers/categoryController')

const router = express.Router()

router.get('/', categoryValidationMiddleware.get, categoryController.getCategories)

router.use(authMiddleware.isAdmin)
router.post('/', categoryValidationMiddleware.create, categoryController.createCategory)
router.put('/:category', categoryValidationMiddleware.update, categoryController.updateCategory)
router.delete('/:category', categoryValidationMiddleware.deleteCategory, categoryController.destroyCategory)

module.exports = router
