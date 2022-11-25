const express = require('express');

module.exports = function (app) {
  // Use static middleware
  app.use(express.static('./dist'));
}