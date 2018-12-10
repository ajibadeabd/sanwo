const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const helpers = require('./../functions/helpers')

/**
 * send a password reset mail to a user along with a validation token
 * @param {Object} req
 * @param {Object}res
 * @param {function}next
 * @param {Boolean}isNewUser used to check of the method was after a new user sign up
 * @return {Object} response
 */
const forgotPassword = (req, res, next, isNewUser = false) => {
  const query = { email: req.body.email }

  const sendTokenEmail = (err, newUser) => {
    if (err) throw err
    helpers.sendPasswordResetEmail(newUser, req)
  }

  //  check if email exists
  req.Models.User.valueExists(query)
    .then((result) => {
      if (result) {
        //  yay! it does. let's generate a token
        crypto.randomBytes(20, (error, buffer) => {
          if (error) throw error
          const token = buffer.toString('hex')
          //  update to token to the user object in DB, and set expiry to 24hr
          req.Models.User.findOneAndUpdate(query,
            {
              resetPasswordToken: token,
              resetPasswordExpires: Date.now() + 86400000
            },
            {
              upsert: true,
              new: true
            })
            .exec(sendTokenEmail)
          if (!isNewUser) {
            res.json({
              success: true,
              message: 'Kindly check your email for further instructions',
              data: null
            })
          }
        })
      } else {
        return res.status(422)
          .json({
            success: false,
            message: 'Email doesn\'t exist'
          })
      }
    })
}

const _createBuyer = (req, res) => {
  req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: req.body.password,
    accountType: req.body.accountType,
    cooperative: req.body.cooperative
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

const _createSuperAdmin = (req, res, next) => {
  req.Models.User.create({
    name: req.body.name,
    email: req.body.email,
    accountType: req.body.accountType
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Your registration successful. Password reset link sent to your email.',
        data: result
      })
        .status(201)
      forgotPassword(req, res, next, true)
    }
  })
}


const _createSeller = (req, res, next) => {
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
      res.send({
        success: true,
        message: 'Your registration successful. Password reset link sent to your email.',
        data: result
      })
        .status(201)
      forgotPassword(req, res, next, true)
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

const passwordReset = (req, res) => {
  // check if the sent token exists and hasn't expired

  req.Models.User.findOne({
    resetPasswordToken: req.query.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  })
    .exec((err, user) => {
      if (err) throw err

      //  if a user was found update password and reset forgotPasswordFields
      if (user) {
        user.password = req.body.password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        user.save((error) => {
          if (error) throw error
          return res.send({
            success: true,
            message: 'Password updated successfully.'
          })
        })
      } else {
        // if not return a proper message
        return res.status(400)
          .send({
            success: false,
            message: 'Password reset token is invalid or has expired.'
          })
      }
    })
}

const getCooperatives = (req, res) => {
  req.Models.User.find(
    {
      accountType: helpers.constants.CORPORATE_ADMIN,
      $and: [{ status: helpers.constants.ACCOUNT_STATUS.accepted }]
    }
  )
    .select('firstName lastName _id')
    .exec((err, results) => {
      if (err) {
        throw err
      } else {
        res.send({
          success: true,
          message: 'cooperatives',
          data: results
        })
      }
    })
}

module.exports = {
  create,
  login,
  forgotPassword,
  passwordReset,
  getCooperatives
}