const helpers = require('./../functions/mailhelpers')


const create = (req, res) => {
  req.Models.Order.create({
    orderDate: req.body.orderDate,
    orderStatus: req.body.orderStatus,
    trackOrder: req.body.trackOrder,
    quantity: req.body.quantity,
    orderPrice: req.body.orderPrice * req.body.quantity,
    product: req.body.product,
    instNumber: req.body.orderPrice * req.body.quantity / req.body.instNumber
  }, (err, result) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Order Created Successfully',
        data: result
      }).status(201)
      helpers.sendOrderMail(result, req)
    }
  })
}

const getOrder = (req, res) => {
  req.Models.Order.find({}, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'All orders',
        data: orderInfo
      })
    }
  }).sort({ orderDate: -1 })
}

const putorder = (req, res) => {
  req.Models.Order.findByIdAndUpdate(
    req.params.orderid, (err, orderInfo) => {
      if (err) throw new Error('Update Failed')
      else {
        res.json({
          status: 'success',
          message: 'Update successful',
          data: orderInfo
        })
      }
    }
  )
}

const getDisbursedStock = (req, res) => {
  req.Models.Order.find({
    $and: [{ orderStatus: 'Shipped' },
      // { orderPrice: req.body.orderPrice * req.body.quantity }
    ]
  }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Disbursed Stock and Price',
        data: orderInfo
      })
    }
  })
}

const purchasedStock = (req, res) => {
  req.Models.Order.find({
    $and: [{ orderStatus: 'Awaiting' },
      // { orderPrice: req.body.orderPrice * req.body.quantity }
    ]
  }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Purchased Stock',
        data: orderInfo
      })
    }
  })
}

// Brings out the list of orders shipped but not delivered
const inProcess = (req, res) => {
  req.Models.Order.find({
    $and: [{ orderStatus: 'Shipped' },
      { trackOrder: 'Not Delivered' }
    ]
  }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Orders In Process',
        data: orderInfo
      })
    }
  })
}

// List of the shipped stock
const shipped = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }] }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Shipped Stock',
        data: orderInfo
      })
    }
  })
}

const del = (req, res) => {
  req.Models.Order.findByIdAndDelete(
    req.params.orderid, (err, orderInfo) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Deleted successfully',
          data: orderInfo
        })
      }
    }
  )
}

const shippedItem = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }, { trackOrder: 'Delivered' }] }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Transaction Complete',
        data: orderInfo
      }).status(201)
    }
  })
}


module.exports = {
  create,
  getOrder,
  getDisbursedStock,
  putorder,
  purchasedStock,
  inProcess,
  shipped,
  del,
  shippedItem
}