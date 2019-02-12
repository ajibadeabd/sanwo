const Validator = require('./../functions/Validator')
const helpers = require('./../functions/helpers')

const get = (req, res, next) => {

  const validationRule = {
    _id: 'mongoId',
    name: 'string',
    slug: 'string',
    installmentPeriod: 'numeric|min:2',
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

const create = (req, res, next) => {
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (req.file && !validFileTypes.includes(req.file.mimetype)) {
    // if file was upload but invalid type remove the file
    if (req.file) helpers.removeFile(req.file.path)
    return res.status(400).send({
      success: false,
      message: 'Validation failed',
      data: { errors: { icon: ['Invalid file uploaded. jpeg, png and jpg only'] } }
    })
  }
  if (req.file) req.body.icon = req.file.filename

  if (!req.body.slug || req.body.slug.replace(/\s/, '') === '') {
    req.body.slug = ''
  }
  const validationRule = {
    name: 'required|exists:Category,name',
    slug: 'exists:Category,slug',
    installmentPeriod: 'numeric|min:0',
    description: 'string',
    icon: 'string',
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
  const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (req.file && !validFileTypes.includes(req.file.mimetype)) {
    // if file was upload but invalid type remove the file
    if (req.file) helpers.removeFile(req.file.path)
    return res.status(400).send({
      success: false,
      message: 'Validation failed',
      data: { errors: { icon: ['Invalid file uploaded. jpeg, png and jpg only'] } }
    })
  }
  if (req.file) req.body.icon = req.file.filename

  const reqBody = { ...req.body, ...req.params }
  if (!req.body.slug || req.body.slug.replace(/\s/, '') === '') {
    req.body.slug = ''
  }
  const validationRule = {
    category: 'required|mongoId|exists:Category,_id',
    name: 'string',
    installmentPeriod: 'numeric|min:0',
    description: 'string',
    icon: 'string',
  }

  Validator(reqBody, validationRule, {}, (err, status) => {
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

const deleteCategory = (req, res, next) => {
  const validationRule = { category: 'required|mongoId|exists:Category,_id' }
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

module.exports = {
  get,
  create,
  update,
  deleteCategory
}
