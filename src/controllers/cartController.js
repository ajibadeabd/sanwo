const _validateCartCreation = async (req) => {
  const errorMessages = []
  const product = await req.Models.Inventory.findById(req.body.product)
  const currentUser = await req.Models.User.findById(req.body.userId).select('cooperative')
  const currentUserCart = await req.Models.Cart.find({ user: req.body.userId })
  const productInstallmentMaxPeriod = product.installmentPercentagePerMonth
    ? product.installmentPercentagePerMonth.length : 0

  /** Confirm that the product is valid for installment if a buyer sets installment. */
  if (productInstallmentMaxPeriod === 0 && req.body.installmentPeriod > 0) {
    errorMessages.push('This product doesn\'t support installment')
  }

  /** Make sure a user can't set installment greater than the products requirement */
  if (productInstallmentMaxPeriod !== 0
    && (req.body.installmentPeriod - 1 > productInstallmentMaxPeriod)) {
    errorMessages.push('The installment period cannot be greater than the product installment requirement')
  }

  /**
   * When a user set installment for a product,
   * make sure they can't add more than one quantity for that product.
   */
  if (productInstallmentMaxPeriod !== 0
    && req.body.installmentPeriod && req.body.quantity > 1) {
    errorMessages.push('You can\'t add more than one quantity for product with installment')
  }

  /**
   * When a user set installment period for a product make sure that
   * user has a cooperative before adding the item to cart
   */
  if (productInstallmentMaxPeriod !== 0
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
    && productInstallmentMaxPeriod && previousItem[previousItem.length - 1].installmentPeriod) {
    errorMessages.push('You already have this installment item in your cart, you can\'t add more quantity')
  }

  /**
   * assert that a user can't request quantity greater than product's quantity
   */
  if (req.body.quantity > product.quantity) {
    errorMessages.push('The quantity you\'re requesting exceeds available quantity')
  }

  return !errorMessages.length
    ? Promise.resolve({ product, currentUserCart }) : Promise.reject(errorMessages)
}
const create = (req, res) => {
  _validateCartCreation(req)
    .then(({ product, currentUserCart }) => {
      const subTotal = product.price * req.body.quantity

      if (req.body.installmentPeriod && req.body.installmentPeriod > 1) {
        // If the installment period set is 2 months take the value of the first index
        /** our count start from 2 months,
         * i.e percentage value on index 0 of the percentage array is for 2months
         * */
        req.body.installmentPercentage = product
          .installmentPercentagePerMonth[req.body.installmentPeriod - 2]
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
              cartItem.quantity += parseInt(req.body.quantity, 10)
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
        const installmentInterest = product.price / 100 * req.body.installmentPercentage
        req.Models.Cart.create({
          product: req.body.product,
          user: req.body.userId,
          quantity: req.body.quantity,
          installmentPeriod: req.body.installmentPeriod || undefined,
          installmentPercentage: req.body.installmentPercentage,
          unitPrice: product.price,
          subTotal,
          installmentInterest: installmentInterest || undefined,
          installmentTotalRepayment: req.body.installmentPeriod > 1
            ? installmentInterest + product.price : undefined,
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

const reduceCartQuantity = (req, res) => {
  const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }
  // A user can't decrement an item that has one quantity
  req.Models.Cart.findOne({ _id: req.params.cart, user: req.body.userId })
    .exec((err, cartItem) => {
      if (err) throw err
      if (!cartItem) {
        responsePayload.data.errors.cart = ['The cart item you\'re trying to update does not belong to you']
        return res.status(400).send(responsePayload)
      }

      if (cartItem.quantity === 1) {
        responsePayload.data.errors.cart = ['You can\'t reduce a cart item with 1 quantity']
        return res.status(400).send(responsePayload)
      }

      if (req.body.quantity > cartItem.quantity) {
        responsePayload.data.errors.cart = ['Quantity exceed current cart quantity']
        return res.status(400).send(responsePayload)
      }

      cartItem.quantity -= req.body.quantity
      cartItem.subTotal -= cartItem.unitPrice * req.body.quantity
      cartItem.save((error) => {
        if (error) throw error
        return res.send({
          success: true,
          message: 'Updated Successfully',
          data: cartItem
        }).status(200)
      })
    })
}

const get = (req, res) => {
  const filter = { user: req.body.userId }
  const model = req.Models.Cart.find(filter)
  const select = 'name firstName lastName email avatar businessName'
  model.populate({
    path: 'product',
    populate: { path: 'category seller', select }
  })
  model.populate('user', select)
  model.exec((err, results) => {
    let totalQuantities = 0
    let subTotal = 0
    let installmentTotalRepayment = 0
    if (results.length) {
      for (let i = 0; i <= results.length; i += 1) {
        if (results[i]) {
          totalQuantities += !results[i].installmentPeriod ? results[i].quantity : 0
          subTotal += !results[i].installmentPeriod ? results[i].subTotal : 0
          installmentTotalRepayment += results[i].installmentPeriod > 0
            ? results[i].installmentTotalRepayment : 0
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
          installmentTotalRepayment,
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
  destroy,
  reduceCartQuantity
}
