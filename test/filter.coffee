describe 'Children Filter', ->
	  
  data = [
      {
        "id": "0001",
        "type": "Donut",
        "name": "Cake",
        "ppu": 0.55,
        "batters":
                [
                  { "id": "1001", "name": "Regular" },
                  { "id": "1002", "name": "Chocolate" },
                  { "id": "1003", "name": "Blueberry" },
                  { "id": "1004", "name": "Devil's Food" }
                ]
        "toppings":
                [
                  { "id": "5001", "name": "None" },
                  { "id": "5002", "name": "Glazed" },
                  { "id": "5005", "name": "Sugar" },
                  { "id": "5007", "name": "Powdered Sugar" },
                  { "id": "5006", "name": "Chocolate with Sprinkles" },
                  { "id": "5003", "name": "Chocolate" },
                  { "id": "5004", "name": "Maple" }
                ]
      },
      {
        "id": "0002",
        "type": "Donut",
        "name": "Raised",
        "ppu": 0.55,
        "batters":
                  [
                    { "id": "1001", "name": "Regular" }
                  ]
        "toppings":
                [
                  { "id": "5001", "name": "None" },
                  { "id": "5002", "name": "Glazed" },
                  { "id": "5005", "name": "Sugar" },
                  { "id": "5003", "name": "Chocolate" },
                  { "id": "5004", "name": "Maple" }
                ]
      },
      {
        "id": "0001",
        "type": "Donut",
        "name": "Cake 2",
        "ppu": 0.55,
        "batters":
                [
                  { "id": "1001", "name": "Regular" },
                  { "id": "1002", "name": "Chocolate" },
                  { "id": "1003", "name": "Blueberry" },
                  { "id": "1004", "name": "Devil's Food" }
                ]
        "toppings":
                [
                  { "id": "5001", "name": "None" },
                  { "id": "5002", "name": "Glazed" },
                  { "id": "5005", "name": "Sugar" },
                  { "id": "5007", "name": "Powdered Sugar" },
                  { "id": "5006", "name": "Chocolate with Sprinkles" },
                  { "id": "5003", "name": "Chocolate" },
                  { "id": "5004", "name": "Maple" }
                ]
      },
      {
        "id": "0003",
        "type": "Donut",
        "name": "Old Fashioned",
        "ppu": 0.55,
        "batters":
                  [
                    { "id": "1001", "name": "Regular" },
                    { "id": "1002", "name": "Chocolate" }
                  ]
        "toppings":
                [
                  { "id": "5001", "name": "None" },
                  { "id": "5002", "name": "Glazed" },
                  { "id": "5003", "name": "Chocolate" },
                  { "id": "5004", "name": "Maple" }
                ]
      },
      {
        "id": "0004",
        "type": "Pastry",
        "name": "Croissant",
        "ppu": 2.95,
        "batters":
                [
                  { "id": "1001", "name": "Regular" },
                ]
        "toppings":
                [
                  { "id": "5001", "name": "None" },
                  { "id": "5003", "name": "Chocolate" },
                ]
      }
    ]

  schema = {
      type: 'array',
      items: {
        "additionalProperties": false,
        "type": "object",
        "format": "product",
        "displayProperty": 'name',
        "properties": {
          "id": { title: "ID", type: "string" },
          "name": { title: "Name", type: "string", maxLength: 20 },
          "type": { title: "Product Type", type: "string", enum: ['Donut', 'Pastry']},
          "ppu": { title: "Price", type: "number", format: "price"},
          "batters": {
            type: "array",
            title: "Batter Options",
            uniqueItems: true,
            maxItems: 4,
            items: {
              type: "object",
              format: "batter",
              properties: {
                "id": { type:"string" },
                "type": { type:"string" }
              }
            }
          },
          "toppings": {
            type: "array",
            title: "Topping Options",
            uniqueItems: true,
            maxItems: 7,
            items: {
              type: "object",
              format: "topping",
              properties: {
                "id": { type:"string" },
                "type": { type:"string" }
              }
            }
          }
        }
      }
  }

  treemaFilterHiddenClass = 'treema-filter-hidden'
  el = $('<div></div>')
  treema = TreemaNode.make(el, {data: data, schema: schema})
  treema.build()

  createTitleFilter = (text)->
  	filter = (treemaNode, keyForParent)->
  	  return !text or text.trim() == '' or treemaNode.getValEl().text().toLowerCase().indexOf(text.toLowerCase()) >= 0
    return filter

  it 'Filter node on node title', ->

    treema.filterChildren(createTitleFilter(''))
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(5)
    treema.clearFilter

    treema.filterChildren(createTitleFilter('cake'))
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(2)
    treema.clearFilter

    treema.filterChildren(createTitleFilter('OLD fashioned'))
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(1)
    treema.clearFilter

    treema.filterChildren(createTitleFilter('@@'))
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(0)
    treema.clearFilter

  it 'Nodes are always visible on null filter', ->
    treema.filterChildren(null)
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(5)
    treema.clearFilter

    treema.filterChildren(undefined)
    expect($(el).find('.treema-node').not('.' + treemaFilterHiddenClass).length).toBe(5)
    treema.clearFilter

  describe 'Navigate nodes using keyboard should skip hidden nodes', =>
        
    @firstTreema = $(el).find('.treema-node').eq(0).data('instance')
    @thirdTreema = $(el).find('.treema-node').eq(2).data('instance')

    @leftArrowPress = ($el) -> keyDown($el, 37)
    @upArrowPress = ($el) -> keyDown($el, 38)
    @rightArrowPress = ($el) -> keyDown($el, 39)
    @downArrowPress = ($el) -> keyDown($el, 40)

  	it 'Select the first node.', =>
      @firstTreema.select()
      expect(@firstTreema.isSelected()).toBe(true)

    it 'Navigate to next node. The node is expected to be the third node, since the second node is hidden by filter', =>
      treema.filterChildren(createTitleFilter('cake'))
      @firstTreema.navigateSelection(1)
      expect(@thirdTreema.isSelected()).toBe(true)
      treema.clearFilter
    
    it 'Navigate back to previous node, the first node', =>
      treema.filterChildren(createTitleFilter('cake'))
      @thirdTreema.navigateSelection(-1)
      expect(@firstTreema.isSelected()).toBe(true)
      treema.clearFilter
    
    it 'Cyclic Navigation', =>
      treema.filterChildren(createTitleFilter('cake'))
      @firstTreema.navigateSelection(-1)
      @firstTreema.navigateSelection(-1)
      expect(@firstTreema.isSelected()).toBe(true)
      treema.clearFilter
    
    it 'When a node is open, the next node becomes its first child node', =>
      treema.filterChildren(createTitleFilter('cake'))
      @firstTreema.open()
      @firstTreema.navigateSelection(1)

      @firstChildren = @firstTreema.getNodeEl().find('.treema-children').children().eq(0).data('instance')
      @secondChildren = @firstTreema.getNodeEl().find('.treema-children').children().eq(1).data('instance')

      expect(@firstChildren.isSelected()).toBe(true)
      @firstChildren.navigateSelection(1)
      expect(@secondChildren.isSelected()).toBe(true)

      @firstTreema.close()
      treema.clearFilter
    
    it 'Simulate arrow key press', =>
      treema.filterChildren(createTitleFilter('cake'))
      @firstTreema.select()

      @downArrowPress(el)    
      expect(@thirdTreema.isSelected()).toBe(true)

      @upArrowPress(el)    
      expect(@firstTreema.isSelected()).toBe(true)

      treema.clearFilter