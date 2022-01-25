const journal = require('../src/journal');
const util = require('util');

const data = journal(process.argv[2]);
console.log(JSON.stringify(data));
