import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from engineering_app.ml_utils import DateFeatureExtractor
from decouple import config
from sqlalchemy import create_engine
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
import numpy as np

# Koneksi ke database
db_url = f"postgresql://{config('DB_USER')}:{config('DB_PASSWORD')}@{config('DB_HOST')}:{config('DB_PORT')}/{config('DB_NAME')}"
engine = create_engine(db_url)

try:
    elec_data = pd.read_sql('SELECT * FROM electricity_daily', engine)
    print(elec_data.head())
except Exception as e:
    print(f"Error: {e}")
    sys.exit()

# Pastikan kolom 'date' sudah dalam format datetime
elec_data['date'] = pd.to_datetime(elec_data['date'])

# Feature engineering manual (optional, hanya untuk print preview)
elec_data['month'] = elec_data['date'].dt.month
elec_data['day'] = elec_data['date'].dt.day
elec_data['quarter'] = elec_data['date'].dt.quarter
elec_data['month_quarter'] = ((elec_data['month'] - 1) % 4 + 1)
elec_data['day_of_week'] = elec_data['date'].dt.weekday + 1
elec_data['month_day'] = elec_data['date'].dt.strftime('%m-%d')

print(elec_data[['date', 'month', 'day', 'quarter', 'month_day', 'month_quarter', 'day_of_week']].head())

# Split data
X = elec_data[['date']]
y = elec_data['daily_consumption']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Pipeline training
pipeline = Pipeline([
    ('date_features', DateFeatureExtractor()),
    ('model', LinearRegression())
])

pipeline.fit(X_train, y_train)

# Simpan model ke folder ml_models
os.makedirs('ml_models', exist_ok=True)
joblib.dump(pipeline, 'ml_models/electricity_forecasting_pipeline.pkl')
print("✅ Model listrik berhasil disimpan ke ml_models/electricity_forecasting_pipeline.pkl")
