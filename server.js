const express = require('express');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // 引入CORS模块
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // 处理根目录下的静态文件
// app.use(cors()); // 使用CORS中间件
app.use(cors({
    origin: 'https://lhk2004.github.io',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const url_token = 'https://openapi.baidu.com/oauth/2.0/token';

const agents = [
    { client_id: 'yc0rr8N6JXSUpn2Ck2kv3X6tlPtCsAx4', client_secret: 'y7RGjLjlqpCtGReEUjyMO3DJa0g4WcM5' },
    { client_id: 'g5rgxC996I5A05ljFWGnvHw4dHSi5mii', client_secret: '2MZXnocyjQmyaMk2ejTtLgsyp0UT51ep' },
    { client_id: 'XwrsD3gnHeqmfR7GdqcWYkoWJ6eWDZje', client_secret: 'P1BSKidh3XY49f1mHsCjgv0Ff7iBwSMQ' },
    { client_id: 'e1c5Ba0RloO7BRNTymaIocx9erKOdPNw', client_secret: 'CMGaYDYOg8UZi6qngErxA4KbOWfznkX8' }
];

async function getAccessToken(client_id, client_secret) {
    const params = {
        grant_type: 'client_credentials',
        client_id: client_id,
        client_secret: client_secret,
        scope: 'smartapp_snsapi_base'
    };
    const response = await axios.get(url_token, { params });
    return response.data.access_token;
}


async function getAgentOutput(access_token, message, source, openId) {
    const url = 'https://openapi.baidu.com/rest/2.0/lingjing/assistant/getAnswer';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    const data = qs.stringify({
        message: JSON.stringify({
            content: {
                type: 'text',
                value: { showText: message }
            }
        }),
        source: source,
        from: 'openapi',
        openId: openId
    });
    const response = await axios.post(url, data, { headers, params: { access_token: access_token } });
    return response.data.data.content[0].data;
}

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const openId = crypto.randomInt(1, 100000).toString();
        const tokens = await Promise.all(agents.map(agent => getAccessToken(agent.client_id, agent.client_secret)));

        const agent_1_output = await getAgentOutput(tokens[0], userMessage, agents[0].client_id, openId);
        const agent_2_output = await getAgentOutput(tokens[1], agent_1_output, agents[1].client_id, openId);
        const agent_3_output = await getAgentOutput(tokens[2], agent_1_output, agents[2].client_id, openId);

        const combined_agent_2_3_output = agent_2_output + agent_3_output;
        const agent_4_output = await getAgentOutput(tokens[3], combined_agent_2_3_output, agents[3].client_id, openId);

        // res.json({ agent_4_output });
        res.json({ agent_1_output, agent_2_output, agent_3_output, agent_4_output });
        // res.json({ combined_agent_2_3_output });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // 返回根目录下的HTML文件
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});