const http = require("http");
const fs = require("fs");
const path = require("path");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

http
  .createServer((request, response) => {
    const relativePath = request.url === "/" ? "index.html" : request.url.slice(1);
    const filePath = path.join(__dirname, relativePath);
    fs.readFile(filePath, (error, contents) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.setHeader("Content-Type", types[path.extname(filePath)] || "application/octet-stream");
      response.end(contents);
    });
  })
  .listen(4173, "127.0.0.1");
