from flask import Flask, render_template, request, jsonify
from chat_utilities import generate_chat_response, sanitize_input
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable debug mode only in development
app.debug = os.environ.get('FLASK_ENV') == 'development'

@app.route('/')
def home():
    """Render the home page."""
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering home page: {str(e)}")
        return "An error occurred while loading the page.", 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests."""
    try:
        # Get and validate user message
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message']

        # Sanitize user input
        sanitized_message = sanitize_input(user_message)
        if not sanitized_message:
            return jsonify({'error': 'Invalid message'}), 400

        # Generate response
        logger.info(f"Generating response for user message: {sanitized_message}")
        response = generate_chat_response(sanitized_message)

        # Check if response indicates an error
        if isinstance(response, str) and response.startswith('I apologize'):
            return jsonify({'error': response}), 422

        return jsonify({'response': response})

    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        return jsonify({
            'error': 'An unexpected error occurred. Please try again later.'
        }), 500

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
