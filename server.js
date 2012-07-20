var http = require('http');
var fs = require('fs');
var path = require('path');
var port = 8000;

http.createServer(function (request, response) {
 

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';
         
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg' || '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.ogv':
            contentType = 'video/theora';
            break;
        case '.webm':
            contentType = 'video/webm';
            break;
        case '.mp4':
            contentType = 'video/mp4';
            break;
    }
     
    path.exists(filePath, function(exists) {
     
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
     
}).listen(port);
 
console.log('Server running at http://127.0.0.1:'+port+'/');