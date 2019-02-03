const jwt = require('jsonwebtoken')
const helpers = require('./../functions/helpers')

const isAdmin = (req, res, next) => {
  jwt.verify(
    req.headers['x-access-token'], process.env.TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: err.message
          })
      } else if (decoded.accountType !== helpers.constants.SUPER_ADMIN) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: 'Access Unauthorized'
          })
      } else {
        req.body.accountType = decoded.accountType
        req.body.userId = decoded._id
        next()
      }
    }
  )
}

const isSeller = (req, res, next) => {
  jwt.verify(
    req.headers['x-access-token'], process.env.TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: err.message
          })
      } else if (decoded.accountType !== helpers.constants.SELLER) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: 'Access Unauthorized'
          })
      } else {
        const authData = {
          accountType: decoded.accountType,
          userId: decoded._id,
        }
        req.body.accountType = decoded.accountType
        req.body.userId = decoded._id
        req.authData = authData
        next()
      }
    }
  )
}

const isBuyer = (req, res, next) => {
  jwt.verify(
    req.headers['x-access-token'], process.env.TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: err.message
          })
      } else if (decoded.accountType !== helpers.constants.BUYER) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: 'Access Unauthorized'
          })
      } else {
        const authData = {
          accountType: decoded.accountType,
          userId: decoded._id,
        }
        req.body.accountType = decoded.accountType
        req.body.userId = decoded._id
        req.authData = authData
        next()
      }
    }
  )
}

const isCooperative = (req, res, next) => {
  jwt.verify(
    req.headers['x-access-token'], process.env.TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: err.message
          })
      } else if (decoded.accountType !== helpers.constants.CORPORATE_ADMIN) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: 'Access Unauthorized'
          })
      } else {
        const authData = {
          accountType: decoded.accountType,
          userId: decoded._id,
        }
        req.body.accountType = decoded.accountType
        req.body.userId = decoded._id
        req.authData = authData
        next()
      }
    }
  )
}

const isAuthenticated = (req, res, next) => {
  jwt.verify(
    req.headers['x-access-token'], process.env.TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(401)
          .send({
            success: false,
            message: 'Unauthorized',
            data: err.message
          })
      } else {
        const authData = {
          accountType: decoded.accountType,
          userId: decoded._id,
        }
        req.body.accountType = decoded.accountType
        req.body.userId = decoded._id
        req.authData = authData
        next()
      }
    }
  )
}

module.exports = {
  isAdmin,
  isSeller,
  isBuyer,
  isCooperative,
  isAuthenticated
}
