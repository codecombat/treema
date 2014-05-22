describe 'Property Schemas', ->
  beforeEach ->
    @schema =
      type: 'object'
      properties:
        name: {type: 'string', default: 'Merlin'}
      patternProperties:
        '^[a-zA-Z]*$': {type: 'string', description: 'alpha'}
        '^[0-9]*$': {type: 'string', description: 'num'}

    @data =
      name: 'Monroe'
      full_name: 'Marilyn Monroe'
      hobby: 'Painting'
      '9573': 'Super secret code'

    @treema = TreemaNode.make(null, {data: @data, schema: @schema})

  it 'allowed property schema', ->
    expect(@treema.getChildSchema('name')).toEqual(@schema.properties.name)

  it 'allowed pattern property schema', ->
    expect(@treema.getChildSchema('hobby')).toEqual(@schema.patternProperties['^[a-zA-Z]*$'])
    expect(@treema.getChildSchema('9573')).toEqual(@schema.patternProperties['^[0-9]*$'])

  it 'empty schema for no match', ->
    expect(@treema.getChildSchema('full_name')).toEqual({})