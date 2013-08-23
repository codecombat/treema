do ->
  leftArrowPress = ($el) -> keyDown($el, 37)
  upArrowPress = ($el) -> keyDown($el, 38)
  rightArrowPress = ($el) -> keyDown($el, 39)
  downArrowPress = ($el) -> keyDown($el, 40)
  
  expectOneSelected = (t) ->
    selected = treema.getSelectedTreemas()
    expect(selected.length).toBe(1)
    expect(selected[0]).toBe(t)

  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: ['string', 'array'] } }
      address: { type: 'string' }
    }
  }
  data = { name: 'Bob', numbers: ['401-401-1337', ['123-456-7890']], 'address': 'Mars' }
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  nameTreema = treema.childrenTreemas.name
  phoneTreema = treema.childrenTreemas.numbers
  addressTreema = treema.childrenTreemas.address
  
  beforeEach ->
    treema.deselectAll()
    phoneTreema.close()
    
  describe 'Down arrow key press', ->
    it 'selects the top row if nothing is selected', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      downArrowPress(treema.$el)
      expect(nameTreema.isSelected()).toBeTruthy()
      
    it 'skips past closed collections', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      downArrowPress(treema.$el)
      expectOneSelected(nameTreema)
      downArrowPress(treema.$el)
      expectOneSelected(phoneTreema)
      downArrowPress(treema.$el)
      expectOneSelected(addressTreema)
      
    it 'traverses open collections', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      phoneTreema.open()
      downArrowPress(treema.$el)
      expectOneSelected(nameTreema)
      downArrowPress(treema.$el)
      expectOneSelected(phoneTreema)
      downArrowPress(treema.$el)
      expectOneSelected(phoneTreema.childrenTreemas[0])
      downArrowPress(treema.$el)
      expectOneSelected(phoneTreema.childrenTreemas[1])
      downArrowPress(treema.$el)
      expectOneSelected(addressTreema)
      
    it 'does nothing if the last treema is selected', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      addressTreema.select()
      expectOneSelected(addressTreema)
      downArrowPress(treema.$el)
      expectOneSelected(nameTreema)

  describe 'Up arrow key press', ->
    it 'selects the bottom row if nothing is selected', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      upArrowPress(treema.$el)
      expect(addressTreema.isSelected()).toBeTruthy()

    it 'skips past closed collections', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      upArrowPress(treema.$el)
      expectOneSelected(addressTreema)
      upArrowPress(treema.$el)
      expectOneSelected(phoneTreema)
      upArrowPress(treema.$el)
      expectOneSelected(nameTreema)

    it 'traverses open collections', ->
      expect(treema.getSelectedTreemas().length).toBe(0)
      phoneTreema.open()
      upArrowPress(treema.$el)
      expectOneSelected(addressTreema)
      upArrowPress(treema.$el)
      expectOneSelected(phoneTreema.childrenTreemas[1])
      upArrowPress(treema.$el)
      expectOneSelected(phoneTreema.childrenTreemas[0])
      upArrowPress(treema.$el)
      expectOneSelected(phoneTreema)
      upArrowPress(treema.$el)
      expectOneSelected(nameTreema)

    it 'wraps around if the first treema is selected', ->
      nameTreema.select()
      expectOneSelected(nameTreema)
      upArrowPress(treema.$el)
      expectOneSelected(addressTreema)

  describe 'Right arrow key press', ->
    it 'does nothing if the selected row isn\'t a collection', ->
      nameTreema.select()
      expectOneSelected(nameTreema)
      rightArrowPress(treema.$el)
      expectOneSelected(nameTreema)
      
    it 'opens a collection if a collection is selected', ->
      expect(phoneTreema.isClosed()).toBeTruthy()
      phoneTreema.select()
      rightArrowPress(treema.$el)
      expect(phoneTreema.isOpen()).toBeTruthy()
      expectOneSelected(phoneTreema)
      
  describe 'Left arrow key press', ->
    it 'closes an open, selected collection', ->
      phoneTreema.open()
      phoneTreema.select()
      leftArrowPress(treema.$el)
      expect(phoneTreema.isClosed()).toBeTruthy()
      expectOneSelected(phoneTreema)
    
    it 'closes the non-root parent collection of a selected value', ->
      phoneTreema.open()
      phoneTreema.childrenTreemas[0].select()
      leftArrowPress(treema.$el)
      expect(phoneTreema.isClosed()).toBeTruthy()
      expectOneSelected(phoneTreema)
      
    it 'closes one collection at a time, deepest first', ->
      phoneTreema.open()
      phoneTreema.childrenTreemas[1].open()
      phoneTreema.childrenTreemas[1].childrenTreemas[0].select()
      
      leftArrowPress(treema.$el)
      expect(phoneTreema.childrenTreemas[1].isClosed()).toBeTruthy()
      expect(phoneTreema.isOpen()).toBeTruthy()
      expectOneSelected(phoneTreema.childrenTreemas[1])
      
      leftArrowPress(treema.$el)
      expect(phoneTreema.isClosed()).toBeTruthy()
      expectOneSelected(phoneTreema)
