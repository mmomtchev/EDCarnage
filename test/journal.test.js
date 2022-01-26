const fs = require('fs');
const path = require('path');
const { assert } = require('chai');

const parse = require('../src/journal.js');

describe('journal parsing', () => {
    const tests = fs.readdirSync(__dirname).filter((t) => t.match(/^test[0-9]+$/));
    for (const t of tests)
        it(t, () => {
            const result = parse(path.join(__dirname, t), true);
            const expected = JSON.parse(fs.readFileSync(path.join(__dirname, `${t}.json`)));
            assert.deepEqual(result, expected);
        });
});
