const journal = require('./src/journal');
const util = require('util');

const data = journal();
console.log(util.inspect(data, false, 6, true));
