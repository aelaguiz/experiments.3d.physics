
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Amir\'s 3d/physics experiments'
    }
  });
});

app.get('/threeTest', function(req, res){
  res.render('threeTest', {
    locals: {
      title: 'Three.js Flying Grid'
    }
  });
});

app.get('/threeBox', function(req, res){
  res.render('threeBox', {
    locals: {
      title: 'Three.js + box2d Flying Grid'
    }
  });
});

app.get('/gunTest', function(req, res){
  res.render('gunTest', {
    locals: {
      title: 'Three.js + box2d Gun'
    }
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(8082);
  console.log("Express server listening on port %d", app.address().port)
}
