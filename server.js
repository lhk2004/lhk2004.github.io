const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors'); // 引入 CORS 中间件
const app = express();

const PORT = process.env.PORT || 3000;

console.log('Starting server setup...');

app.use(cors()); // 应用 CORS 中间件
console.log('CORS enabled for all origins.');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

console.log('Middleware setup complete.');

app.use(express.static(path.join(__dirname, 'public')));

console.log('Static file middleware setup complete.');

app.use('/api', createProxyMiddleware({
    target: 'https://openapi.baidu.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('origin', 'https://openapi.baidu.com');

        if (req.body) {
            const contentType = proxyReq.getHeader('Content-Type');
            let bodyData;

            if (contentType === 'application/json') {
                bodyData = JSON.stringify(req.body);
            } else if (contentType === 'application/x-www-form-urlencoded') {
                bodyData = new URLSearchParams(req.body).toString();
            }

            if (bodyData) {
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send(`Proxy Error: ${err.message}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        let body = [];
        proxyRes.on('data', chunk => {
            body.push(chunk);
        });
        proxyRes.on('end', () => {
            body = Buffer.concat(body).toString();
        });
    }
}));

console.log('Proxy middleware setup complete.');

app.get('/', (req, res) => {
    console.log('GET / request received');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
    } else {
        console.log(`Server is running on port ${PORT}`);
    }
});