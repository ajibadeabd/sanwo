const multer = require('multer')

const create = (req, res) => {
  console.log(req.file)
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
    req.params.InventoryId, (err, inventoryInfo) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Deleted successfully',
          data: inventoryInfo
        })
      }
    }
  )
}

const update = (req, res) => {
  req.Models.Inventory.findByIdAndUpdate(
    req.params.InventoryId, (err, inventoryInfo) => {
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


const getOne = (req, res) => {
  req.Models.Inventory.findOne(
    req.params.InventoryId, (err, result) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Inventory Record',
          result
        })
      }
    }
  )
}

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

module.exports = {
  create, del, update, getOne, getAll
}