/* Source: http://stackoverflow.com/questions/10434001/static-files-with-express-js */

module.exports.startServer = startServer = function() {
  var express = require('express');
  var app = express();
  var path = require('path');
  app.use(express.static(__dirname)); // Current directory is root
  //app.use(express.static(path.join(__dirname, 'test'))); //  "public" off of current is root
  
  app.listen(9090);
  console.log('Listening on port 9090');
  return app;
};
