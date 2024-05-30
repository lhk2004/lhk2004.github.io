document.addEventListener('DOMContentLoaded', () => {
    const requestInput = document.getElementById('request-input');
    const conversationContainer = document.getElementById('conversation-container');

    window.sendRequest = async function () {
        const userMessage = requestInput.value;
        if (!userMessage) return;

        appendMessage('你', userMessage);
        requestInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();
            console.log('Received Response from Agent 1:', data.agent_1_output);
            console.log('Received Response from Agent 2:', data.agent_2_output);
            console.log('Received Response from Agent 3:', data.agent_3_output);
            appendMessage('Chat-NJU', data.agent_4_output);
            // appendMessage('Chat-NJU', data.combined_agent_2_3_output);
        } catch (error) {
            console.error('Error fetching response:', error);
            appendMessage('Error', 'Failed to get response from agent.');
        }
    };

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        conversationContainer.appendChild(messageElement);
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }
});