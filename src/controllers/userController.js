const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const helpers = require('./../functions/helpers')

const _createBuyer = (req, res) => {
  req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: req.body.password,
    accountType: req.body.accountType
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      req.log(`Newly created buyer ${JSON.stringify(result)}`)
      res.send({
        success: true,
        message: `Your registration successful. We're happy to have you here at ${process.env.APP_NAME}`,
        data: result
      })
        .status(201)
      // send welcome email to buyer
      helpers.sendWelcomeMail(result, req)
    }
  })
}

const _createSuperAdmin = (req, res) => {
  req.Models.User.create({
    firstName: req.body.firstName,
    email: req.body.email,
    accountType: req.body.accountType
  }, (err, result) => {
    if (err) throw err
    else {
      //  TODO:: send password reset email for super admin
      return res.send({
        success: true,
        message: 'Your registration successful. Password reset link sent to your email.',
        data: result
      })
        .status(201)
    }
  })
}


const _createSeller = (req, res) => {
  req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    accountType: req.body.accountType,
    businessName: req.body.businessName,
    businessRegistrationNumber: req.body.businessRegistrationNumber,
    businessRegistrationDocument: req.body.businessRegistrationDocument,
    businessAddress: req.body.businessAddress,
    businessProductCategory: req.body.businessProductCategory,
    businessSellingInOtherWebsite: req.body.businessSellingInOtherWebsite
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      //  TODO:: send password reset link to seller
      return res.send({
        success: true,
        message: 'Your registration successful. Password reset link sent to your email.',
        data: result
      })
        .status(201)
    }
  })
}


const _createCorporateAdmin = (req, res) => {
  req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: req.body.password,
    accountType: req.body.accountType
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      req.log(`Newly created corporate_admin ${JSON.stringify(result)}`)

      res.send({
        success: true,
        message: 'Your registration successful. You\'ll be notified once your account has been activated',
        data: result
      })
        .status(201)
      // send welcome email
      helpers.sendWelcomeMail(result, req)
    }
  })
}

const create = (req, res, next) => {
  const { accountType } = req.body

  if (accountType === helpers.constants.BUYER) _createBuyer(req, res, next)
  if (accountType === helpers.constants.SELLER) _createSeller(req, res, next)
  if (accountType === helpers.constants.CORPORATE_ADMIN) _createCorporateAdmin(req, res, next)
  if (accountType === helpers.constants.SUPER_ADMIN) _createSuperAdmin(req, res, next)
}

const login = (req, res) => {
  const { email, password } = req.body
  req.Models.User.findOne({ email }, (err, user) => {
    if (err) throw err

    // If the users account type is seller or corporate admin and the user status is pending
    if (user
      && (helpers.constants.SELLER === user.accountType
        || user.accountType === helpers.constants.CORPORATE_ADMIN)
      && user.status === helpers.constants.ACCOUNT_STATUS.pending) {
      return res.send({
        success: false,
        message: 'Your account is still pending confirmation. You will be notified once your account has been activated',
        data: null
      })
        .status(401)
    }

    //  If the user does't have password set
    if (user && !user.password) {
      return res.status(401)
        .send({
          success: false,
          message: 'You are yet to update your password. Kindly use the password reset link sent to your email or request a new one if link has expired.',
          data: null
        })
    }

    if (user && bcrypt.compareSync(password, user.password)) {
      const {
        _id, accountType, status
      } = user
      const token = jwt.sign({
        _id,
        accountType,
        status
      }, process.env.TOKEN_SECRET, { expiresIn: '24h' })
      return res.send({
        success: true,
        message: 'login successful',
        data: user,
        token
      })
    }

    return res.status(401)
      .send({
        success: false,
        message: 'Invalid email or password',
        data: null
      })
  })
}

module.exports = {
  create,
  login
}