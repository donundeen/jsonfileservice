/*
json file server
given a directory of json files, serve up either
paged lists of file ids (page, page_size)
a json file (fileid)
*/
var Percolator = require('percolator').Percolator;

var file_list = [];
var file_hash = {};
var file_dir = "./OASCobjects";
var urlparser = require("url");
var pathparser = require("path");

var fs = require("fs.extra");

var port = 9166;

var server = new Percolator({port : port});

load_file_list(get_server_started);


function load_file_list(callback){

	var walk = require("walk");

	var walker = walk.walk(file_dir);
	
	walker.on("end", function(){
		console.log("at end");
		callback();
	});

	walker.on("file", function (root, stat, next) {
	  var filepath = root +"/"+ stat.name;

	  if(stat.name.match(/\.json$/)){
		  console.log(filepath);
		  var id = stat.name.split(".")[0];
		  var file_data = {
		  	id : id,
		  	dir : root,
		  	fullpath : filepath,
		  	filename : stat.name
		  };
		  file_list.push(file_data);
		  file_hash[id] = file_data;
	  }

	  next();
	});

//	walker.walk(file_dir);

	console.log("")
//	callback();
}

function get_server_started(){




  server.route(

    '*', {  
      GET : function(req, res){
    		// get from db and return
        var parsed = urlparser.parse(req.url, true)
        var query = parsed.query;


        // CLIENT OR server-sidE GENERATION? DECIDE HERE. HOW?

        console.log("@@@@@@@@@@@@@@@@@@@@@@@@ REQUEST");
        console.log(req.url);
   
   /*
        if(req.url.match(/\.(json|html|js|jpg|jpeg|gif|png|css|ico|ttf|svg|woff)(\?.*)?$/i)){
          if(!query.action){
            // this is doing it client-side
            sendFile(parsed.pathname, query, res);
            return;
          }
        }
        */
        if(req.url.match(/^\/list\//)){
        	var split = req.url.split("/");
        	var page = parseInt(split[2]);
        	var num_items = parseInt(split[3]);
        	var start_index = page * num_items;
        	var segment = file_list.slice(start_index, start_index + num_items); 
            var contentType = "application/json";
            res.writeHead(200, {'Content-Type': contentType});
            res.end(JSON.stringify(segment));
          return;
        }
        if(req.url.match(/^\/item\//)){
        	var split = req.url.split("/");
        	var id = split[2];
        	var filedata = file_hash[id];
        	var fullpath = filedata.fullpath;
            var contentType = "application/json";

		    fs.readFile(fullpath, function(err, data){
		      if(err){
		        console.log("file read error");
		        console.log(err);
		        res.writeHead(404, {'Content-Type': contentType});
		        //indexhtml = data;
		        res.end(data);
		      }else{
		        res.writeHead(200, {'Content-Type': contentType});
		        //dataCache[path] = data;
		        res.end(data);
		      }
		    });


          return;
        }

        return;


  //      res.object({message : 'Hello World!'}).send();

      },
    },
    '/list',  {
      GET : function(req, res){
      	console.log("got list");
	      var contentType = "application/json";
	      res.writeHead(200, {'Content-Type': contentType});
	      res.end(JSON.stringify(list));
      }
    }

  );

  server.listen(function(err){
    console.log('server is listening on port ', server.port);
  });
}


dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/index.html";
  }

  var extname = pathparser.extname(path);
  var contentType = 'text/html';
  if(path.match(/secrets\.js/)){
        res.writeHead(404, {'Content-Type': contentType});
        //indexhtml = data;
        res.end("I'm afraid I can't do that.");
        return;
  }

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case ".json":
      contentType = "application/json";
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.jpg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.ico':
      contentType = 'image/vnd.microsoft.icon';
      break;
  }

  if(!dataCache[path]){
    fs.readFile("."+path, function(err, data){
      if(err){
        console.log("file read error");
        console.log(err);
        res.writeHead(404, {'Content-Type': contentType});
        //indexhtml = data;
        res.end(data);
      }else{
        res.writeHead(200, {'Content-Type': contentType});
        //dataCache[path] = data;
        res.end(data);
      }
    });
  }else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dataCache[path]);
  }
}



