const _validateCartCreation = async (req) => {
  const errorMessages = []
  const product = await req.Models.Inventory.findById(req.body.product)
  const currentUser = await req.Models.User.findById(req.body.userId).select('cooperative')
  const currentUserCart = await req.Models.Cart.find({ user: req.body.userId })

  /** Confirm that the product is valid for installment if a buyer sets installment. */
  if (product.installmentPeriod === 0 && req.body.installmentPeriod > 0) {
    errorMessages.push('This product doesn\'t support installment')
  }

  /** Make sure a user can't set installment greater than the products requirement */
  if (product.installmentPeriod !== 0
    && (req.body.installmentPeriod > product.installmentPeriod)) {
    errorMessages.push('The installment period cannot be greater than the product installment requirement')
  }

  /**
   * When a user set installment for a product,
   * make sure they can't add more than one quantity for that product.
   */
  if (product.installmentPeriod !== 0
    && req.body.installmentPeriod && req.body.quantity > 1) {
    errorMessages.push('You can\'t add more than one quantity for product with installment')
  }

  /**
   * When a user set installment period for a product make sure that
   * user has a cooperative before adding the item to cart
   */
  if (product.installmentPeriod !== 0
    && req.body.installmentPeriod > 1 && !currentUser.cooperative) {
    errorMessages.push('You must belong to a cooperative before you can purchase a product on installment')
  }

  /**
   * If a user already have an item with installment payment in their cart
   * make sure they can't add new items with installment.
   */
  if (currentUserCart.length && req.body.installmentPeriod > 1) {
    if (currentUserCart.some(cartItem => cartItem.installmentPeriod > 0)) {
      errorMessages.push('You already have an item with installment in your cart')
    }
  }

  /**
   * Here we check if the buyer is adding a new installment product
   * which he already added to the cart and wants to by on installment again
   *
   * Although the product might have installment enabled, buyers should be able
   * to buy multiple quantity long as they are not paying on installment
   */
  const previousItem = currentUserCart.filter(cartItem => cartItem.product.equals(req.body.product))
  if (previousItem.length
    && product.installmentPeriod && previousItem[previousItem.length - 1].installmentPeriod) {
    errorMessages.push('You already have this installment item in your cart, you can\'t add more quantity')
  }

  return !errorMessages.length
    ? Promise.resolve({ product, currentUserCart }) : Promise.reject(errorMessages)
}
const create = (req, res) => {
  _validateCartCreation(req)
    .then((records) => {
      const { product, currentUserCart } = records
      const subTotal = product.price * req.body.quantity

      if (req.body.installmentPeriod > 1) {
        // TODO:: make installmentPercentage dynamic i.e create a route for updating the value
        req.body.installmentPercentage = 10
      }
      /**
       * lets's check if the product already exist in cart,
       * then increase the quantity instead of creating a new record
       * */
      const itemInCart = currentUserCart
        .filter(cartItem => cartItem.product.equals(req.body.product))
      if (itemInCart.length) {
        // If the product already exist increase the quantity and recalculate subtotal
        req.Models.Cart.findOne({ user: req.body.userId, product: req.body.product },
          (err, cartItem) => {
            if (err) throw err
            else {
              cartItem.quantity += parseInt(req.body.quantity)
              cartItem.subTotal += subTotal
              cartItem.save((error) => {
                if (error) throw error
                else {
                  return res.send({
                    success: true,
                    message: 'Created Successfully',
                    data: cartItem
                  }).status(200)
                }
              })
            }
          })
      } else {
        const installmentPrice = req.body.installmentPeriod * product.price
        req.Models.Cart.create({
          product: req.body.product,
          user: req.body.userId,
          quantity: req.body.quantity,
          installmentPeriod: req.body.installmentPeriod,
          installmentPercentage: req.body.installmentPercentage,
          unitPrice: product.price,
          subTotal,
          installmentTotal: req.body.installmentPeriod > 1
            ? subTotal + installmentPrice / 100 * req.body.installmentPercentage : 0,
        }, (err, result) => {
          if (err) {
            throw err
          } else {
            res.send({
              success: true,
              message: 'Created Successfully',
              data: result
            })
              .status(201)
          }
        })
      }
    })
    .catch((errors) => {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: {
            errors: {
              product: errors
            }
          }
        })
    })
}
const get = (req, res) => {
  const filter = { user: req.body.userId }
  const model = req.Models.Cart.find(filter)
  model.populate({
    path: 'product',
    populate: { path: 'category' }
  })
  model.populate('user', 'firstName lastName email')
  model.exec((err, results) => {
    let totalQuantities = 0
    let subTotal = 0
    if (results.length) {
      for (let i = 0; i <= results.length; i += 1) {
        if (results[i]) {
          totalQuantities += results[i].quantity
          subTotal += results[i].subTotal
        }
      }
    }
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching cart',
        data: {
          totalProduct: results.length,
          totalQuantities,
          subTotal,
          results
        }
      })
    }
  })
}

const destroy = (req, res) => {
  req.Models.Cart.findByIdAndDelete(
    req.params.cart, (err, cart) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: cart
        })
      }
    }
  )
}

module.exports = {
  create,
  get,
  destroy
}
