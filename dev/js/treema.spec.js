var keyDown;

keyDown = function($el, which) {
  var event;
  event = jQuery.Event("keydown");
  event.which = which;
  return $el.trigger(event);
};
;(function() {
  var addressTreema, data, downArrowPress, expectOneSelected, leftArrowPress, nameTreema, phoneTreema, rightArrowPress, schema, treema, upArrowPress;
  leftArrowPress = function($el) {
    return keyDown($el, 37);
  };
  upArrowPress = function($el) {
    return keyDown($el, 38);
  };
  rightArrowPress = function($el) {
    return keyDown($el, 39);
  };
  downArrowPress = function($el) {
    return keyDown($el, 40);
  };
  expectOneSelected = function(t) {
    var selected;
    selected = treema.getSelectedTreemas();
    expect(selected.length).toBe(1);
    expect(t).toBeDefined();
    if (t && selected.length === 1) {
      return expect(selected[0].$el[0]).toBe(t.$el[0]);
    }
  };
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      numbers: {
        type: 'array',
        items: {
          type: ['string', 'array']
        }
      },
      address: {
        type: 'string'
      }
    }
  };
  data = {
    name: 'Bob',
    numbers: ['401-401-1337', ['123-456-7890']],
    'address': 'Mars'
  };
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  treema.build();
  nameTreema = treema.childrenTreemas.name;
  phoneTreema = treema.childrenTreemas.numbers;
  addressTreema = treema.childrenTreemas.address;
  beforeEach(function() {
    treema.deselectAll();
    return phoneTreema.close();
  });
  describe('Down arrow key press', function() {
    it('selects the top row if nothing is selected', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      downArrowPress(treema.$el);
      return expect(nameTreema.isSelected()).toBeTruthy();
    });
    it('skips past closed collections', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      downArrowPress(treema.$el);
      expectOneSelected(nameTreema);
      downArrowPress(treema.$el);
      expectOneSelected(phoneTreema);
      downArrowPress(treema.$el);
      return expectOneSelected(addressTreema);
    });
    it('traverses open collections', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      phoneTreema.open();
      downArrowPress(treema.$el);
      expectOneSelected(nameTreema);
      downArrowPress(treema.$el);
      expectOneSelected(phoneTreema);
      downArrowPress(treema.$el);
      return expectOneSelected(phoneTreema.childrenTreemas[0]);
    });
    return it('does nothing if the last treema is selected', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      addressTreema.select();
      expectOneSelected(addressTreema);
      downArrowPress(treema.$el);
      return expectOneSelected(nameTreema);
    });
  });
  describe('Up arrow key press', function() {
    it('selects the bottom row if nothing is selected', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      upArrowPress(treema.$el);
      return expect(addressTreema.isSelected()).toBeTruthy();
    });
    it('skips past closed collections', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      upArrowPress(treema.$el);
      expectOneSelected(addressTreema);
      upArrowPress(treema.$el);
      expectOneSelected(phoneTreema);
      upArrowPress(treema.$el);
      return expectOneSelected(nameTreema);
    });
    it('traverses open collections', function() {
      expect(treema.getSelectedTreemas().length).toBe(0);
      phoneTreema.open();
      upArrowPress(treema.$el);
      expectOneSelected(addressTreema);
      upArrowPress(treema.$el);
      expectOneSelected(phoneTreema.childrenTreemas[1]);
      upArrowPress(treema.$el);
      expectOneSelected(phoneTreema.childrenTreemas[0]);
      upArrowPress(treema.$el);
      expectOneSelected(phoneTreema);
      upArrowPress(treema.$el);
      return expectOneSelected(nameTreema);
    });
    return it('wraps around if the first treema is selected', function() {
      nameTreema.select();
      expectOneSelected(nameTreema);
      upArrowPress(treema.$el);
      return expectOneSelected(addressTreema);
    });
  });
  describe('Right arrow key press', function() {
    it('does nothing if the selected row isn\'t a collection', function() {
      nameTreema.select();
      expectOneSelected(nameTreema);
      rightArrowPress(treema.$el);
      return expectOneSelected(nameTreema);
    });
    return it('opens a collection if a collection is selected', function() {
      expect(phoneTreema.isClosed()).toBeTruthy();
      phoneTreema.select();
      rightArrowPress(treema.$el);
      expect(phoneTreema.isOpen()).toBeTruthy();
      return expectOneSelected(phoneTreema);
    });
  });
  return describe('Left arrow key press', function() {
    it('closes an open, selected collection', function() {
      phoneTreema.open();
      phoneTreema.select();
      leftArrowPress(treema.$el);
      expect(phoneTreema.isClosed()).toBeTruthy();
      return expectOneSelected(phoneTreema);
    });
    it('closes the selection if it can be closed, otherwise moves the selection up a level', function() {
      phoneTreema.open();
      phoneTreema.childrenTreemas[0].select();
      leftArrowPress(treema.$el);
      expect(phoneTreema.isOpen()).toBeTruthy();
      expectOneSelected(phoneTreema);
      leftArrowPress(treema.$el);
      expect(phoneTreema.isClosed()).toBeTruthy();
      return expectOneSelected(phoneTreema);
    });
    return it('affects one collection at a time, deepest first', function() {
      phoneTreema.open();
      phoneTreema.childrenTreemas[1].open();
      phoneTreema.childrenTreemas[1].childrenTreemas[0].select();
      leftArrowPress(treema.$el);
      expect(phoneTreema.childrenTreemas[1].isOpen()).toBeTruthy();
      expect(phoneTreema.isOpen()).toBeTruthy();
      expectOneSelected(phoneTreema.childrenTreemas[1]);
      leftArrowPress(treema.$el);
      expect(phoneTreema.childrenTreemas[1].isClosed()).toBeTruthy();
      expect(phoneTreema.isOpen()).toBeTruthy();
      expectOneSelected(phoneTreema.childrenTreemas[1]);
      leftArrowPress(treema.$el);
      expect(phoneTreema.isOpen()).toBeTruthy();
      expectOneSelected(phoneTreema);
      leftArrowPress(treema.$el);
      expect(phoneTreema.isClosed()).toBeTruthy();
      return expectOneSelected(phoneTreema);
    });
  });
})();
;describe('Delete key press', function() {
  var addressTreema, deleteKeyPress, expectOneSelected, nameTreema, original_data, phoneTreema, rebuild, schema, treema;
  deleteKeyPress = function($el) {
    return keyDown($el, 8);
  };
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      numbers: {
        type: 'array',
        items: {
          type: ['string', 'array']
        }
      },
      address: {
        type: 'string'
      }
    }
  };
  original_data = {
    name: 'Bob',
    numbers: ['401-401-1337', ['123-456-7890']],
    'address': 'Mars'
  };
  treema = nameTreema = addressTreema = phoneTreema = null;
  rebuild = function() {
    var copy;
    copy = $.extend(true, {}, original_data);
    treema = TreemaNode.make(null, {
      data: copy,
      schema: schema
    });
    treema.build();
    nameTreema = treema.childrenTreemas.name;
    addressTreema = treema.childrenTreemas.address;
    return phoneTreema = treema.childrenTreemas.numbers;
  };
  expectOneSelected = function(t) {
    var selected;
    selected = treema.getSelectedTreemas();
    expect(selected.length).toBe(1);
    return expect(selected[0]).toBe(t);
  };
  beforeEach(function() {
    return rebuild();
  });
  it('does nothing when nothing is selected', function() {
    deleteKeyPress(treema.$el);
    expect(treema.data.name).toBe(original_data.name);
    return expect(treema.data.address).toBe(original_data.address);
  });
  it('removes a selected row', function() {
    nameTreema.select();
    deleteKeyPress(treema.$el);
    expect(treema.data.name).toBeUndefined();
    expect(treema.childrenTreemas.name).toBeUndefined();
    return expect(treema.childrenTreemas.address).toBeTruthy();
  });
  it('removes all selected rows', function() {
    nameTreema.select();
    addressTreema.toggleSelect();
    deleteKeyPress(treema.$el);
    expect(treema.data.name).toBeUndefined();
    expect(treema.data.address).toBeUndefined();
    expect(treema.childrenTreemas.name).toBeUndefined();
    return expect(treema.childrenTreemas.address).toBeUndefined();
  });
  it('removes single elements of a collection one at a time, then the collection itself', function() {
    phoneTreema.open();
    phoneTreema.childrenTreemas[1].open();
    phoneTreema.childrenTreemas[0].select();
    expect(treema.data.numbers.length).toBe(2);
    deleteKeyPress(treema.$el);
    expect(treema.data.numbers.length).toBe(1);
    expectOneSelected(phoneTreema.childrenTreemas[0]);
    deleteKeyPress(treema.$el);
    expect(treema.data.numbers.length).toBe(0);
    expectOneSelected(phoneTreema);
    deleteKeyPress(treema.$el);
    expect(treema.data.numbers).toBeUndefined();
    expectOneSelected(addressTreema);
    deleteKeyPress(treema.$el);
    expect(treema.data.address).toBeUndefined();
    expectOneSelected(nameTreema);
    deleteKeyPress(treema.$el);
    expect(treema.data.name).toBeUndefined();
    expect(treema.getSelectedTreemas().length).toBe(0);
    return expect(Object.keys(treema.data).length).toBe(0);
  });
  it('removes a row if it\'s being edited and there\'s nothing in the focused input', function() {
    nameTreema.edit();
    nameTreema.$el.find('input').val('');
    deleteKeyPress(nameTreema.$el.find('input'));
    expect(treema.data.name).toBeUndefined();
    return expectOneSelected(phoneTreema);
  });
  return it('performs normally if a focused input has value', function() {
    nameTreema.edit();
    deleteKeyPress(nameTreema.$el.find('input'));
    return expect(treema.data.name).toBeTruthy();
  });
});
;describe('Enter key press', function() {
  var data, enterKeyPress, nameTreema, phoneTreema, schema, treema;
  enterKeyPress = function($el) {
    return keyDown($el, 13);
  };
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      numbers: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 4
        }
      },
      address: {
        type: 'string'
      }
    }
  };
  data = {
    name: 'Bob',
    numbers: ['401-401-1337', '123-456-7890'],
    'address': 'Mars'
  };
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  treema.build();
  nameTreema = treema.childrenTreemas.name;
  phoneTreema = treema.childrenTreemas.numbers;
  afterEach(function() {
    treema.endExistingEdits();
    return phoneTreema.close();
  });
  it('edits the last selected row', function() {
    nameTreema.select();
    enterKeyPress(treema.$el);
    return expect(nameTreema.isEditing()).toBeTruthy();
  });
  it('saves the current row and goes on to the next value in the collection if there is one', function() {
    phoneTreema.open();
    phoneTreema.childrenTreemas[0].edit();
    phoneTreema.childrenTreemas[0].$el.find('input').val('4321');
    enterKeyPress(phoneTreema.childrenTreemas[0].$el);
    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy();
    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy();
    return expect(treema.data.numbers[0]).toBe('4321');
  });
  it('traverses into and out of open collections', function() {
    phoneTreema.open();
    nameTreema.edit();
    enterKeyPress(nameTreema.$el);
    expect(phoneTreema.isSelected()).toBeTruthy();
    enterKeyPress(treema.$el);
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
    enterKeyPress(phoneTreema.childrenTreemas[0].$el);
    return expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy();
  });
  it('opens closed collections', function() {
    phoneTreema.select();
    enterKeyPress(treema.$el);
    return expect(phoneTreema.isOpen()).toBeTruthy();
  });
  it('shows errors and moves on when saving an invalid row', function() {
    phoneTreema.open();
    phoneTreema.childrenTreemas[0].edit();
    phoneTreema.childrenTreemas[0].$el.find('input').val('1');
    enterKeyPress(phoneTreema.childrenTreemas[0].$el);
    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy();
    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy();
    expect(treema.data.numbers[0]).toBe('1');
    return expect(treema.isValid()).toBeFalsy();
  });
  it('goes backwards if shift is pressed', function() {
    var event;
    phoneTreema.open();
    phoneTreema.childrenTreemas[1].edit();
    event = jQuery.Event("keydown");
    event.which = 13;
    event.shiftKey = true;
    phoneTreema.childrenTreemas[1].$el.trigger(event);
    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy();
    return expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
  });
  return it('edits the first child in a collection if a collection is selected', function() {
    phoneTreema.open();
    phoneTreema.select();
    enterKeyPress(phoneTreema.$el);
    return expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
  });
});
;describe('Initialization', function() {
  var data, el, schema, treema;
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        'default': 'Untitled'
      }
    }
  };
  data = {};
  el = $('<div></div>');
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  it('creates an $el if none is given', function() {
    return expect(treema.$el).toBeDefined();
  });
  it('uses the jQuery element given', function() {
    var elTreema;
    elTreema = TreemaNode.make(el, {
      data: data,
      schema: schema
    });
    return expect(elTreema.$el).toBe(el);
  });
  it('grabs default data from an object schema', function() {
    var noDataTreema;
    noDataTreema = TreemaNode.make(null, {
      schema: schema
    });
    return expect(noDataTreema.data.name).toBe('Untitled');
  });
  return it('opens up root collection nodes by default', function() {
    treema.build();
    return expect(treema.isOpen()).toBeTruthy();
  });
});

