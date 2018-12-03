const express = require('express')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/upload/')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true)
  } else {
    cb(new Error('File Image not supported'), false)
  }
}

const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter })
const inventoryController = require('../controllers/inventoryController')

const router = express.Router()

router.get('/', inventoryController.getAll)
router.post('/create', upload.single('productImage'), inventoryController.create)
router.delete('/:inventoryId', inventoryController.del)
router.put('/:inventoryId', inventoryController.update)
router.get('/:inventoryId', inventoryController.getOne)


module.exports = router