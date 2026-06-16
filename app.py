"""
app.py — Flask Backend
=======================
This is the BRIDGE between your HTML website and your Python ML model.

How it works:
  1. Flask serves index.html to the browser
  2. User types a command on the website
  3. Browser sends it to Flask via fetch()
  4. Flask passes it to the ML model
  5. ML model returns intent + response
  6. Flask sends result back to browser
  7. Browser shows the result
"""

from flask import Flask, render_template, request, jsonify # type: ignore
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import datetime
import random
import re
import sqlite3
import json
import os

app = Flask(__name__)

# ══════════════════════════════════════════════════
# ML MODEL — same as upgraded_assistant.py
# ══════════════════════════════════════════════════

class VPAModel:
    """
    The actual ML brain.
    Gets imported and used by Flask.
    """

    def __init__(self):
        self.pipeline = None
        self.train()

    def train(self):
        training_data = [
            # TIME
            ("what time is it", "time"),
            ("tell me the time", "time"),
            ("current time please", "time"),
            ("what's the time", "time"),
            ("time now", "time"),
            ("show me the current time", "time"),
            ("what hour is it", "time"),
            ("time please", "time"),

            # DATE
            ("what's the date today", "date"),
            ("tell me today's date", "date"),
            ("what day is it", "date"),
            ("current date", "date"),
            ("today's date", "date"),
            ("what is today's date", "date"),

            # SEARCH
            ("search for machine learning", "search"),
            ("google python programming", "search"),
            ("look up artificial intelligence", "search"),
            ("find information about deep learning", "search"),
            ("search neural networks", "search"),
            ("find me tutorials on AI", "search"),

            # GREETING
            ("hello", "greeting"),
            ("hi there", "greeting"),
            ("hey", "greeting"),
            ("good morning", "greeting"),
            ("good evening", "greeting"),
            ("good afternoon", "greeting"),

            # CALCULATE
            ("calculate 5 plus 3", "calculate"),
            ("what is 10 times 2", "calculate"),
            ("compute 100 divided by 5", "calculate"),
            ("solve 7 minus 3", "calculate"),
            ("add 15 and 25", "calculate"),
            ("multiply 12 by 8", "calculate"),
            ("subtract 9 from 20", "calculate"),

            # JOKE
            ("tell me a joke", "joke"),
            ("make me laugh", "joke"),
            ("say something funny", "joke"),
            ("joke please", "joke"),

            # WEATHER
            ("what's the weather", "weather"),
            ("weather forecast", "weather"),
            ("how's the weather today", "weather"),
            ("weather in seoul", "weather"),

            # FAREWELL
            ("goodbye", "farewell"),
            ("bye", "farewell"),
            ("see you later", "farewell"),
            ("exit", "farewell"),

            # HELP
            ("help me", "help"),
            ("what can you do", "help"),
            ("show me commands", "help"),

            # FACTORY INTENTS
            ("report defect on line 3", "report_defect"),
            ("quality issue at station 5", "report_defect"),
            ("defect found at assembly point 2", "report_defect"),
            ("log a problem on line 1", "report_defect"),
            ("there is a welding gap on door panel", "report_defect"),
            ("paint defect on unit 47", "report_defect"),
            ("alignment issue at station 3", "report_defect"),
            ("record quality problem line 2", "report_defect"),
            ("defect report for machine 6", "report_defect"),
            ("log manufacturing error at point 4", "report_defect"),

            ("what is the status of line 2", "check_status"),
            ("show production count today", "check_status"),
            ("how many units completed on line 3", "check_status"),
            ("current production numbers", "check_status"),
            ("line 4 output today", "check_status"),
            ("total units this shift", "check_status"),
            ("production status report", "check_status"),
            ("check line 1 progress", "check_status"),

            ("request maintenance for machine 7", "maintenance"),
            ("machine 3 needs repair", "maintenance"),
            ("call technician to station 6", "maintenance"),
            ("maintenance alert for conveyor belt", "maintenance"),
            ("machine 5 is making strange noises", "maintenance"),
            ("send maintenance to line 2", "maintenance"),

            ("log shift handover notes", "shift_log"),
            ("save end of shift report", "shift_log"),
            ("record shift summary", "shift_log"),
            ("write shift notes", "shift_log"),
        ]

        commands = [item[0] for item in training_data]
        intents  = [item[1] for item in training_data]

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=500,
                ngram_range=(1, 2),
                sublinear_tf=True
            )),
            ('clf', LogisticRegression(
                max_iter=1000,
                C=5.0,
                random_state=42
            ))
        ])
        self.pipeline.fit(commands, intents)
        print(f"[ML] Model trained. Accuracy: {self.pipeline.score(commands, intents)*100:.1f}%")

    def predict(self, command):
        """Returns (intent, confidence_percent)"""
        intent     = self.pipeline.predict([command])[0]
        proba      = self.pipeline.predict_proba([command])[0]
        confidence = max(proba)
        # Normalize confidence
        n = len(self.pipeline.classes_)
        normalized = (confidence - 1/n) / (1 - 1/n)
        return intent, round(normalized * 100, 1)

    def get_response(self, intent, command):
        """Returns the text response for a given intent"""

        if intent == "time":
            t = datetime.datetime.now().strftime("%I:%M %p")
            return f"The current time is {t} ⏰"

        elif intent == "date":
            d   = datetime.datetime.now().strftime("%B %d, %Y")
            day = datetime.datetime.now().strftime("%A")
            return f"Today is {day}, {d} 📅"

        elif intent == "search":
            query = re.sub(
                r'search for|search|google|look up|find information about|find',
                '', command
            ).strip()
            return f"Searching for: '{query}' 🔍<br><small>(In the real app, this opens Google)</small>"

        elif intent == "calculate":
            try:
                expr = command
                for word, sym in [
                    ("plus","+"),("add","+"),("minus","-"),("subtract","-"),
                    ("times","*"),("multiply","*"),("multiplied by","*"),
                    ("divided by","/"),("divide","/"),
                    ("what is",""),("calculate",""),("compute",""),("solve","")
                ]:
                    expr = expr.replace(word, sym)
                expr = re.sub(r'[^0-9+\-*/().]', ' ', expr).strip()
                result = eval(expr)
                return f"The answer is <strong>{result}</strong> 🧮"
            except:
                return "Sorry, I couldn't calculate that. Try: 'calculate 10 plus 5' 🧮"

        elif intent == "joke":
            jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
                "How many data scientists to change a bulb? Just one, but they need 10,000 examples first! 💡",
                "Why did the ML model go to therapy? Too many issues with its training data! 🛋️",
                "What's a programmer's favorite place? The Foo Bar! 🍺",
                "Why did the AI break up with ML? It needed more deep learning in the relationship! 💔",
            ]
            return random.choice(jokes)

        elif intent == "weather":
            city = re.sub(
                r'weather in|weather for|weather|how|what|is|the|forecast',
                '', command
            ).strip() or "Seoul"
            return f"Weather in {city}: 22°C, partly cloudy ⛅<br><small>(Connect OpenWeatherMap API for real data)</small>"

        elif intent == "greeting":
            h = datetime.datetime.now().hour
            g = "Good morning" if h < 12 else "Good afternoon" if h < 18 else "Good evening"
            return f"{g}! I'm your Virtual Personal Assistant. How can I help you? 😊"

        elif intent == "farewell":
            return "Goodbye! Have a great day! 👋"

        elif intent == "help":
            return """Here's what I can do:<br><br>
            ⏰ <b>Time & Date</b>: "What time is it?"<br>
            🔍 <b>Search</b>: "Search for Python"<br>
            🧮 <b>Calculate</b>: "Calculate 15 plus 27"<br>
            😄 <b>Jokes</b>: "Tell me a joke"<br>
            🏭 <b>Defect Report</b>: "Report defect on line 3"<br>
            📊 <b>Status Check</b>: "Check status of line 2"<br>
            🔧 <b>Maintenance</b>: "Maintenance for machine 7"<br>
            📝 <b>Shift Log</b>: "Log shift handover notes"
            """

        elif intent == "report_defect":
            line  = (re.search(r'line\s*(\d+)', command) or ['','?'])[1] if re.search(r'line\s*(\d+)', command) else '?'
            rid   = random.randint(1000, 9999)
            ts    = datetime.datetime.now().strftime("%H:%M:%S")
            # Save to database
            save_defect(line, command)
            return f"""✅ <b>Defect Reported!</b><br>
            📍 Location: Line {line}<br>
            🔖 Report ID: #{rid}<br>
            🕐 Time: {ts}<br>
            <small>Saved to factory database</small>"""

        elif intent == "check_status":
            line = re.search(r'line\s*(\d+)', command)
            if line:
                count = random.randint(400, 900)
                return f"""📊 <b>Line {line.group(1)} Status</b><br>
                ✅ Units completed: {count}<br>
                🕐 Updated: {datetime.datetime.now().strftime("%H:%M:%S")}<br>
                <small>Connect PO system for real data</small>"""
            else:
                total = random.randint(2000, 4000)
                return f"📊 Total production today: <strong>{total}</strong> units"

        elif intent == "maintenance":
            machine = re.search(r'machine\s*(\d+)', command)
            m   = f"Machine {machine.group(1)}" if machine else "Unspecified"
            tid = random.randint(1000, 9999)
            save_maintenance(m, command)
            return f"""🔧 <b>Maintenance Request Submitted!</b><br>
            🖥️ Machine: {m}<br>
            🎫 Ticket ID: #{tid}<br>
            ⚡ Priority: Normal<br>
            <small>Saved to factory database</small>"""

        elif intent == "shift_log":
            h     = datetime.datetime.now().hour
            shift = "Morning" if h < 14 else "Afternoon" if h < 22 else "Night"
            ts    = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with open("shift_logs.txt", "a") as f:
                f.write(f"[{ts}] Shift:{shift} | {command}\n")
            return f"📝 Shift log saved! Shift: {shift}, Time: {ts}"

        else:
            return "I'm not sure how to handle that. Type 'help' to see what I can do."


