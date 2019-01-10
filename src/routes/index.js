const express = require('express')
const fs = require('fs')
const path = require('path')
const inventoryRoute = require('./inventoryRoute')
const orderRoute = require('./orderRoute')
const sampleRoute = require('./sampleRoute')
const userRoute = require('./userRoute')
const adminRoute = require('./adminRoute')
const sellerRoute = require('./sellerRoute')
const buyerRoute = require('./buyerRoute')
const purchaseRoute = require('./purchaseRoute')
const categoryRoute = require('./categoryRoute')
const wishListRoute = require('./wishListRoute')


const authMiddleware = require('./../functions/authMiddleware')


const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */


router.use('/users', userRoute)
router.use('/users/admin', authMiddleware.isAdmin, adminRoute)
router.use('/users/seller', authMiddleware.isSeller, sellerRoute)
router.use('/users/buyer', authMiddleware.isBuyer, buyerRoute)
router.use('/inventory', inventoryRoute)
router.use('/inventory/order', orderRoute)
router.use('/purchase', purchaseRoute)
router.use('/categories', categoryRoute)
router.use('/wish-list', authMiddleware.isAuthenticated, wishListRoute)

// file download route
router.get('/file/', (req, res) => {
  const rootPath = path.join(__dirname, '../../public')
  if (!req.query.module || !req.query.filename) return res.status(404).send('Invalid Query')
  const folderPath = `/upload/${req.query.module}/${req.query.filename}`
  if (fs.existsSync(`${rootPath}/${folderPath}`)) {
    return res.sendFile(folderPath, { root: rootPath })
  }
  res.status(404).send('File Not Found')
})

router.use('/api/v1/', sampleRoute)

module.exports = router
