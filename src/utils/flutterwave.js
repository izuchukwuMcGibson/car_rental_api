const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.PUBLIC_KEY, process.env.SECRET_KEY);

module.exports = { flw };
