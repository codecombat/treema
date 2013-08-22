/*
  This server is for development of treema. It serves static files, and can be
  used to simulate real servers for nodes that do server interaction.
  
  Run 
 */

/* Source: http://stackoverflow.com/questions/10434001/static-files-with-express-js */

module.exports.startServer = startServer = function() {
  var express = require('express');
  var app = express();
  var path = require('path');
  
  app.get('/db/fastfood', function(req, res) {
    // for testing the database search feature
    var func = function() {
      var results = [];
      if (!req.query.term) {
        results = restaurants;
      }
      else {
        var term = req.query.term.toLowerCase();
        for (var i in restaurants) {
          var place = restaurants[i];
          if (place.toLowerCase().indexOf(term) > -1)
            results.push({id:parseInt(i), name:place});
        }
      }
      res.setHeader('Content-Type', 'text/json');
      res.send(results);
      res.end();
    };

    // simulate actual work
    setTimeout(func, 300);
    
  });
  
  app.use(express.static(__dirname)); // Current directory is root
  //app.use(express.static(path.join(__dirname, 'test'))); //  "public" off of current is root
  
  app.listen(9090);
  console.log('Listening on port 9090');
  return app;
};

// http://en.wikipedia.org/wiki/List_of_fast_food_restaurant_chains
restaurants = [
  "A&W Restaurants", "Amigos/Kings Classic", "Andy's Frozen Custard", "Arby's", "Arctic Circle Restaurants",
  "Arthur Treacher's", "Baker's Drive-Thru", "Baskin-Robbins", "Bess Eaton", "Big Apple Bagels",
  "Big Boy Restaurants", "Biscuitville", "Blake's Lotaburger", "Blimpie", "Bojangles' Famous Chicken 'n Biscuits",
  "Brooklyn Ice Cream Factory", "Burger King", "Braum's", "Brown's Chicken & Pasta", "Burger Street",
  "Burgerville", "Cafe Rio", "California Tortilla", "Captain D's", "Carl's Jr. / Green Burrito",
  "Checkers / Rally's", "Cheeburger Cheeburger", "Chick-fil-A", "Chicken Express", "Chico's Tacos",
  "Chinese Gourmet Express", "Church's Chicken / Texas Chicken", "Cluck-U Chicken", "Cook Out", "Cousins Subs",
  "Crown Burgers", "Dairy Queen", "Del Taco", "Denny's", "Dick's Drive-In", "Dickey's Barbecue Pit", "Dog n Suds",
  "Duchess", "Dunkin' Donuts", "Einstein Bros. Bagels", "El Pollo Loco", "El Taco Tote", "Erbert & Gerbert's",
  "Fatburger", "Firehouse Subs", "Five Guys", "Fosters Freeze", "Freddy's Frozen Custard", "Gold Star Chili",
  "Golden Chick", "Golden Spoon", "Good Times Burgers & Frozen Custard", "Grandy's", "Gray's Papaya", "Great Steak",
  "Griff's Hamburgers", "Halo Burger", "Happi House", "Happy Joe's", "Hardee's / Red Burrito", "Harold's Chicken Shack",
  "Hogi Yogi", "Honey Dew Donuts", "Hot Dog on a Stick", "Hot 'n Now", "Huddle House", "In-N-Out Burger", "Ivar's",
  "Jack in the Box", "Jack's", "Jersey Mike's Subs", "Jimboy's Tacos", "Johnny Rockets", "Juan Pollo", "KFC",
  "Kopp's Frozen Custard", "Krispy Kreme", "Krystal", "LaMar's Donuts", "Larry's Giant Subs", "Lenny's Sub Shop",
  "Long John Silver's", "Lyon's", "Maid-Rite", "Manchu Wok", "McDonald's", "Mighty Taco", "Milio's Sandwiches",
  "Milo's Hamburgers", "Mr. Hero", "Mrs. Winner's Chicken & Biscuits", "Nathan's Famous", "Nedick's", "Nu-Way Weiners",
  "Nu Way Cafe", "Orange Julius", "The Original Hamburger Stand", "Original Tommy's", "Pal's", "Pioneer Chicken",
  "Pizza Hut", "Popeyes Chicken & Biscuits", "Portillo's Restaurants", "Port of Subs", "Quiznos",
  "Raising Cane's Chicken Fingers", "Ranch1", "Roy Rogers Restaurants", "Runza", "Saladworks", "Schlotzsky's",
  "Sheetz", "Showmars", "Skippers Seafood & Chowder House", "Smoothie King", "Sneaky Pete's", "Sonic Drive-In",
  "Spangles", "Steak Escape", "Submarina", "Subway", "Taco Bell", "Taco Bueno", "Taco Cabana", "Taco del Mar",
  "Taco John's", "Taco Mayo", "Taco Tico", "Taco Time", "Ted's Hot Dogs", "Texadelphia", "TGIF (Thank God It's Friday)",
  "The Hat", "The Whole Donut", "Togo's", "Tudor's Biscuit World", "The Varsity", "Wendy's", "Wetzel's Pretzels",
  "Whataburger", "White Castle", "Wienerschnitzel", "Winchell's Donuts", "Wingstop", "WingStreet", "Winstead's",
  "Wing Zone", "Woody's Chicago Style", "Yum-Yum Donuts", "Zaxby's"
]