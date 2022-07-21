const { query } = require('express');
const Product = require('../models/product');

const getAllProductsStatic = async (req, res) => {
	const search = 'a';
	const products = await Product.find({ price: { $gt: 30 } })
		.sort('price')
		.select('name price');
	// .limit(10)
	// .skip(5);
	res.status(200).json({ products, nbHits: products.length });
};
const getAllProducts = async (req, res) => {
	// fields is my/tutorial's own name for the select
	// likewise numericFilters is own name
	const { featured, company, name, sort, fields, numericFilters } = req.query;
	const queryObject = {};
	if (featured) {
		// if featured is true, set featured property to true, otherwise, set it to false
		queryObject.featured = featured === 'true' ? true : false;
	}
	if (company) {
		queryObject.company = company;
	}
	if (name) {
		// regex means it searches for the pattern rather than tryin to match the entire string
		// options: i = case insensitive
		queryObject.name = { $regex: name, $options: 'i' };
	}
	if (numericFilters) {
		const operatorMap = {
			'>': '$gt',
			'>=': '$gte',
			'=': '$eq',
			'<': '$lt',
			'<=': '$lte',
		};
		const regEx = /\b(<|>|>=|=|<|<=)\b/g;
		let filters = numericFilters.replace(
			regEx,
			(match) => `-${operatorMap[match]}-`
		);
		// console.log(filters);
		const options = ['price', 'rating'];
		filters = filters.split(',').forEach((item) => {
			const [field, operator, value] = item.split('-');
			if (options.includes(field)) {
				queryObject[field] = { [operator]: Number(value) };
			}
		});
	}
	console.log(queryObject);
	let result = Product.find(queryObject);
	if (sort) {
		// console.log(sort);
		// changes comma separated string to a space separated string
		const sortList = sort.split(',').join(' ');
		result = result.sort(sortList);
		// result = result.sort();
	} else {
		result = result.sort('createdAt');
	}
	if (fields) {
		const fieldsList = fields.split(',').join(' ');
		result = result.select(fieldsList);
	}

	// if the user doesn't pass in a page value, default to 1
	const page = Number(req.query.page) || 1;
	// if the user doesn't pass in a limit value, default to 10
	const limit = Number(req.query.limit) || 10;

	const skip = (page - 1) * limit;

	result = result.skip(skip).limit(limit);
	// 23 products
	// 23/7(limit) = 4pages = 7 7 7 2

	const products = await result;
	res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
	getAllProducts,
	getAllProductsStatic,
};
