const Sample = require('./sampleModel')
const Inventory = require('./inventoryModel')
const Order = require('./orderModel')
const Gift = require('./giftCardModel')
const User = require('./userModel')
const Message = require('./messageModel')
const Category = require('./categoryModel')
const WishList = require('./wishListModel')
const cart = require('./cartModel')
const Payment = require('./paymentModel')
const AddressBook = require('./addressBookModel')


module.exports = {
  Sample,
  Inventory,
  Order,
  Gift,
  User,
  Message,
  Category,
  WishList,
  Cart: cart.Model,
  Payment,
  AddressBook
}
