const express = require('express')
const fs = require('fs')
const path = require('path')
const authMiddleware = require('./../functions/authMiddleware')
const inventoryRoute = require('./inventoryRoute')
const orderRoute = require('./orderRoute')
const sampleRoute = require('./sampleRoute')
const userRoute = require('./userRoute')
const adminRoute = require('./adminRoute')
const sellerRoute = require('./sellerRoute')
const buyerRoute = require('./buyerRoute')
const cooperativeRoute = require('./cooperativeRoute')
const categoryRoute = require('./categoryRoute')
const wishListRoute = require('./wishListRoute')
const cartRoute = require('./cartRoute')
const addressRoute = require('./addressRoute')
const purchaseRoute = require('./purchaseRoute')
const messageRoute = require('./messageRoute')
const paymentRoute = require('./paymentRoute')
const bankAccountRoute = require('./bankAccountRoute')
const walletRoute = require('./walletRoute')
const ratingRoute = require('./ratingRoute')

const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

router.post('/vanhack',(req, res)=>{
 
  var {magic, dist} = req.body;
  var cold = [];
  for (let index = 0; index < magic.length; index++) {
    let current = {};
    current.magic = magic[index];
    current.dist = dist[index];
    cold.push(current);
  }

  res.send(cold)
})
router.use('/users', userRoute)
router.use('/users/admin', authMiddleware.isAdmin, adminRoute)
router.use('/users/seller', authMiddleware.isSeller, sellerRoute)
router.use('/users/buyer', authMiddleware.isBuyer, buyerRoute)
router.use('/users/cooperatives', authMiddleware.isCooperative, cooperativeRoute)
router.use('/inventory', inventoryRoute)
router.use('/order', orderRoute)
router.use('/categories', categoryRoute)
router.use('/purchase', purchaseRoute)
router.use('/wish-list', authMiddleware.isAuthenticated, wishListRoute)
router.use('/cart', cartRoute)
router.use('/address', authMiddleware.isAuthenticated, addressRoute)
router.use('/message', messageRoute)
router.use('/payment', paymentRoute)
router.use('/bank-account', authMiddleware.isAuthenticated, bankAccountRoute)
router.use('/wallet', authMiddleware.isSeller, walletRoute)
router.use('/rating', ratingRoute)

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
