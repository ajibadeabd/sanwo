const express = require('express')
const inventoryRoute = require('./inventoryRoute')
const orderRoute = require('./orderRoute')
const giftRoute = require('./giftRoute')
// const walletRoute = require('./walletRoute')
// const searchRoute = require('./searchRoute')

const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

router.use('/inventory', inventoryRoute)
router.use('/inventory/order', orderRoute)
router.use('/giftCard', giftRoute)
// router.use('/wallet', walletRoute)
// router.use('/searchInventory', searchRoute)


module.exports = router
