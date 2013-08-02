#!/usr/bin/env node

/* Source: https://gist.github.com/706182/96328c1871d829788b66012f0fb4f6519b896a12 */

/* Serve files out of a specific directory and its subdirectories.
 *
 * $ cd test-project
 * $ ls
 * README
 * $ cat README
 * Hello World.
 * $ serve # start the server
 *
 * # elsewhere, hit the server (or in the browser)
 * $ curl http://localhost:9090/README
 * Hello World.
 */

var http = require('http'),
  sys = require('sys'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');

var contentTypeMap = {
  txt: 'text/plain',
  html: 'text/html',
  xml: 'application/xml',
  jpg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  gif: 'image/gif',
  js: 'text/javascript'
};

module.exports.startServer = startServer = function() {
  http.createServer(function(request, response) {
    function write(code, body, headers) {
      if (!headers) headers = {};
      if (!headers['Content-Type']) headers['Content-Type'] = contentTypeMap.txt;

      response.writeHead(code, headers);
      response.end(body);

      sys.print(request.method+' '+request.url+' '+code+' '+(body||'').length+'\n');
    }

    try {
      var pathname = url.parse(request.url).pathname.substring(1);

      if (pathname.indexOf('..') != -1) {
        write(404, "cannot ask for files with .. in the name\n");
        return;
      }

      path.exists(pathname, function(exists) {
        if (!exists) {
          write(404, "cannot find that file\n");
          return;
        }

        fs.stat(pathname, function(err, stats) {
          if (err) {
            write(400, "unable to read file information: "+err+"\n");
            return;
          }

          fs.readFile(pathname, function(err, data) {
            if (err) {
              write(400, "unable to read file: "+err+"\n");
              return;
            }

            write(200, data, {'Content-Type': contentTypeMap[path.extname(pathname).substring(1).toLowerCase()]});
          });
        });
      });
    } catch (e) {
      write(500, e.toString());
    }
  }).listen(9090);
}
