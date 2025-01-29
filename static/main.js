// main.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const voiceInput = document.getElementById('voice-input');
    const voiceStop = document.getElementById('voice-stop');
    const themeToggle = document.getElementById('theme-toggle');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    // State management
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    // Theme management
    const toggleTheme = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ?
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', newTheme);
    };

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ?
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    // Chat functionality
    const addMessage = (message, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.innerHTML = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const showThinking = () => {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking';
        thinkingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(thinkingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return thinkingDiv;
    };

    const sendMessage = async (message) => {
        if (!message.trim()) return;

        // Disable input while processing
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add user message
        addMessage(message, true);
        const thinkingDiv = showThinking();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            thinkingDiv.remove();

            if (response.ok) {
                addMessage(data.response);
            } else {
                addMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            thinkingDiv.remove();
            addMessage('Sorry, there was an error processing your request.');
            console.error('Error:', error);
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    };

    // Voice input functionality
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                // Here you would typically send the audioBlob to your backend
                audioChunks = [];
            };

            mediaRecorder.start();
            isRecording = true;
            voiceInput.classList.add('hidden');
            voiceStop.classList.remove('hidden');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            addMessage('Error accessing microphone. Please check your permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            voiceInput.classList.remove('hidden');
            voiceStop.classList.add('hidden');
        }
    };

    // Event Listeners
    sendButton.addEventListener('click', () => {
        sendMessage(userInput.value);
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(userInput.value);
        }
    });

    voiceInput.addEventListener('click', startRecording);
    voiceStop.addEventListener('click', stopRecording);
    themeToggle.addEventListener('click', toggleTheme);

    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.textContent;
            sendMessage(chip.textContent);
        });
    });

    // Initial focus
    userInput.focus();

    // Add initial welcome message
    addMessage('Hello! I\'m your Personal Finance AI Assistant. How can I help you today?');
});
