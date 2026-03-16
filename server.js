const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Serve static files from the current directory
const staticPath = path.join(__dirname);

const server = http.createServer((req, res) => {
    // Extract the path component and strip query string / fragment
    const urlPath = req.url.split('?')[0].split('#')[0];
    const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');

    // Resolve the requested path against the static root to prevent directory traversal
    const candidatePath = path.resolve(staticPath, relativePath);
    const staticRootWithSep = staticPath.endsWith(path.sep) ? staticPath : staticPath + path.sep;

    // Resolve symlinks and verify the final path is within the static root
    fs.realpath(candidatePath, (realErr, safePath) => {
        if (realErr) {
            if (realErr.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${realErr.code}`);
            }
            return;
        }

        if (!safePath.startsWith(staticRootWithSep)) {
            res.writeHead(403, { 'Content-Type': 'text/html' });
            res.end('<h1>403 Forbidden</h1>', 'utf-8');
            return;
        }

        const extname = path.extname(safePath);
        let contentType = 'text/html';

        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
        }

        fs.readFile(safePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});