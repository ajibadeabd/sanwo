const bcrypt = require("bcrypt");

const utils = require("../../utils/helper-functions");
const { constants } = require("../../utils/helpers");
const userService = require("../services/user.service");
const notificationEvents = require("../../utils/notificationEvents");

const updateAccountStatus = async (req, res) => {
  try {
    const user = await userService.update(req.params.userId, {
      status: req.body.status
    });
    // TODO notify use of account status change
    return res.send({
      success: true,
      message: "Account status updated",
      data: user
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const AddItemToHero = async (req, res) => {
  try {
    var app = await req.Models.App.findOne({ page: "landing" });
    if (!app) {
      app = new req.Models.App({
        page: "landing",
        heroes: [],
        featuredItems: []
      });
    }
    app.heroes.push({
      imageUrl: req.body.imageUrl,
      title: req.body.title,
      subTitle: req.body.subTitle,
      action: req.body.action,
      link: req.body.link
    });
    await app.save();
    app = await req.Models.App.findOne({ page: "landing" }).populate(
      "featuredItems.product"
    );
    res.send({
      success: true,
      message: "Successfully created item on the hero",
      data: app
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const fetchLandingData = async (req, res) => {
  try {
    var app = await req.Models.App.findOne({ page: "landing" }).populate(
      "featuredItems.product"
    );
    if (!app) {
      app = new req.Models.App({
        page: "landing",
        heroes: [],
        featuredItems: []
      });
      app.save();
    }

    res.send({
      success: true,
      message: "Successfully Items for the landing page",
      data: app
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const RemoveItemFromHero = async (req, res) => {
  try {
    var app = await req.Models.App.findOne({ page: "landing" });
    if (!app) {
      app = new req.Models.App({
        page: "landing",
        heroes: [],
        featuredItems: []
      });
    }
    var temp = app.heroes.filter(e => {
      return e._id.toString() !== req.params.item;
    });
    app.heroes = temp;
    await app.save();
    app = await req.Models.App.findOne({ page: "landing" }).populate(
      "featuredItems.product"
    );
    res.send({
      success: true,
      message: "Successfully removed item on the hero",
      data: app
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const AddItemToFeatured = async (req, res) => {
  try {
    var app = await req.Models.App.findOne({ page: "landing" });
    if (!app) {
      app = new req.Models.App({
        page: "landing",
        heroes: [],
        featuredItems: []
      });
    }
    app.featuredItems.push({
      product: req.body.feature
    });
    await app.save();
    app = await req.Models.App.findOne({ page: "landing" }).populate(
      "featuredItems.product"
    );
    res.send({
      success: true,
      message: "Successfully added item to the featured list",
      data: app
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const RemoveItemFromFeatured = async (req, res) => {
  try {
    var app = await req.Models.App.findOne({ page: "landing" });
    if (!app) {
      app = new req.Models.App({
        page: "landing",
        heroes: [],
        featuredItems: []
      });
    }
    var temp = app.featuredItems.filter(e => {
      return e.product !== req.params.product;
    });
    app.featuredItems = temp;
    await app.save();
    app = await req.Models.App.findOne({ page: "landing" }).populate(
      "featuredItems.product"
    );
    res.send({
      success: true,
      message: "Successfully removed item from the featured list",
      data: app
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const getUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    let filter = utils.queryFilters(req);
    // check if filter includes name query
    if (Object.keys(filter).includes("name")) {
      const { name } = filter;
      const query = { $regex: name, $options: "i" };
      filter = { ...filter, $or: [{ firstName: query }, { lastName: query }] };
      delete filter.name;
    }

    const { results, resultCount } = await userService.get(
      filter,
      offset,
      limit
    );
    res.send({
      success: true,
      message: "Successfully fetching users",
      data: {
        offset,
        limit,
        resultCount,
        results
      }
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const profileUpdate = async (req, res) => {
  try {
    const userExist = await req.Models.User.findOne({ _id: req.body.userId });

    if (!userExist) {
      return res.status(400).send({
        success: false,
        message: "Could not find user",
        data: null
      });
    }

    if (
      req.body.password &&
      !bcrypt.compareSync(req.body.password, userExist.password)
    ) {
      return res.status(400).send({
        success: false,
        message: "Old password is incorrect",
        data: null
      });
    }

    if (req.body && req.body.firstName) {
      userExist.name = `${req.body.firstName} ${req.body.lastName}`;
      userExist.firstName = req.body.firstName || "";
      userExist.lastName = req.body.lastName || "";
    }

    if (req.body && req.body.password_confirmation) {
      //   userExist.password = await bcrypt.hash(req.body.password, 10)
      userExist.password = req.body.password_confirmation;
    }
    if (req.body && req.body.phone) {
      userExist.phoneNumber = req.body.phone;
    }
    const updatedUser = await userExist.save();
    res.send({
      success: true,
      message: "Updated successfully",
      data: updatedUser,
      token: req.headers["x-access-token"]
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.message,
      data: null
    });
  }
};

const updateInventoryStatus = async (req, res) => {
  const product = await req.Models.Inventory.findById(req.params.product);
  product.status = req.body.status;
  product.save();
  res.send({
    success: true,
    message: "Inventory status updated",
    data: product
  });
  notificationEvents.emit("inventory_status_changed", { product });
};

const getUserStatistics = async (req, res) => {
  const filter = { deletedAt: undefined };
  const sellers = await req.Models.User.countDocuments({
    accountpage: constants.SELLER,
    ...filter
  });

  const buyers = await req.Models.User.countDocuments({
    accountpage: constants.BUYER,
    ...filter
  });

  const cooperatives = await req.Models.User.countDocuments({
    accountpage: constants.CORPORATE_ADMIN,
    ...filter
  });

  const administrators = await req.Models.User.countDocuments({
    accountpage: constants.SUPER_ADMIN,
    ...filter
  });

  return res.send({
    success: true,
    message: "Successfully fetching stats",
    data: {
      sellers,
      buyers,
      cooperatives,
      administrators
    }
  });
};

const deleteAccount = async (req, res) => {
  try {
    await userService.destroy(req.params.userId, req.body.userId);
    return res.send({
      success: true,
      message: "Account deleted successfully",
      data: {}
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const getPendingApprovalOrders = async function(req, res) {
  const model = req.Models.Cart.find({});
  const select = "name firstName lastName email avatar businessName";

  model.populate({
    path: "product",
    populate: { path: "category seller", select }
  });
  model.populate("user", select);
  model.sort({ createdAt: "desc" });
  if (req.query.orderStatus) {
    model.populate({
      path: "approvalRecord",
      match: {
        adminApprovalStatus: req.query.orderStatus,
        corporateAdminApprovalStatus: { $ne: "pending" }
      }
    });
  } else {
    model.populate("approvalRecord");
  }

  // let results = await model;
  model.select("-password");
  model.skip(offset);
  model.limit(limit);
  model.sort({ createdAt: "desc" });
  var results = await model;
  var resultCount = await model.countDocuments(filter);
  results = results.filter(e => {
    return e.approvalRecord !== null;
  });

  res.send({
    success: true,
    message: "Successfully fetching orders",
    data: {
      offset,
      limit,
      resultCount,
      results
    }
  });
};

const approveMemberOrder = async function(req, res) {
  const { token, cart, status } = req.params;

  // toggle approval status of the corporate admin of the user's order
  try {
    var approval = await req.Models.CartApproval.findOne({
      cart: cart,
      adminApprovalToken: token
    });
    if (approval) {
      approval.adminApprovalStatus = status;
      approval.adminApprovalStatusChangeDate = new Date().toISOString();
      approval.adminApprovalStatusChangedBy = req.authData.userId;
      await approval.save();
    }
    return res.send({
      success: true,
      message: "Successfully updated cart approval."
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.message,
      data: null
    });
  }
};

const updateInventory = async (req, res) => {
  try {
    let data = req.body;
    const body = {
      collection: data.c_collection,
      name: data.c_name,
      price: data.c_price,
      quantity: data.c_quantity,
      sizes: data.c_sizes,
      tags: data.c_tags,
      installmentPercentagePerMonth: data.c_installments
    };
    await req.Models.Inventory.update({ _id: req.params.inventoryId }, body);
    return res.send({
      success: true,
      message: "Successfully updated"
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: "Inventory Not Found",
      data: null
    });
  }
};

module.exports = {
  updateAccountStatus,
  getUsers,
  profileUpdate,
  updateInventoryStatus,
  getUserStatistics,
  deleteAccount,
  getPendingApprovalOrders,
  approveMemberOrder,
  updateInventory,
  AddItemToFeatured,
  AddItemToHero,
  RemoveItemFromFeatured,
  RemoveItemFromHero,
  fetchLandingData
};
