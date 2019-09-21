const express = require('express')
const authMiddleware = require('./../functions/authMiddleware')

const messageController = require('../controllers/messageController')

const router = express.Router()

router.get('/truncate-messages', messageController.truncateMessage)
router.get('/recent-chats', authMiddleware.isAuthenticated, messageController.getRecentChat)
module.exports = router
