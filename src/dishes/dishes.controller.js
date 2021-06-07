const { resolve } = require("path");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function namePropertyInBody(req, res, next) {
  //name property is in body
  const {
    data: { name },
  } = req.body;
  if (name) {
    res.locals.name = name;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name",
  });
}
function descriptionPropertyInBody(req, res, next) {
  //description property is in body
  const {
    data: { description },
  } = req.body;
  if (description) {
    res.locals.description = description;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description",
  });
}

function pricePropertyInBody(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (price <= 0 || typeof price != "number") {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  if (price) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a price",
  });
}

function imageUrlPropertyInBody(req, res, next) {
  const {
    data: { image_url },
  } = req.body;
  if (image_url) {
    res.locals.imageUrl = image_url;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a image_url",
  });
}

function create(req, res) {
  const newDish = {
    id: nextId(),
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.imageUrl,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}
function list(req, res) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dishId = dishId;
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.dish });
}
function update(req, res, next) {
  const {
    data: { id },
  } = req.body;

  if (
    id === "" ||
    id === undefined ||
    id === res.locals.dishId ||
    id === null
  ) {
    const updatedDish = {
      id: res.locals.dishId,
      name: res.locals.name,
      description: res.locals.description,
      price: res.locals.price,
      image_url: res.locals.imageUrl,
    };

    res.status(200).json({ data: updatedDish });
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dishId}`,
  });
}

module.exports = {
  create: [
    namePropertyInBody,
    descriptionPropertyInBody,
    pricePropertyInBody,
    imageUrlPropertyInBody,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    namePropertyInBody,
    descriptionPropertyInBody,
    pricePropertyInBody,
    imageUrlPropertyInBody,
    update,
  ],
};
