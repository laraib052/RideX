const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// mongoSanitize  — NoSQL injection rokta hai
//   e.g. { "$gt": "" } jaise queries block hoti hain
// xss            — HTML tags ko strip karta hai input se
//   e.g. <script>alert(1)</script> → safe string
// hpp            — duplicate query params attack rokta hai

module.exports = { mongoSanitize, xss, hpp };