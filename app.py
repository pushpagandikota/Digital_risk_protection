from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import joblib
import os

app = Flask(__name__)
CORS(app)  # Enables communication with your frontend

DATABASE = "database.db"

# 1. Load your trained AI-ML model from the models folder
model_path = os.path.join("models", "brand_name_model.joblib")
try:
    model = joblib.load(model_path)
    print("AI Model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load model: {e}")
    model = None

# 2. Initialize the SQLite database table
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand TEXT NOT NULL,
                asset_name TEXT NOT NULL,
                url TEXT NOT NULL,
                risk_score INTEGER NOT NULL
            )
        """)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "message": "RiskGuard Backend is running!"})

# 3. Prediction Route (Connected to Frontend 'Analyze Asset' button)
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json
    
    brand = data.get("brand", "Unknown Brand")
    asset_name = data.get("asset_name", "Unknown Asset")
    url = data.get("url", asset_name)  # fallback to asset name if url isn't provided
    
    try:
        # Run prediction through your ML model if available
        if model:
            # Note: Adjust input format [url] if your model was trained on multiple features
            prediction = model.predict([url])
            risk_score = int(prediction[0])
        else:
            risk_score = 15  # Fallback score if model is missing
            
        # Save scan details into SQLite database
        with sqlite3.connect(DATABASE) as conn:
            conn.execute(
                "INSERT INTO scans (brand, asset_name, url, risk_score) VALUES (?, ?, ?, ?)",
                (brand, asset_name, url, risk_score)
            )
            conn.commit()
            
        return jsonify({"success": True, "risk_score": risk_score})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 4. Optional Route: Fetch Recent Scans for your Dashboard History Table
@app.route("/api/scans", methods=["GET"])
def get_scans():
    try:
        with sqlite3.connect(DATABASE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM scans ORDER BY id DESC LIMIT 10")
            rows = cursor.fetchall()
            scans_list = [dict(row) for row in rows]
        return jsonify({"success": True, "scans": scans_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)