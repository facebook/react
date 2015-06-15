console.log(typeof Proxy == 'undefined' ? "No harmony" : "Harmony");
require(__dirname+"/../harmonize.js")();
console.log("OK");
