const express = require('express')

const router = express.Router()
const cooperativeController = require('../controllers/cooperativeController')
const { profileUpdate, memberTransactions } = require('../functions/cooperativeValidationMiddleware')


router.put('/', profileUpdate,
  cooperativeController.update)

router.get('/members', cooperativeController.members)
router.get('/members-purchases', cooperativeController.cooperativeMemberOrders)
router.get('/defaulting-members', cooperativeController.defaultingMembers)
router.get('/member-transactions/:memberId', memberTransactions, cooperativeController.memberTransactions)

module.exports = router
