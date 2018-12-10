// const multer = require('multer')
const inventory = require('../models/inventoryModel')

const create = (req, res) => {
  req.log(req.file)
  req.Models.Inventory.create({
    productImage: req.file.path,
    itemName: req.body.itemName,
    productCategory: req.body.productCategory,
    description: req.body.description,
    price: req.body.price
  }, (err, result) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Created Successfully',
        data: result
      })
    }
  })
}

const del = (req, res) => {
  req.Models.Inventory.findByIdAndDelete(
    req.params.inventoryid, (err, inventoryInfo) => {
      if (err) throw err
      if (!inventoryInfo) {
        return res.json({
          message: 'item not found'
        })
      }

      res.json({
        status: 'success',
        message: 'Deleted successfully',
        data: inventoryInfo
      })
    }
  )
}

const update = (req, res) => {
  req.Models.Inventory.findByIdAndUpdate(
    req.params.inventoryid, (err, inventoryInfo) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Updated successfully',
          data: inventoryInfo
        })
      }
    }
  )
}


// const getOne = (req, res) => {
//   req.Models.Inventory.findOne(
//     req.params.inventoryid, (err, result) => {
//       if (err) throw err
//       else {
//         res.json({
//           status: 'success',
//           message: 'Inventory Record',
//           result
//         })
//       }
//     }
//   )
// }

const getAll = (req, res) => {
  req.Models.Inventory.find(
    {}, (err, inventoryInfo) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Our Inventory',
          data: inventoryInfo
        })
      }
    }
  )
}

//Search API
const buyerSearch = async (req, res) => {
  try {
    if (!req.query.query) throw new Error('Please type an Item you are looking for')
    const found = await req.Models.Inventory.find({
      $text:
      { $search: req.query.query }
    })
    if (!found) throw new Error('Item not found')
    res.json({
      message: 'success',
      data: found
    })
  } catch (e) {
    res.json({
      message: e.message
    })
  }
}

module.exports = {
  create, del, update, getAll, buyerSearch
}
