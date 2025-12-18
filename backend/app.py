from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello from Python backend!',
        'status': 'success'
    })

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({
        'items': [
            {'id': 1, 'name': 'Item 1', 'description': 'First item'},
            {'id': 2, 'name': 'Item 2', 'description': 'Second item'},
            {'id': 3, 'name': 'Item 3', 'description': 'Third item'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
