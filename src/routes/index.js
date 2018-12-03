const express = require('express')
const sampleRoute = require('./sampleRoute')
const userRoute = require('./userRoute')
const adminRoute = require('./adminRoute')

const authMiddleware = require('./../functions/authMiddleware')


const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

router.use('/users', userRoute)
router.use('/admin', authMiddleware.isAdmin, adminRoute)
router.use('/api/v1/', sampleRoute)

module.exports = router
