# VPA Flask

# VPA Flask – ML-Powered Factory Assistant

A Machine Learning-powered Factory Assistant built with Flask and scikit-learn. The application classifies user commands using Natural Language Processing (NLP), executes factory-related operations, and displays real-time data through an interactive dashboard.

---

## Features

### Machine Learning & NLP
- Intent Classification using Logistic Regression
- Text Vectorization using TF-IDF
- Confidence Score Calculation
- Natural Language Command Processing
- Multi-Class Classification Model
- Real-Time Prediction Pipeline

### Virtual Assistant Functions
- Greetings
- Time and Date Queries
- Search Commands
- Calculator
- Weather Information
- Jokes
- Help Menu
- Farewell Responses

### Factory Operations
- Defect Reporting
- Production Status Monitoring
- Maintenance Request Management
- Shift Log Recording
- Real-Time Factory Dashboard

### Frontend Features
- Interactive Chat Interface
- Intent Badge Display
- Confidence Score Display
- Typing Animation
- Architecture Visualization
- Responsive Design
- Scroll Reveal Animations
- Auto-Updating Dashboard

### Database Features
- SQLite Database Integration
- Defect Report Storage
- Maintenance Ticket Storage
- Historical Data Retrieval
- Real-Time Dashboard Updates

---

## Technologies Used

### Backend
- Python
- Flask
- SQLite

### Machine Learning
- scikit-learn
- TF-IDF Vectorizer
- Logistic Regression

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### APIs & Communication
- REST API
- JSON
- Fetch API

---

## Architecture

User
│
▼
HTML / CSS / JavaScript
│
▼
Fetch API
│
▼
Flask Backend
│
▼
TF-IDF Vectorizer
│
▼
Logistic Regression Model
│
▼
Intent Prediction
│
▼
SQLite Database
│
▼
JSON Response
│
▼
Frontend Dashboard

---

## Supported Intents

| Intent | Description |
|----------|-------------|
| greeting | Greetings |
| time | Current time |
| date | Current date |
| search | Search queries |
| calculate | Mathematical calculations |
| joke | Random jokes |
| weather | Weather information |
| help | Available commands |
| farewell | Exit conversation |
| report_defect | Report factory defects |
| check_status | Production status monitoring |
| maintenance | Maintenance requests |
| shift_log | Shift handover logging |

---

## Author

Samandar Abdujabbarov

GitHub: https://github.com/smndr-abd

---

## API Endpoints

### Chat Endpoint

```http
POST /chat 

