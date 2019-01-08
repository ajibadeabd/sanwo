const express = require('express')
const multer = require('multer')
const inventoryValidation = require('../functions/inventoryValidationMiddleware')
const authMiddleware = require('./../functions/authMiddleware')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/upload/products/')
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}_${file.originalname.replace(/\s/ig, '_')}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
})
const inventoryController = require('../controllers/inventoryController')

const router = express.Router()

router.get('/', inventoryValidation.get, inventoryController.getInventories)

// apply auth middleware
router.use(authMiddleware.isSeller)
router.post('/', upload.array('images'), inventoryValidation.create, inventoryController.create)
router.put('/:inventoryId', upload.array('images'), inventoryValidation.update, inventoryController.update)
router.delete('/:inventoryId', inventoryValidation.deleteInventory, inventoryController.deleteInventory)
router.delete('/image/:inventoryId',
  inventoryValidation.deleteImage, inventoryController.deleteImage)

module.exports = router
