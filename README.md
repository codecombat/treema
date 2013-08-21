treema
======

<script src="https://raw.github.com/sderickson/treema/master/treema.js" type="text/javascript"></script>

A library for creating HTML interfaces to edit JSON data defined by
 [json-schema](http://json-schema.org/), written in CoffeeScript and Sass.

Editing JSON in the browser? Forget the syntax quibbles--GUI it up! 
Trying to edit configuration? Validate it!

Like
 [tv4](https://github.com/geraintluff/tv4) crossed with 
 [JSON Editor Online](https://github.com/josdejong/jsoneditor/) or 
 [Hulk](https://github.com/kevinburke/hulk).

Originally designed for use in the [CodeCombat](http://codecombat.com/) challenge editor.
Design and behavior similar to how Chrome Dev Tools, the Starcraft II Galaxy Editor and Mac OS X Finder work. 

## Get in touch
You can use the [GitHub issues](https://github.com/sderickson/treema/issues), the
 [Discourse forum](http://discourse.codecombat.com/), the
 [HipChat](http://www.hipchat.com/g3plnOKqa), or
 [email](mailto:team@codecombat.com) the
 [team](http://codecombat.com/about).

## Status
Still in initial development, but it works.

To use it, just grab [treema.js](https://github.com/sderickson/treema/blob/master/treema.js) 
and [treema.css](https://github.com/sderickson/treema/blob/master/treema.css), then invoke it 
like so:

```javascript
var el = $('#my-treema');
var options = {schema:schema, data:data};
var treema = el.treema(options);
//var treema = TreemaNode.make(el, options); // also works
treema.build();
```

To try it out, you can clone it, `npm install`, run `bin/treema-brunch`, then go to 
[localhost:9090/test.html](http://localhost:9090/test.html).

![Prototype example](http://i.imgur.com/YZiciiu.png)

## License
[The MIT License (MIT)](https://github.com/sderickson/treema/blob/master/LICENSE)

We'll probably also have a simple [CLA](http://en.wikipedia.org/wiki/Contributor_License_Agreement) soon.