from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Demo data: 0 = legitimate-style, 1 = suspicious-style.
samples = [
    ("ABC Bank", "ABC Bank", 0),
    ("ABC Bank", "ABC Bank Official", 0),
    ("ABC Bank", "ABC Bannk", 1),
    ("ABC Bank", "ABC Bank Free Prize", 1),
    ("Star Store", "Star Store", 0),
    ("Star Store", "Star Store Official", 0),
    ("Star Store", "Starr Store", 1),
    ("Star Store", "Star Store Giveaway", 1),
    ("Blue Mobile", "Blue Mobile", 0),
    ("Blue Mobile", "Blue Mobile Official", 0),
    ("Blue Mobile", "Bluu Mobile", 1),
    ("Blue Mobile", "Blue Mobile Claim Prize", 1),
]

texts = [
    f"{brand} [SEP] {account}"
    for brand, account, label in samples
]
labels = [label for brand, account, label in samples]

model = Pipeline([
    ("vectorizer", TfidfVectorizer(
        analyzer="char",
        ngram_range=(2, 4)
    )),
    ("classifier", LogisticRegression(max_iter=1000))
])

model.fit(texts, labels)

model_path = (
    Path(__file__).resolve().parent
    / "models"
    / "brand_name_model.joblib"
)

model_path.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(model, model_path)

print("AI/ML model trained successfully!")
print("Saved to:", model_path)