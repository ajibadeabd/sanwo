const Validator = require('./../functions/Validator')
const helpers = require('./../functions/helpers')

const _validateFiles = (files) => {
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (files && files.length > 0) {
    // validate uploaded files if any was uploaded
    const checkFiles = files.every(file => validFileTypes.includes(file.mimetype))
    if (!checkFiles) {
      /**
       * If one of the files doesn't match our supported
       * files return validation error and remove all files
       */
      for (let i = 0; i <= files.length; i += 1) {
        if (files[i] && files[i].path) helpers.removeFile(files[i].path)
      }
      return false
    }
    return true
  }
  return false
}

const create = (req, res, next) => {
  const { files } = req
  const checkFiles = _validateFiles(files)
  if (files && files.length > 0 && !checkFiles) {
    return res.status(400)
      .send({
        success: false,
        message: 'Validation failed',
        data: { errors: { images: ['Invalid files uploaded'] } }
      })
  }
  // if no error, save file names in image property as an array
  if (checkFiles) req.body.images = files.map(file => file.filename)


  const validationRule = {
    name: 'required',
    description: 'string',
    price: 'required|numeric|min:100',
    category: 'required|mongoId|exists:Category,_id',
    installmentPercentagePerMonth: 'isJson',
    images: 'max:5',
    meta: 'isJson',
    quantity: 'required|numeric|min:1'
  }

  Validator(req.body, validationRule, { 'max.images': 'Maximum of 5 images' }, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
      if (files.length > 0) {
        for (let i = 0; i <= files.length; i += 1) helpers.removeFile(files[i].path)
      }
    } else {
      next()
    }
  })
}

const update = (req, res, next) => {
  const requestBody = { ...req.body, ...req.params }
  const { files } = req
  const checkFiles = _validateFiles(files)
  if (files && files.length > 0 && !checkFiles) {
    return res.status(400)
      .send({
        success: false,
        message: 'Validation failed',
        data: { errors: { images: ['Invalid files uploaded'] } }
      })
  }
  // if no error, save file names in image property as an array
  if (checkFiles) req.body.images = files.map(file => file.filename)


  const validationRule = {
    inventoryId: 'required|mongoId|exists:Inventory,_id',
    name: 'string',
    description: 'string',
    price: 'numeric|min:100',
    category: 'mongoId|exists:Category,_id',
    installmentPercentagePerMonth: 'isJson',
    quantity: 'numeric|min:1',
    images: 'max:5',
    meta: 'isJson',
  }

  Validator(requestBody, validationRule, { 'max.images': 'Maximum of 5 images' }, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
      if (files.length > 0) {
        for (let i = 0; i <= files.length; i += 1) helpers.removeFile(files[i].path)
      }
    } else {
      next()
    }
  })
}

const get = (req, res, next) => {
  const validationRule = {
    name: 'string',
    description: 'string',
    price: 'numeric',
    category: 'mongoId',
    seller: 'mongoId',
    installmentPeriod: 'numeric',
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

const deleteInventory = (req, res, next) => {
  const validationRule = { inventoryId: 'required|mongoId|exists:Inventory,_id' }
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

const deleteImage = (req, res, next) => {
  const validationRule = {
    inventoryId: 'required|mongoId|exists:Inventory,_id',
    images: 'required|string'
  }
  const requestBody = { ...req.params, ...req.body }
  Validator(requestBody, validationRule, {}, (err, status) => {
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

const search = (req, res, next) => {
  const validationRule = {
    keyword: 'required|min:1'
  }
  const customMsg = {
    'keyword.required': 'Please specify a keyword to search',
    'keyword.min': 'Please enter at least 1 character',
  }
  Validator(req.params, validationRule, customMsg, (err, status) => {
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
  get,
  update,
  deleteInventory,
  deleteImage,
  search
}