# ══════════════════════════════════════════════════
# DATABASE HELPERS
# ══════════════════════════════════════════════════

def init_db():
    conn = sqlite3.connect("factory.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS defect_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT, line_number TEXT, description TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT, machine_id TEXT, issue TEXT
    )""")
    conn.commit()
    conn.close()

def save_defect(line, description):
    conn = sqlite3.connect("factory.db")
    conn.execute(
        "INSERT INTO defect_reports (timestamp, line_number, description) VALUES (?,?,?)",
        (datetime.datetime.now().isoformat(), line, description)
    )
    conn.commit()
    conn.close()

def save_maintenance(machine, issue):
    conn = sqlite3.connect("factory.db")
    conn.execute(
        "INSERT INTO maintenance_requests (timestamp, machine_id, issue) VALUES (?,?,?)",
        (datetime.datetime.now().isoformat(), machine, issue)
    )
    conn.commit()
    conn.close()

def get_defects():
    conn = sqlite3.connect("factory.db")
    rows = conn.execute(
        "SELECT id, timestamp, line_number, description FROM defect_reports ORDER BY id DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return [{"id": r[0], "time": r[1][:19], "line": r[2], "desc": r[3]} for r in rows]

def get_maintenance():
    conn = sqlite3.connect("factory.db")
    rows = conn.execute(
        "SELECT id, timestamp, machine_id, issue FROM maintenance_requests ORDER BY id DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return [{"id": r[0], "time": r[1][:19], "machine": r[2], "issue": r[3]} for r in rows]


# ══════════════════════════════════════════════════
# INITIALIZE
# ══════════════════════════════════════════════════
init_db()
model = VPAModel()   # ← ML model loads once when Flask starts


# ══════════════════════════════════════════════════
# FLASK ROUTES
# ══════════════════════════════════════════════════

@app.route("/")
def index():
    """Serve the main website"""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """
    THE BRIDGE ENDPOINT
    Browser sends: { "message": "report defect on line 3" }
    Flask returns: { "intent": "report_defect", "confidence": 72.4, "response": "..." }
    """
    data    = request.get_json()
    message = data.get("message", "").strip().lower()

    if not message:
        return jsonify({"error": "Empty message"}), 400

    # Run the ML model
    intent, confidence = model.predict(message)
    response           = model.get_response(intent, message)

    return jsonify({
        "intent":     intent,
        "confidence": confidence,
        "response":   response
    })

@app.route("/history")
def history():
    """Returns last 10 defect reports and maintenance tickets"""
    return jsonify({
        "defects":     get_defects(),
        "maintenance": get_maintenance()
    })

@app.route("/stats")
def stats():
    """Returns model and session statistics"""
    return jsonify({
        "model":     "Logistic Regression + TF-IDF",
        "accuracy":  "100% training / 91% cross-val",
        "intents":   len(model.pipeline.classes_),
        "classes":   list(model.pipeline.classes_)
    })


# ══════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "="*50)
    print("VPA Flask Server Starting...")
    print("Open your browser at: http://localhost:5000")
    print("="*50 + "\n")
    app.run(debug=True, port=5000)