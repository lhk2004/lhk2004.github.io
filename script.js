function sendRequest() {
    var requestInput = document.getElementById('request-input').value;

    var requestData = {
        message: JSON.stringify({
            content: {
                type: 'text',
                value: {
                    showText: requestInput
                }
            }
        }),
        source: 'XwrsD3gnHeqmfR7GdqcWYkoWJ6eWDZje',
        from: 'openapi',
        openId: 'firstam'
    };

    console.log('Sending request with data:', requestData);

    fetch('/api/rest/2.0/lingjing/assistant/getAnswer?access_token=24.1e8447a67b3f93aba0f4c076391a3081.2592000.1719568822.282335-72424051', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            message: requestData.message,
            source: requestData.source,
            from: requestData.from,
            openId: requestData.openId
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        console.log('Received response:', data);
        var conversationContainer = document.getElementById('conversation-container');
    
        // 显示用户的输入
        conversationContainer.innerHTML += '<p><strong>你：</strong>' + escapeHtml(requestInput) + '</p>';
    
        // 检查是否有内容数据且该数据是否为非空数组
        if (data.data && Array.isArray(data.data.content) && data.data.content.length > 0) {
            // 循环遍历每个内容项
            data.data.content.forEach((contentItem) => {
                // 如果dataType为空或dataType为"markdown"，则显示内容
                if (!contentItem.dataType || contentItem.dataType === "txt") {
                    // 安全地添加机器人的响应内容
                    conversationContainer.innerHTML += '<p><strong>机器人：</strong>' + escapeHtml(contentItem.data) + '</p>';
                }
            });
        } else {
            // 如果没有内容或内容格式不正确
            conversationContainer.innerHTML += '<p><strong>机器人：</strong> 无法获取响应</p>';
        }
    })
    .catch(error => {
        console.error('发送请求时发生错误:', error);
        var conversationContainer = document.getElementById('conversation-container');
        conversationContainer.innerHTML += '<p><strong>错误：</strong> 请求失败，请检查控制台日志。</p>';
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}