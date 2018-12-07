const express = require('express')

const orderController = require('../controllers/orderController')

const router = express.Router()


router.post('/createOrder', orderController.create)
router.get('/getOrder', orderController.getOrder)
router.get('/getDisbursed', orderController.getDisbursedStock)
<<<<<<< HEAD
router.put('/:orderid', orderController.putorder)
router.get('/getPurchased', orderController.purchasedStock)
router.get('/inProcess', orderController.inProcess)
router.get('/shipped', orderController.shipped)
router.delete('/:orderid', orderController.del)
=======
router.put('/updateOrder', orderController.putOrder)
router.get('/getPurchased', orderController.purchasedStock)
router.get('/inProcess', orderController.inProcess)
router.get('/shipped', orderController.shipped)
router.delete('/:OrderId', orderController.del)
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194

module.exports = router