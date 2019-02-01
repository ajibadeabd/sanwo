const express = require('express')

const orderController = require('../controllers/orderControllerOld')

const router = express.Router()


router.post('/createOrder', orderController.create)
router.get('/getOrder', orderController.getOrder)
router.get('/getDisbursed', orderController.getDisbursedStock)
router.put('/:orderid', orderController.putorder)
router.get('/getPurchased', orderController.purchasedStock)
router.get('/inProcess', orderController.inProcess)
router.get('/shipped', orderController.shipped)
router.delete('/:orderid', orderController.del)

module.exports = router
