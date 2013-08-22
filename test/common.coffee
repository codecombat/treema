keyDown = ($el, which) ->
  event = jQuery.Event("keydown")
  event.which = which
  $el.trigger(event)
