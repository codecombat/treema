var TreemaUtils;

TreemaUtils = (function() {
  var utils;
  utils = {};
  utils.populateDefaults = function(rootData, rootSchema, tv4) {
    var _this = this;
    if (rootSchema["default"] && !rootData) {
      rootData = this.cloneDeep(rootSchema["default"]);
    }
    this.walk(rootData, rootSchema, tv4, function(path, data, schema) {
      var def, key, value, _results;
      def = schema["default"];
      if (!(_this.type(def) === 'object' && _this.type(data) === 'object')) {
        return;
      }
      _results = [];
      for (key in def) {
        value = def[key];
        _results.push(data[key] != null ? data[key] : data[key] = _this.cloneDeep(value));
      }
      return _results;
    });
    return rootData;
  };
  utils.populateRequireds = function(rootData, rootSchema, tv4) {
    var _this = this;
    if (rootData == null) {
      rootData = {};
    }
    this.walk(rootData, rootSchema, tv4, function(path, data, schema) {
      var childSchema, key, schemaDefault, type, workingSchema, _i, _len, _ref, _ref1, _results;
      if (!(schema.required && _this.type(data) === 'object')) {
        return;
      }
      _ref = schema.required;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (data[key] != null) {
          continue;
        }
        if (schemaDefault = (_ref1 = schema["default"]) != null ? _ref1[key] : void 0) {
          _results.push(data[key] = _this.cloneDeep(schemaDefault));
        } else {
          childSchema = _this.getChildSchema(key, schema);
          workingSchema = _this.buildWorkingSchemas(childSchema, tv4)[0];
          schemaDefault = workingSchema["default"];
          if (schemaDefault != null) {
            _results.push(data[key] = _this.cloneDeep(schemaDefault));
          } else {
            type = workingSchema.type;
            if (_this.type(type) === 'array') {
              type = type[0];
            }
            if (!type) {
              type = 'string';
            }
            _results.push(data[key] = TreemaNode.defaultForType(type));
          }
        }
      }
      return _results;
    });
    return rootData;
  };
  utils.walk = function(data, schema, tv4, callback, path) {
    var childPath, childSchema, key, value, workingSchema, workingSchemas, _ref, _results;
    if (path == null) {
      path = '';
    }
    if (!tv4) {
      tv4 = this.getGlobalTv4().freshApi();
      tv4.addSchema('#', schema);
      if (schema.id) {
        tv4.addSchema(schema.id, schema);
      }
    }
    workingSchemas = this.buildWorkingSchemas(schema, tv4);
    workingSchema = this.chooseWorkingSchema(data, workingSchemas, tv4);
    callback(path, data, workingSchema);
    if ((_ref = this.type(data)) === 'array' || _ref === 'object') {
      _results = [];
      for (key in data) {
        value = data[key];
        childPath = path.slice();
        if (childPath) {
          childPath += '.';
        }
        childPath += key;
        childSchema = this.getChildSchema(key, workingSchema);
        _results.push(this.walk(value, childSchema, tv4, callback, childPath));
      }
      return _results;
    }
  };
  utils.getChildSchema = function(key, schema) {
    var childKey, childSchema, index, _ref, _ref1;
    if (this.type(key) === 'string') {
      _ref = schema.properties;
      for (childKey in _ref) {
        childSchema = _ref[childKey];
        if (childKey === key) {
          return childSchema;
        }
      }
      _ref1 = schema.patternProperties;
      for (childKey in _ref1) {
        childSchema = _ref1[childKey];
        if (key.match(new RegExp(childKey))) {
          return childSchema;
        }
      }
      if (typeof schema.additionalProperties === 'object') {
        return schema.additionalProperties;
      }
    }
    if (this.type(key) === 'number') {
      index = key;
      if (schema.items) {
        if (Array.isArray(schema.items)) {
          if (index < schema.items.length) {
            return schema.items[index];
          } else if (schema.additionalItems) {
            return schema.additionalItems;
          }
        } else if (schema.items) {
          return schema.items;
        }
      }
    }
    return {};
  };
  utils.buildWorkingSchemas = function(schema, tv4) {
    var allOf, anyOf, baseSchema, newBase, oneOf, singularSchema, singularSchemas, workingSchemas, _i, _j, _len, _len1;
    if (schema == null) {
      schema = {};
    }
    baseSchema = this.resolveReference(schema, tv4);
    if (!(schema.allOf || schema.anyOf || schema.oneOf)) {
      return [schema];
    }
    baseSchema = this.cloneSchema(baseSchema);
    allOf = baseSchema.allOf;
    anyOf = baseSchema.anyOf;
    oneOf = baseSchema.oneOf;
    if (baseSchema.allOf != null) {
      delete baseSchema.allOf;
    }
    if (baseSchema.anyOf != null) {
      delete baseSchema.anyOf;
    }
    if (baseSchema.oneOf != null) {
      delete baseSchema.oneOf;
    }
    if (allOf != null) {
      for (_i = 0, _len = allOf.length; _i < _len; _i++) {
        schema = allOf[_i];
        this.combineSchemas(baseSchema, this.resolveReference(schema, tv4));
      }
    }
    workingSchemas = [];
    singularSchemas = [];
    if (anyOf != null) {
      singularSchemas = singularSchemas.concat(anyOf);
    }
    if (oneOf != null) {
      singularSchemas = singularSchemas.concat(oneOf);
    }
    for (_j = 0, _len1 = singularSchemas.length; _j < _len1; _j++) {
      singularSchema = singularSchemas[_j];
      singularSchema = this.resolveReference(singularSchema, tv4);
      newBase = this.cloneSchema(baseSchema);
      this.combineSchemas(newBase, singularSchema);
      workingSchemas.push(newBase);
    }
    if (workingSchemas.length === 0) {
      workingSchemas = [baseSchema];
    }
    return workingSchemas;
  };
  utils.chooseWorkingSchema = function(data, workingSchemas, tv4) {
    var result, schema, _i, _len;
    if (workingSchemas.length === 1) {
      return workingSchemas[0];
    }
    if (tv4 == null) {
      tv4 = this.getGlobalTv4();
    }
    for (_i = 0, _len = workingSchemas.length; _i < _len; _i++) {
      schema = workingSchemas[_i];
      result = tv4.validateMultiple(data, schema);
      if (result.valid) {
        return schema;
      }
    }
    return workingSchemas[0];
  };
  utils.resolveReference = function(schema, tv4, scrubTitle) {
    var resolved;
    if (scrubTitle == null) {
      scrubTitle = false;
    }
    if (schema.$ref == null) {
      return schema;
    }
    if (tv4 == null) {
      tv4 = this.getGlobalTv4();
    }
    resolved = tv4.getSchema(schema.$ref);
    if (!resolved) {
      console.warn('could not resolve reference', schema.$ref, tv4.getMissingUris());
    }
    if (resolved == null) {
      resolved = {};
    }
    if (scrubTitle && (resolved.title != null)) {
      delete resolved.title;
    }
    return resolved;
  };
  utils.getGlobalTv4 = function() {
    if (typeof window !== 'undefined') {
      return window.tv4;
    }
    if (typeof global !== 'undefined') {
      return global.tv4;
    }
  };
  utils.cloneSchema = function(schema) {
    var clone, key, value;
    clone = {};
    for (key in schema) {
      value = schema[key];
      clone[key] = value;
    }
    return clone;
  };
  utils.combineSchemas = function(schema1, schema2) {
    var key, value;
    for (key in schema2) {
      value = schema2[key];
      schema1[key] = value;
    }
    return schema1;
  };
  utils.cloneDeep = function(data) {
    var clone, key, type, value;
    clone = data;
    type = this.type(data);
    if (type === 'object') {
      clone = {};
    }
    if (type === 'array') {
      clone = [];
    }
    if (type === 'object' || type === 'array') {
      for (key in data) {
        value = data[key];
        clone[key] = this.cloneDeep(value);
      }
    }
    return clone;
  };
  utils.type = (function() {
    var classToType, name, _i, _len, _ref;
    classToType = {};
    _ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function(obj) {
      var strType;
      strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  })();
  utils.defaultForType = function(type) {
    return {
      string: '',
      number: 0,
      "null": null,
      object: {},
      integer: 0,
      boolean: false,
      array: []
    }[type];
  };
  if (typeof TreemaNode !== 'undefined') {
    return TreemaNode.utils = utils;
  } else if (typeof module !== 'undefined' && module.exports) {
    return module.exports = utils;
  } else {
    return utils;
  }
})();
;
//# sourceMappingURL=treema-utils.js.map