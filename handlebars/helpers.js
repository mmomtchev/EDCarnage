function credits (value, options) {
    if (!value) return 0;
    return new Intl.NumberFormat('en-US').format(value) + ' CR';
}

function ifmore (value, options) {
    if (value > 1) return options.fn(this);
    return options.inverse(this);
}

module.exports = {
    credits,
    ifmore
}