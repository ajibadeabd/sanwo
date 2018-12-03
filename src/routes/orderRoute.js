const express = require('express')

const orderController = require('../controllers/orderController')

const router = express.Router()


router.post('/createOrder', orderController.create)
router.get('/getOrder', orderController.getOrder)
router.get('/getDisbursed', orderController.getDisbursedStock)
router.put('/updateOrder', orderController.putOrder)
router.get('/getPurchased', orderController.purchasedStock)
router.get('/inProcess', orderController.inProcess)
router.get('/shipped', orderController.shipped)
router.delete('/:OrderId', orderController.del)

module.exports = router