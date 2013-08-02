var Treema;

Treema = (function() {
  Treema.prototype.schema = {};

  Treema.prototype.lastOutput = null;

  function Treema(options) {
    this.schema = options.schema;
    this.data = options.data;
    this.options = options.options || {};
  }

  Treema.prototype.isValid = function() {
    return false;
  };

  Treema.prototype.getErrors = function() {
    return [];
  };

  Treema.prototype.build = function() {
    return $('<div></div>');
  };

  Treema.prototype.getData = function() {
    return this.data;
  };

  return Treema;

})();

