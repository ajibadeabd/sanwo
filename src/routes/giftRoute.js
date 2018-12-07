const express = require('express')

const giftController = require('../controllers/giftController')

const router = express.Router()


router.post('/createCard', giftController.createGift)
router.post('/authCard', giftController.auth)
router.delete('/:giftId', giftController.del)


module.exports = router