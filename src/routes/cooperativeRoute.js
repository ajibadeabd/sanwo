const express = require('express')

const router = express.Router()
const cooperativeController = require('../controllers/cooperativeController')
const {
  profileUpdate, memberTransactions, memberStatus
} = require('../functions/cooperativeValidationMiddleware')


router.put('/', profileUpdate,
  cooperativeController.update)

router.get('/members', cooperativeController.members)
router.get('/members-purchases', cooperativeController.cooperativeMemberOrders)
router.get('/defaulting-members', cooperativeController.defaultingMembers)
router.get('/member-transactions/:memberId', memberTransactions, cooperativeController.memberTransactions)
router.put('/member-status/:memberId', memberStatus, cooperativeController.updateMemberStatus)

module.exports = router
