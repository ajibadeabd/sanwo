const express = require('express')
const authMiddleware = require('./../functions/authMiddleware')
const ratingValidationMiddleware = require('./../functions/ratingValidationMiddleware')
const ratingController = require('../controllers/ratingController')

const router = express.Router()

router.get('/', ratingValidationMiddleware.get, ratingController.get)
router.use(authMiddleware.isAuthenticated)
router.post('/', ratingValidationMiddleware.create, ratingController.create)
router.delete('/:id', ratingValidationMiddleware.destroy, ratingController.destroy)

module.exports = router
