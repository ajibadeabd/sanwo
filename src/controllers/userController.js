const helpers = require('./../functions/helpers')


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

const _createSuperAdmin = (req, res) => {
  req.Models.User.create({
    name: req.body.name,
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

const getCooperatives = (req, res) => {
  req.Models.User.find(
    {
      accountType: helpers.constants.CORPORATE_ADMIN,
      $and: [{ status: helpers.constants.ACCOUNT_STATUS.accepted }]
    }
  ).select('firstName lastName _id').exec((err, results) => {
    if (err) throw err
    else {
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
  getCooperatives
}