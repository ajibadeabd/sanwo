const utils = require('../../utils/helper-functions')
const helpers = require('../../utils/helpers')

const _checkValidInstallment = (installmentPercentagePerMonth, catId, req, res, callback) => {
  req.Models.Category.findById(catId, (err, category) => {
    if (err) throw err
    else if (category) {
      /** fist let's get the length of price array set for each months, bear in mind that
      * minimum period is 2(months).
      */

      const installmentPercentagePerMonthLength = installmentPercentagePerMonth
        ? JSON.parse(installmentPercentagePerMonth).length : 0
      let installmentCheckErrorMsg = ''
      if (category.installmentPeriod === 0 && installmentPercentagePerMonthLength > 0) {
        installmentCheckErrorMsg = 'The product category does not support installment payment'
      }

      if (category.installmentPeriod !== 0
        && (installmentPercentagePerMonthLength > category.installmentPeriod)) {
        installmentCheckErrorMsg = `The installment period cannot be greater than the category installment period which is ${category.installmentPeriod}`
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
  _checkValidInstallment(req.body.installmentPercentagePerMonth,
    req.body.category, req, res, () => {
    // now let's create the product
      const installmentPercentagePerMonth = req.body.installmentPercentagePerMonth
        ? JSON.parse(req.body.installmentPercentagePerMonth) : []
      req.Models.Inventory.create({
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        price: req.body.price,
        seller: req.authData.userId,
        images: req.body.images,
        quantity: req.body.quantity,
        installmentPercentagePerMonth,
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
      inventory.quantity = req.body.quantity || inventory.quantity
      inventory.images = req.body.images
        ? inventory.images.concat(req.body.images)
        : inventory.images
      inventory.installmentPercentagePerMonth = req.body.installmentPercentagePerMonth
        || inventory.installmentPercentagePerMonth
      inventory.meta = req.body.meta
        ? { ...inventory.meta, ...JSON.parse(req.body.meta) }
        : inventory.meta

      // lets validate installment before saving
      _checkValidInstallment(inventory.installmentPercentagePerMonth,
        inventory.category, req, res, () => {
          inventory.installmentPercentagePerMonth = req.body.installmentPercentagePerMonth
            ? JSON.parse(req.body.installmentPercentagePerMonth) : []
          inventory.save((error) => {
            if (error) throw error
            res.send({
              success: true,
              message: 'Successfully updated',
              data: inventory
            })
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

const _queryInventory = (req) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
  const model = req.Models.Inventory.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.populate('seller category', '-password -relatedUsers')
  model.sort({ createdAt: 'desc' })
  return { model, offset, limit }
}

const getInventories = (req, res) => {
  const { model, offset, limit } = _queryInventory(req)
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
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
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

const getInventoryStat = async (req, res) => {
  const bySeller = { seller: req.body.userId }
  const totalProducts = await req.Models.Inventory
    .countDocuments(bySeller)

  const productsOutOfStock = await req.Models.Inventory
    .countDocuments({ ...bySeller, quantity: { $lte: 0 } })

  const productsInStock = await req.Models.Inventory
    .countDocuments({ ...bySeller, quantity: { $gte: 1 } })

  return res.send({
    success: true,
    message: 'Successfully fetching inventories',
    data: {
      totalProducts,
      productsOutOfStock,
      productsInStock
    }
  })
}

const getInventoryInStock = async (req, res) => {
  const { model, offset, limit } = _queryInventory(req)
  const filter = { seller: req.body.userId, quantity: { $gte: 1 } }
  model.find(filter)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching inventories in stock',
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

const getInventoryOutStock = async (req, res) => {
  const { model, offset, limit } = _queryInventory(req)
  const filter = { seller: req.body.userId, quantity: { $lte: 0 } }
  model.find(filter)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching inventories out of stock',
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

module.exports = {
  create,
  deleteInventory,
  update,
  getInventories,
  deleteImage,
  searchInventories,
  getInventoryStat,
  getInventoryInStock,
  getInventoryOutStock,
}
