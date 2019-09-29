/* eslint-disable no-restricted-syntax */
const utils = require('../../utils/helper-functions')
const helpers = require('../../utils/helpers')
const notificationEvents = require('../../utils/notificationEvents')

const create = (req, res) => {
  // first let's confirm that the installment period set(if any)
  // now let's create the product
  let installmentPercentagePerMonth = []

  if (req.body.installmentPercentagePerMonth) {
    // parse installmentPercentagePerMonth to number
    installmentPercentagePerMonth = JSON
      .parse(req.body.installmentPercentagePerMonth)
    installmentPercentagePerMonth = installmentPercentagePerMonth
      .map(percentagePerMonth => parseInt(percentagePerMonth, 10))
  }
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
  }, (err, product) => {
    if (err) {
      throw err
    } else {
      res.status(201)
        .send({
          success: true,
          message: 'Created Successfully',
          data: product
        })
      notificationEvents.emit('inventory_created', { product, sellerId: req.authData.userId })
    }
  })
}

const update = (req, res) => {
  req.Models.Inventory.findOne({ _id: req.params.inventoryId, seller: req.authData.userId },
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
        inventory.meta = req.body.meta ? { ...inventory.meta, ...JSON.parse(req.body.meta) }
          : inventory.meta

        inventory.installmentPercentagePerMonth = req.body.installmentPercentagePerMonth
          ? JSON.parse(req.body.installmentPercentagePerMonth)
          : inventory.installmentPercentagePerMonth
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

/**
 * @description
 * @param {Object} req
 * @param {Boolean}status used to flag maybe to query inventory by status
 * @param {Boolean}allInventory
 * @return {Promise<{model: *, offset: number, limit: number, resultCount: *}>} Object
 * @private
 */
const _queryInventory = async (req, status = true, allInventory = false) => {
  const limit = parseInt(req.query.limit, 10) || 10
  const offset = parseInt(req.query.offset, 10) || 0

  const filter = utils.queryFilters(req)
  if (status) filter.status = true
  filter.deletedAt = undefined
  if (!allInventory) filter.quantity = { $gt: 0 }
  if (req.query.name) filter.name = { $regex: filter.name, $options: 'i' }
  const model = req.Models.Inventory.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.populate('seller category', '-password -relatedUsers')
  model.sort({ createdAt: 'desc' })
  const resultCount = await req.Models.Inventory.countDocuments(filter)
  return Promise.resolve({
    model,
    offset,
    limit,
    resultCount
  })
}

const getInventories = async (req, res) => {
  try {
    const {
      model,
      offset,
      limit,
      resultCount
    } = await _queryInventory(req, true, false)
    const results = await model

    // fetch average ratings for each product
    const getInventoryRating = results.map(async (result) => {
      const ratings = await req.Models.Rating.aggregate([
        { $match: { $and: [{ product: result._id }] } },
        { $group: { _id: '', avgRating: { $avg: '$rating' } } }
      ])
      return {
        ...result.toObject(),
        avgRating: ratings && ratings.length ? ratings[0].avgRating : 0
      }
    })
    const inventories = await Promise.all(getInventoryRating)
    res.send({
      success: true,
      message: 'Successfully fetching inventories',
      data: {
        offset,
        limit,
        resultCount,
        results: inventories
      }
    })
  } catch (e) {
    res.status(500).send({
      success: false,
      message: 'Oops! an error occurred. Please retry, if error persist contact admin',
    })
    throw new Error(e)
  }
}

const getAllInventories = async (req, res) => {
  const {
    model,
    offset,
    limit,
    resultCount
  } = await _queryInventory(req, false, true)
  const results = await model
  res.send({
    success: true,
    message: 'Successfully fetching inventories',
    data: {
      offset,
      limit,
      resultCount,
      results
    }
  })
}

const deleteInventory = async (req, res) => {
  try {
    const result = await req.Models.Inventory
      .findOne({ _id: req.params.inventoryId, seller: req.authData.userId })
    if (!result) {
      return res.status(400).send({ success: false, message: 'Inventory Not Found', data: null })
    }
    result.deletedAt = Date.now()
    result.deletedBy = req.authData.userId
    result.save()
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
  } catch (e) {
    res.status(500)
      .send({ success: false, message: 'Oops! an error occurred' })
    throw new Error(e)
  }
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
    .find({ name: { $regex: keyword, $options: 'i' }, status: true })
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
  const bySeller = { seller: req.body.userId, deletedAt: undefined }
  const totalProducts = await req.Models.Inventory
    .countDocuments(bySeller)

  const productsOutOfStock = await req.Models.Inventory
    .countDocuments({ ...bySeller, quantity: { $lte: 0 } })

  const productsInStock = await req.Models.Inventory
    .countDocuments({ ...bySeller, quantity: { $gte: 1 } })

  const productsUnapproved = await req.Models.Inventory
    .countDocuments({ ...bySeller, status: false })

  const products = await req.Models.Inventory
    .find({ ...bySeller })
  let soldItems = 0

  for (const product of products) {
    // eslint-disable-next-line no-await-in-loop
    const solds = await req.Models.Cart.find({ product: product._id })
    for (const sold of solds) {
      soldItems += sold.quantity
    }
  }

  return res.send({
    success: true,
    message: 'Successfully fetching inventories',
    data: {
      totalProducts,
      productsOutOfStock,
      productsInStock,
      productsUnapproved,
      soldItems
    }
  })
}

const getInventoryInStock = async (req, res) => {
  const query = { seller: req.authData.userId, quantity: { $gte: 1 } }

  const {
    offset,
    limit,
    resultCount
  } = await _queryInventory(req, true, true)
  const results = await req.Models.Inventory.find(query, (error, result) => {
    if (error) throw error
    return result
  }).skip(offset).limit(limit)
  res.send({
    success: true,
    message: 'Successfully fetching inventories in stock',
    data: {
      offset,
      limit,
      resultCount,
      results
    }
  })
}

const getInventoryOutStock = async (req, res) => {
  const query = { seller: req.authData.userId, quantity: { $lte: 0 } }

  const {
    offset,
    limit,
    resultCount
  } = await _queryInventory(req, true, true)
  const results = await req.Models.Inventory.find(query, (error, result) => {
    if (error) throw error
    return result
  }).skip(offset).limit(limit)
  res.send({
    success: true,
    message: 'Successfully fetching inventories in stock',
    data: {
      offset,
      limit,
      resultCount,
      results
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
  getAllInventories
}
