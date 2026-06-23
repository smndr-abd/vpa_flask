# VPA Flask

A Virtual Personal Assistant (VPA) web application built with Flask. This project provides an interactive AI-powered assistant through a simple web interface, allowing users to ask questions, receive intelligent responses, and interact with AI services in real time.

## Features

* Flask-based web application
* Clean and responsive user interface
* AI-powered conversational assistant
* Real-time user interactions
* Easy deployment and customization
* Environment variable support for API keys
* Lightweight and beginner-friendly architecture

## Tech Stack

* Python
* Flask
* HTML/CSS
* JavaScript
* OpenAI API (optional)
* Jinja2 Templates

## Project Structure

```text
VPA_Flask/
│
├── app.py
├── requirements.txt
├── .env
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/
│   └── index.html
│
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/VPA_Flask.git
cd VPA_Flask
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
```

### 3. Activate the virtual environment

macOS/Linux:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
```

### 6. Run the application

```bash
python app.py
```

or

```bash
python3 app.py
```

## Usage

1. Start the Flask server.
2. Open your browser.
3. Navigate to:

```text
http://127.0.0.1:5000
```

4. Enter your message and interact with the assistant.

## Example

```text
User: What is machine learning?

Assistant: Machine learning is a branch of artificial intelligence that enables systems to learn patterns from data and improve their performance without being explicitly programmed.
```

## Future Improvements

* Voice input and output
* User authentication
* Chat history storage
* PDF document analysis
* Multi-language support
* Integration with external APIs
* Dark mode UI

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to GitHub
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

Samandar Abdujabbarov

GitHub: https://github.com/smndr-abd
