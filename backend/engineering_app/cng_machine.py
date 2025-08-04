import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from engineering_app.ml_utils import DateFeatureExtractor
from decouple import config
from sqlalchemy import create_engine
import joblib
db_url = f"postgresql://{config('DB_USER')}:{config('DB_PASSWORD')}@{config('DB_HOST')}:{config('DB_PORT')}/{config('DB_NAME')}"
engine = create_engine(db_url)

# Mengambil data dari database
try:
    cng_data = pd.read_sql('SELECT * FROM cng_daily', engine)
    print(cng_data.head())
except Exception as e:
    print(f"Error: {e}")

# Pastikan kolom 'date' sudah bertipe datetime
cng_data['date'] = pd.to_datetime(cng_data['date'])

# Menambahkan fitur berdasarkan tanggal
cng_data['month'] = cng_data['date'].dt.month
cng_data['day'] = cng_data['date'].dt.day
cng_data['quarter'] = cng_data['date'].dt.quarter
cng_data['month_quarter'] = ((cng_data['month'] - 1) % 4 + 1)  # Quarter dalam tahun
cng_data['day_of_week'] = cng_data['date'].dt.weekday + 1  # Senin = 1, Minggu = 7
cng_data['month_day'] = cng_data['date'].dt.strftime('%m-%d')  # Format bulan-hari (misalnya 01-01)

# Menampilkan hasil setelah penambahan fitur
print(cng_data[['date', 'month', 'day', 'quarter', 'month_day', 'month_quarter', 'day_of_week']].head())

from sklearn.model_selection import train_test_split

# Fitur (X) hanya mengambil kolom 'date', target (y) adalah 'daily_consumption'
X = cng_data[['date']]  # Kolom 'date' sebagai input
y = cng_data['daily_consumption']  # Target: konsumsi harian

# Membagi data menjadi train dan test (80% untuk training dan 20% untuk testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor

# Custom transformer untuk feature engineering (mengekstrak fitur dari tanggal)s

pipeline = Pipeline([
    ('date_features', DateFeatureExtractor()),  # Ekstraksi fitur dari tanggal
    ('model', GradientBoostingRegressor(n_estimators=100, random_state=42))  # Model
])

# Melatih model dengan data train
pipeline.fit(X_train, y_train)

# Evaluasi model dengan data test
# y_pred = pipeline.predict(X_test)
# mae = mean_absolute_error(y_test, y_pred)
# rmse = np.sqrt(mean_squared_error(y_test, y_pred))

# print(f'Mean Absolute Error (MAE): {mae}')
# print(f'Root Mean Squared Error (RMSE): {rmse}')

joblib.dump(pipeline, 'ml_models/cng_forecasting_pipeline.pkl')
# print("Pipeline berhasil disimpan!")

# Memastikan input 'today' memiliki kolom 'date' seperti yang diinginkan oleh transformer
# today = pd.DataFrame([datetime.today()], columns=['date'])  # Kolom harus bernama 'date'

# # Prediksi menggunakan pipeline
# prediction = pipeline.predict(today)
# print(f'Today\'s predicted consumption: {prediction[0]}')

