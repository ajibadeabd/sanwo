const express = require('express')
const multer = require('multer')
const authMiddleware = require('./../functions/authMiddleware')
const categoryValidationMiddleware = require('./../functions/categoryValidationMiddleware')

const categoryController = require('../controllers/categoryController')

const router = express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/upload/categories/')
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname.replace(/\s/ig, '_')}`)
  }
})

const multiPart = multer({ storage })
router.get('/', categoryValidationMiddleware.get, categoryController.getCategories)
router.get('/grouped', categoryValidationMiddleware.get, categoryController.getGroupedCategories)

router.use(authMiddleware.isAdmin)
router.post('/', multiPart.single('icon'), categoryValidationMiddleware.create, categoryController.createCategory)
router.put('/remove-parent', categoryValidationMiddleware.removeParentCategory, categoryController.removeParentCategory)
router.put('/:category', multiPart.single('icon'), categoryValidationMiddleware.update, categoryController.updateCategory)
router.delete('/:category', categoryValidationMiddleware.deleteCategory, categoryController.destroyCategory)

module.exports = router
