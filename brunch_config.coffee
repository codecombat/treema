# This is the Brunch config, for compiling jade and coffeescript into javascript, sass into css
exports.config =
  # See https://github.com/brunch/brunch/blob/master/docs/config.md
  server:
    path: 'test/test_server.js'
  paths:
    'public': './'
    watched: ['app', 'test']
  files:
    javascripts:
      defaultExtension: 'coffee'
      joinTo:
        'treema.js': /^app/
        'test/treema.js': /^app/
    stylesheets:
      defaultExtension: 'sass'
      joinTo:
        'treema.css': /^app/
    templates:
      defaultExtension: 'jade'
      joinTo:
        'treema.js': /^app/
        'test/treema.js': /^app/

  plugins:
    coffeelint:
      pattern: /^app\/.*\.coffee$/
      options:
        line_endings:
          value: "unix"
          level: "error"
        max_line_length:
          level: "ignore"
        no_trailing_whitespace:
          level: "ignore"  # PyCharm can't just autostrip for .coffee, needed for .jade
    # https://gist.github.com/toolmantim/4958966
    uglify:
      output:
        beautify: true
        indent_level: 0

  modules:
    wrapper: false
    definition: false