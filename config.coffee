# This is the Brunch config, for compiling jade and coffeescript into javascript, sass into css
exports.config =
  # See https://github.com/brunch/brunch/blob/master/docs/config.md
  server:
    path: 'dev/server.js'
  paths:
    'public': './'
    watched: ['src', 'test']
  files:
    javascripts:
      defaultExtension: 'coffee'
      joinTo:
        'treema.js': /^src/
        'dev/js/treema.js': /^src/
        'dev/js/treema.spec.js': /^test/
        'treema-utils.js': /^src\/utils/
      order:
        before: [
          'src/node.coffee',
          'test/common.coffee',
        ]
    stylesheets:
      defaultExtension: 'sass'
      joinTo:
        'treema.css': /^src/
        'dev/css/treema.css': /^src/

  plugins:
    coffeelint:
      pattern: /^src\/.*\.coffee$/
      options:
        line_endings:
          value: "unix"
          level: "error"
        max_line_length:
          level: "ignore"
        no_trailing_whitespace:
          level: "ignore"
    # https://gist.github.com/toolmantim/4958966
    uglify:
      output:
        beautify: true
        indent_level: 0

  modules:
    wrapper: false
    definition: false