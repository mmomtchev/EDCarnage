const journal = require('./src/journal');
const util = require('util');

const data = journal('Journal.220123213548.01.log');
console.log(util.inspect(data, false, 4, true));
