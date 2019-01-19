const Validator = require('./../functions/Validator')
const helpers = require('./../functions/helpers')

/**
 * We'll be validating user body request before hitting our controller method using validatorjs
 * to learn more about this module https://www.npmjs.com/package/validatorjs
 * This validation will be done depending on the registering account type
 * @param {Object} req
 * @param {Object} res
 * @param {function} next
 * @return {*} object
 */
const validateUserCreation = (req, res, next) => {
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

  // check if businessRegistrationDocument was upload and update the document name
  if (req.file && validFileTypes.includes(req.file.mimetype)) {
    req.body.businessRegistrationDocument = req.file.filename
  } else if (req.file && !validFileTypes.includes(req.file.mimetype)) {
    // if file was upload but invalid type remove the file
    helpers.removeFile(req.file.path)
  }

  // check if the accountType seller anc a file was uploaded
  if (req.body.accountType === 'seller' && !req.file) {
    req.body.businessRegistrationDocument = ''
  }

  const { body: reqBody } = req

  const accountTypes = {
    [helpers.constants.SELLER]: true,
    [helpers.constants.BUYER]: true,
    [helpers.constants.CORPORATE_ADMIN]: true,
    [helpers.constants.SUPER_ADMIN]: true
  }

  const { accountType } = reqBody

  //  let us check if accountType is set and exists in our defined accountTypes
  if (!accountType || (!accountTypes[accountType])) {
    //  if validation fails remove file
    if (req.body.businessRegistrationDocument) {
      helpers.removeFile(req.file.path)
    }
    return res.status(400).send({
      success: false,
      message: 'Validation failed',
      data: { errors: { accountType: ['Invalid account type'] } }
    })
  }

  //  if email is not defined set an empty string
  if (!reqBody.email) {
    reqBody.email = ''
  } else {
    reqBody.email = reqBody.email.replace(/\s/g, '')
  }
  const buyerRules = {
    accountType: 'required',
    firstName: 'required',
    lastName: 'required',
    email: 'email|exists:User,email',
    phoneNumber: [{
      required_if: ['email', ''],
      digits: 11,
      exists: 'User,phoneNumber'
    }],
    cooperative: [{
      mongoId: '',
      exists: 'User,_id'
    }],
    password: 'required|password_policy|confirmed'
  }

  const superAdminRules = {
    accountType: 'required',
    name: 'required',
    email: 'required|exists:User,email'
  }

  const sellerRules = {
    ...buyerRules,
    businessName: 'required|exists:User,businessName',
    businessRegistrationNumber: 'required|exists:User,businessRegistrationNumber',
    businessRegistrationDocument: 'required',
    businessAddress: 'required',
    businessProductCategory: 'required',
    businessSellingOnOtherWebsite: 'required|boolean',
  }
  //  password is not required when signing up as a seller so we won't validate it
  delete sellerRules.password

  const customMessages = {
    'required_if.phoneNumber': 'Please provide your email or phone number',
    'exists.cooperative': 'Specified cooperative doesn\'t not exits',
    'required.businessRegistrationDocument':
      'Image or PDF file is required for business registration document'
  }

  let validationRule

  // buyer and corporate_admin uses the same validation rule
  switch (accountType) {
    case helpers.constants.BUYER:
    case helpers.constants.CORPORATE_ADMIN:
      validationRule = buyerRules
      break
    case helpers.constants.SELLER:
      validationRule = sellerRules
      break
    case helpers.constants.SUPER_ADMIN:
      validationRule = superAdminRules
      break
    default:
      validationRule = {}
  }
  //  validation rule depends on the user registering
  Validator(reqBody, validationRule, customMessages, (error, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: 'Validation failed',
        data: error
      })
      if (req.file) helpers.removeFile(req.file.path)
    } else {
      next()
    }
  })
}

const validateUserLogin = (req, res, next) => {
  const { body: reqBody } = req
  const validationRule = {
    email: 'required|email',
    password: 'required'
  }
  Validator(reqBody, validationRule, {}, (error, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: 'Validation failed',
        data: error
      })
    } else {
      next()
    }
  })
}

const validateForgotPassword = (req, res, next) => {
  const { body: reqBody } = req

  Validator(reqBody, { email: 'required|email' }, {}, (error, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: 'Validation failed',
        data: error
      })
    } else {
      next()
    }
  })
}

const validatePasswordReset = (req, res, next) => {
  const { body, query } = req
  const bodyBody = { ...body, ...query }

  const validationRule = {
    token: 'required',
    password: 'required|password_policy|confirmed'
  }

  Validator(bodyBody, validationRule, {}, (error, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: 'Validation failed',
        data: error
      })
    } else {
      next()
    }
  })
}

const validateAvatar = (req, res, next) => {
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!req.file || !validFileTypes.includes(req.file.mimetype)) {
    // if file was upload but invalid type remove the file
    if (req.file) helpers.removeFile(req.file.path)
    return res.status(400).send({
      success: false,
      message: 'Validation failed',
      data: { errors: { images: ['Invalid file uploaded. jpeg, png and jpg only'] } }
    })
  }

  req.body.avatar = req.file.filename
  next()
}


module.exports = {
  validateUserCreation,
  validateUserLogin,
  validateForgotPassword,
  validatePasswordReset,
  validateAvatar
}
