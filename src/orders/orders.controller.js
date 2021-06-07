const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
function deliverToPropertyInBody(req, res, next) {
  //deliverTo property is in body
  const {
    data: { deliverTo },
  } = req.body;
  if (deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({ status: 400, message: "Order must include a deliverTo" });
}
function mobileNumberPropertyInBody(req, res, next) {
  //mobileNumber property is in body
  const {
    data: { mobileNumber },
  } = req.body;
  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" });
}

function dishesPropertyInBody(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  if (!dishes)
    return next({ status: 400, message: "Order must include a dish" });
  if (dishes.length && typeof dishes === "object") {
    res.locals.dishes = dishes;
    return next();
  }
  next({ status: 400, message: "Order must include at least one dish" });
}
function dishQuantityPropertyInBody(req, res, next) {
  const dishes = res.locals.dishes;
  for (let i = 0; i < dishes.length; i++) {
    if (dishes[i].quantity <= 0 || typeof dishes[i].quantity != "number") {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}
function statusPropertyInBody(req, res, next) {
  const {
    data: { status },
  } = req.body;
  if (validStatus.includes(status)) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}
function create(req, res) {
  const newOrder = {
    id: nextId(),
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status: "pending",
    dishes: res.locals.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
function list(req, res) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.orderId = orderId;
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist: ${orderId}` });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}
function update(req, res, next) {
  const {
    data: { id },
  } = req.body;
  if (res.locals.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  if (
    id === "" ||
    id === null ||
    id === res.locals.orderId ||
    id === undefined
  ) {
    const updatedOrder = {
      id: res.locals.orderId,
      deliverTo: res.locals.deliverTo,
      mobileNumber: res.locals.mobileNumber,
      status: res.locals.status,
      dishes: res.locals.dishes,
    };
    res.status(200).json({ data: updatedOrder });
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.orderId}`,
  });
}

function destroy(req, res, next) {
  const foundOrder = res.locals.order;
  const status = foundOrder.status;
  if (status === "pending") {
    const orderId = res.locals.orderId;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
  }
  next({
    status: 400,
    message: " An order cannot be deleted unless it is pending",
  });
}

module.exports = {
  create: [
    deliverToPropertyInBody,
    mobileNumberPropertyInBody,
    dishesPropertyInBody,
    dishQuantityPropertyInBody,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    deliverToPropertyInBody,
    mobileNumberPropertyInBody,
    dishesPropertyInBody,
    statusPropertyInBody,
    dishQuantityPropertyInBody,
    update,
  ],
  destroy: [orderExists, destroy],
};
