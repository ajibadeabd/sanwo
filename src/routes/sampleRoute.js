const express = require('express')

const sampleController = require('../controllers/sampleController')

const router = express.Router()

router.post('/sample/register', sampleController.register)

module.exports = router
