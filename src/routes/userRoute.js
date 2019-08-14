const express = require('express')
const fs = require('fs')
const multer = require('multer')

const authMiddleware = require('./../functions/authMiddleware')
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
    } else if (path === 'avatar') {
      saveAt = `${parentPath}avatars/`
    } else {
      saveAt = `${parentPath}/`
    }
    if (!fs.existsSync(saveAt)) {
      fs.mkdirSync(saveAt)
    }
    cb(null, saveAt)
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}_${file.originalname.replace(/\s/ig, '_')}`)
  }
})

const multiPart = multer({ storage })

router.post('/register', multiPart.single('businessRegistrationDocument'),
  userValidationMiddleware.validateUserCreation, userController.create)

router.get('/fetch-google-url', userController.googleUrl);

router.post('/google-url-complete', userController.googleSignup);

router.post('/login',
  userValidationMiddleware.validateUserLogin, userController.login)

router.post('/forgot-password',
  userValidationMiddleware.validateForgotPassword, userController.forgotPassword)

router.post('/password-reset',
  userValidationMiddleware.validatePasswordReset, userController.passwordReset)

router.get('/cooperatives', userController.getCooperatives)

router.use(authMiddleware.isAuthenticated)

router.post('/avatar', multiPart.single('avatar'),
  userValidationMiddleware.validateAvatar, userController.updateUserAvatar)

module.exports = router