describe('Schemaless', function() {
  var data, el, schema, treema;
  schema = {
    type: 'object'
  };
  data = {
    errors: [],
    warnings: [
      {
        userInfo: {},
        id: "jshint_W099",
        message: "Mixed spaces and tabs.",
        level: "warning",
        type: "transpile",
        ranges: [[[8, 0], [8, 3]]]
      }
    ],
    infos: []
  };
  el = $('<div></div>');
  treema = TreemaNode.make(el, {
    data: data,
    schema: schema
  });
  return it('initializes when given data for an empty schema', function() {
    return expect(treema.$el).toBeDefined();
  });
});
;describe('Mouse click behavior', function() {
  var data, metaClick, nameTreema, phoneTreema, schema, shiftClick, treema;
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      numbers: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    }
  };
  data = {
    name: 'Bob',
    numbers: ['401-401-1337', '123-456-7890']
  };
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  treema.build();
  nameTreema = treema.childrenTreemas.name;
  phoneTreema = treema.childrenTreemas.numbers;
  shiftClick = function($el) {
    var event;
    event = jQuery.Event("click");
    event.shiftKey = true;
    return $el.trigger(event);
  };
  metaClick = function($el) {
    var event;
    event = jQuery.Event("click");
    event.metaKey = true;
    return $el.trigger(event);
  };
  it('starts editing if you click the value', function() {
    expect(nameTreema.isDisplaying()).toBeTruthy();
    nameTreema.$el.find('.treema-value').click();
    expect(nameTreema.isEditing()).toBeTruthy();
    return nameTreema.display();
  });
  it('opens a collection if you click the value', function() {
    expect(phoneTreema.isClosed()).toBeTruthy();
    phoneTreema.$el.find('.treema-value').click();
    expect(phoneTreema.isOpen()).toBeTruthy();
    return phoneTreema.close();
  });
  it('selects and unselects the row if you click something other than the value', function() {
    expect(nameTreema.isSelected()).toBeFalsy();
    nameTreema.$el.click();
    expect(nameTreema.isSelected()).toBeTruthy();
    nameTreema.$el.click();
    return expect(nameTreema.isSelected()).toBeFalsy();
  });
  it('selects along all open rows if you shift click', function() {
    phoneTreema.open();
    nameTreema.$el.click();
    shiftClick(phoneTreema.childrenTreemas[1].$el);
    expect(nameTreema.isSelected());
    expect(phoneTreema.isSelected());
    expect(phoneTreema.childrenTreemas[0].isSelected());
    expect(phoneTreema.childrenTreemas[1].isSelected());
    treema.deselectAll();
    return phoneTreema.close();
  });
  it('keeps the clicked row selected if there are multiple selections to begin with', function() {
    nameTreema.$el.click();
    shiftClick(phoneTreema.$el);
    expect(nameTreema.isSelected()).toBeTruthy();
    expect(phoneTreema.isSelected()).toBeTruthy();
    nameTreema.$el.click();
    expect(nameTreema.isSelected()).toBeTruthy();
    expect(phoneTreema.isSelected()).toBeFalsy();
    return treema.deselectAll();
  });
  return it('toggles the select state if you ctrl/meta click', function() {
    nameTreema.$el.click();
    metaClick(phoneTreema.$el);
    expect(nameTreema.isSelected()).toBeTruthy();
    expect(phoneTreema.isSelected()).toBeTruthy();
    metaClick(nameTreema.$el);
    expect(nameTreema.isSelected()).toBeFalsy();
    expect(phoneTreema.isSelected()).toBeTruthy();
    return treema.deselectAll();
  });
});
;describe('"N" key press', function() {
  var data, enterKeyPress, nKeyPress, schema, treema;
  nKeyPress = function($el) {
    return keyDown($el, 78);
  };
  enterKeyPress = function($el) {
    return keyDown($el, 13);
  };
  schema = {
    type: 'array',
    maxItems: 3,
    items: {
      type: 'string'
    }
  };
  data = ['401-401-1337', '123-456-7890'];
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  treema.build();
  it('creates a new row for the currently selected collection', function() {
    treema.childrenTreemas[0].select();
    expect(treema.childrenTreemas[2]).toBeUndefined();
    nKeyPress(treema.childrenTreemas[0].$el);
    expect(treema.childrenTreemas[2]).toBeUndefined();
    enterKeyPress(treema.$el.find('input').val('410-555-1023'));
    expect(treema.childrenTreemas[2]).not.toBeUndefined();
    treema.childrenTreemas[2].display();
    treema.childrenTreemas[2].select();
    return expect(treema.childrenTreemas[2]).not.toBeUndefined();
  });
  return it('does not create a new row when there\'s no more space', function() {
    expect(treema.data.length).toBe(3);
    nKeyPress(treema.childrenTreemas[0].$el);
    return expect(treema.data.length).toBe(3);
  });
});
;describe('Tab key press', function() {
  var addressTreema, data, nameTreema, phoneTreema, schema, tabKeyPress, treema;
  tabKeyPress = function($el) {
    return keyDown($el, 9);
  };
  schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      numbers: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 4
        }
      },
      address: {
        type: 'string'
      }
    }
  };
  data = {
    name: 'Bob',
    numbers: ['401-401-1337', '123-456-7890'],
    'address': 'Mars'
  };
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  treema.build();
  nameTreema = treema.childrenTreemas.name;
  phoneTreema = treema.childrenTreemas.numbers;
  addressTreema = treema.childrenTreemas.address;
  afterEach(function() {
    treema.endExistingEdits();
    return phoneTreema.close();
  });
  it('edits the last selected row', function() {
    nameTreema.select();
    tabKeyPress(treema.$el);
    return expect(nameTreema.isEditing()).toBeTruthy();
  });
  it('saves the current row and goes on to the next value in the collection if there is one', function() {
    phoneTreema.open();
    phoneTreema.childrenTreemas[0].edit();
    phoneTreema.childrenTreemas[0].$el.find('input').val('4321');
    tabKeyPress(phoneTreema.childrenTreemas[0].$el);
    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy();
    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy();
    return expect(treema.data.numbers[0]).toBe('4321');
  });
  it('traverses into and out of open collections', function() {
    phoneTreema.open();
    nameTreema.edit();
    tabKeyPress(nameTreema.$el);
    expect(phoneTreema.isSelected()).toBeTruthy();
    tabKeyPress(treema.$el);
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
    tabKeyPress(phoneTreema.childrenTreemas[0].$el);
    return expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy();
  });
  it('skips over closed collections', function() {
    nameTreema.edit();
    tabKeyPress(nameTreema.$el);
    expect(phoneTreema.isSelected()).toBeTruthy();
    tabKeyPress(treema.$el);
    return expect(addressTreema.isEditing()).toBeTruthy();
  });
  it('shows errors and stays put when saving an invalid row', function() {
    phoneTreema.open();
    phoneTreema.childrenTreemas[0].edit();
    phoneTreema.childrenTreemas[0].$el.find('input').val('1');
    tabKeyPress(phoneTreema.childrenTreemas[0].$el);
    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy();
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
    expect(treema.data.numbers[0]).toBe('1');
    return expect(treema.isValid()).toBeFalsy();
  });
  it('goes backwards if shift is pressed', function() {
    var event;
    phoneTreema.open();
    phoneTreema.childrenTreemas[1].edit();
    event = jQuery.Event("keydown");
    event.which = 9;
    event.shiftKey = true;
    phoneTreema.childrenTreemas[1].$el.trigger(event);
    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy();
    return expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
  });
  return it('edits the first child in a collection if a collection is selected', function() {
    phoneTreema.open();
    phoneTreema.select();
    tabKeyPress(phoneTreema.$el);
    return expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy();
  });
});
;describe('TV4 Interface', function() {
  var data, schema, treema;
  schema = {
    type: 'number'
  };
  data = 'NaN';
  treema = TreemaNode.make(null, {
    data: data,
    schema: schema
  });
  it('can check data validity', function() {
    return expect(treema.isValid()).toBe(false);
  });
  return it('returns errors', function() {
    return expect(treema.getErrors().length).toBe(1);
  });
});
;
//@ sourceMappingURL=treema.spec.js.map