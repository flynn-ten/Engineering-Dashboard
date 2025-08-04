import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class DateFeatureExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = pd.DataFrame(X)
        X['date'] = pd.to_datetime(X['date'])

        return pd.DataFrame({
            'month': X['date'].dt.month,
            'day': X['date'].dt.day,
            'quarter': X['date'].dt.quarter,
            'month_quarter': ((X['date'].dt.month - 1) % 4 + 1),
            'day_of_week': X['date'].dt.weekday + 1,
        })
    