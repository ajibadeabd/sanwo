const express = require('express')
const multer = require('multer')

const userController = require('../controllers/userController')
const userValidationMiddleware = require('../functions/userValidationMiddleware')

const router = express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = req.path.substring(1, req.path.length)
    path = (path.includes('/')) ? path.substr(0, path.indexOf('/')) : path
    const parentPath = 'public/upload/'
    let saveAt = ''
    // file path depends on the route we visiting could be avatar upload
    if (path === 'register') {
      saveAt = `${parentPath}/registrationDocuments/`
    } else {
      saveAt = `${parentPath}/`
    }
    cb(null, saveAt)
  }
})

const multiPart = multer({ storage })
// TODO:: implement upload business document

router.post('/register', multiPart.single('businessRegistrationDocument'),
  userValidationMiddleware.validateUserCreation, userController.create)

router.post('/login',
  userValidationMiddleware.validateUserLogin, userController.login)

router.get('/cooperatives', userController.getCooperatives)

module.exports = router
