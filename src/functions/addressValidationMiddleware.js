const Validator = require('./../functions/Validator')

const create = (req, res, next) => {
  const validationRule = {
    firstName: 'string',
    lastName: 'string',
    phoneNumber: 'digits:11',
    address: 'required',
    additionalInfo: 'string',
    region: 'required|min:3',
    city: 'required|min:3',
  }

  Validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const update = (req, res, next) => {
  const validationRule = {
    id: 'required|mongoId|exists:AddressBook,_id',
    firstName: 'string',
    lastName: 'string',
    phoneNumber: 'digits:11',
    address: 'string',
    additionalInfo: 'string',
    region: 'min:3',
    city: 'min:3',
  }

  Validator({ ...req.body, ...req.params }, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const deleteAddressBook = (req, res, next) => {
  const validationRule = { id: 'required|mongoId|exists:AddressBook,_id' }
  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const get = (req, res, next) => {
  const validationRule = {
    id: 'mongoId|exists:AddressBook,_id',
    firstName: 'string',
    lastName: 'string',
    phoneNumber: 'digits:11',
    address: 'string',
    additionalInfo: 'string',
    region: 'min:3',
    city: 'min:3',
  }
  Validator(req.query, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}


module.exports = {
  create,
  deleteAddressBook,
  update,
  get
}
