const utils = require('../../utils/helper-functions')
const helpers = require('./../functions/helpers')

const _checkValidInstallment = (req, res, callback) => {
  req.Models.Category.findById(req.body.category, (err, category) => {
    if (err) throw err
    else if (category) {
      let installmentCheckErrorMsg = ''
      if (category.installmentPeriod === 0 && req.body.installmentPeriod > 0) {
        installmentCheckErrorMsg = 'The product category does not support installment payment'
      }
      if (category.installmentPeriod !== 0
        && (req.body.installmentPeriod > category.installmentPeriod)) {
        installmentCheckErrorMsg = 'The installment period cannot be greater than the category installment payment'
      }
      if (installmentCheckErrorMsg) {
        return res.status(400).send({
          success: false,
          message: 'Validation failed',
          data: {
            errors: {
              installmentPeriod: [installmentCheckErrorMsg]
            }
          }
        })
      }
      callback()
    }
  })
}
const create = (req, res) => {
  // first let's confirm that the installment period set(if any)
  // is not greater than the product category requirement
  _checkValidInstallment(req, res, () => {
    // now let's create the product
    req.Models.Inventory.create({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      seller: req.authData.userId,
      images: req.body.images,
      installmentPeriod: req.body.installmentPeriod,
      meta: req.body.meta ? JSON.parse(req.body.meta) : {},
    }, (err, result) => {
      if (err) {
        throw err
      } else {
        return res.status(201)
          .send({
            success: true,
            message: 'Created Successfully',
            data: result
          })
      }
    })
  })
}

const update = (req, res) => {
  req.Models.Inventory.findOne({
    _id: req.params.inventoryId,
    seller: req.authData.userId
  },
  (err, inventory) => {
    if (err) throw err
    if (inventory) {
      inventory.name = req.body.name || inventory.name
      inventory.category = req.body.category || inventory.category
      inventory.description = req.body.description || inventory.description
      inventory.price = req.body.price || inventory.price
      inventory.images = req.body.images
        ? inventory.images.concat(req.body.images)
        : inventory.images
      inventory.installmentPeriod = req.body.installmentPeriod || inventory.installmentPeriod
      inventory.meta = req.body.meta
        ? { ...inventory.meta, ...JSON.parse(req.body.meta) }
        : inventory.meta

      inventory.save((error) => {
        if (error) throw error
        res.send({
          success: true,
          message: 'Successfully updated',
          data: inventory
        })
      })
    } else {
      return res.status(400)
        .send({
          success: false,
          message: 'Inventory Not Found',
          data: null
        })
    }
  })
}

const getInventories = (req, res) => {
  let limit = parseInt(req.query.limit)
  let offset = parseInt(req.query.offset)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
  const model = req.Models.Inventory.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.populate('seller category', '-password -relatedUsers')
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching inventories',
        data: {
          offset,
          limit,
          resultCount: results.length,
          results
        }
      })
    }
  })
}

const deleteInventory = (req, res) => {
  req.Models.Inventory.findOneAndDelete(
    {
      _id: req.params.inventoryId,
      seller: req.authData.userId
    }, (err, result) => {
      if (err) {
        throw err
      } else {
        res.send({
          success: true,
          message: 'Deleted successfully',
          data: result
        })
        // delete images related to the deleted product
        const productImages = result.images
        if (productImages.length) {
          for (let i = 0; i <= productImages.length; i += 1) {
            if (productImages[i]) {
              helpers.removeFile(`public/upload/products/${productImages[i]}`)
            }
          }
        }
      }
    }
  )
}

const deleteImage = (req, res) => {
  const images = req.body.images.split(',')
  req.Models.Inventory.findOne({
    _id: req.params.inventoryId,
    seller: req.authData.userId
  }, (err, inventory) => {
    if (err) throw err
    if (inventory) {
      const productImages = inventory.images
      // check if the image we're trying to delete exist in our inventory images
      const checkImage = productImages.filter(image => images.includes(image))
      // if the length doesn't match one or all the image we're trying to delete doesn't exist
      if (checkImage.length !== images.length) {
        return res.status(400)
          .send({
            success: false,
            message: 'Image you are trying to delete doesn\'t match',
            data: null
          })
      }
      // since we are sure the image exists now let go ahead and delete ehm
      for (let i = 0; i <= images.length; i += 1) {
        // remove the images from file system
        helpers.removeFile(`public/upload/products/${images[i]}`)
      }
      // remove the image from product images.
      inventory.images = productImages.filter(image => !images.includes(image))
      inventory.save((error) => {
        if (error) throw error
        return res.send({ success: true, message: 'Deleted product images', data: inventory })
      })
    } else return res.send({ success: false, message: 'Inventory Not Found', data: null })
  })
}

const searchInventories = async (req, res) => {
  let limit = parseInt(req.query.limit)
  let offset = parseInt(req.query.offset)
  offset = offset || 0
  limit = limit || 10
  const { keyword } = req.params
  const products = await req.Models.Inventory
    .find({ name: { $regex: keyword, $options: 'i' } })
    .skip(offset).limit(limit)

  const categories = await req.Models.Category
    .find({ name: { $regex: keyword, $options: 'i' } })
    .skip(offset).limit(limit)

  res.send({
    success: true,
    message: `Result for ${keyword}`,
    data: {
      offset,
      limit,
      results: {
        products,
        categories
      }
    }
  })
}

module.exports = {
  create,
  deleteInventory,
  update,
  getInventories,
  deleteImage,
  searchInventories
}
