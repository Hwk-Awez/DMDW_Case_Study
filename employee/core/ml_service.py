import os
import pickle
from pathlib import Path
import numpy as np

# Paths to models
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / 'models'

_COLS = None
_MEAN = None
_SCALE = None
_COEF = None
_INTERCEPT = None

class _SafeUnpickler(pickle.Unpickler):
    """
    Safely unpickles scikit-learn models and scalers into lightweight objects
    extracting pure NumPy parameters without importing C-extension DLLs.
    """
    def find_class(self, module, name):
        if 'sklearn' in module:
            class Dummy:
                def __init__(self, *args, **kwargs):
                    pass
            Dummy.__name__ = name
            return Dummy
        return super().find_class(module, name)


def load_artifacts():
    global _COLS, _MEAN, _SCALE, _COEF, _INTERCEPT
    if _COEF is None:
        columns_path = MODEL_DIR / 'knn_columns.pkl'
        scaler_path = MODEL_DIR / 'knn_scaler.pkl'
        model_path = MODEL_DIR / 'logistic_regression_model.pkl'

        with open(columns_path, 'rb') as f:
            _COLS = pickle.load(f)

        with open(scaler_path, 'rb') as f:
            raw_scaler = _SafeUnpickler(f).load()
            _MEAN = np.array(raw_scaler.mean_, dtype=np.float64)
            _SCALE = np.array(raw_scaler.scale_, dtype=np.float64)

        with open(model_path, 'rb') as f:
            raw_model = _SafeUnpickler(f).load()
            _COEF = np.array(raw_model.coef_[0], dtype=np.float64)
            _INTERCEPT = float(raw_model.intercept_[0])

    return _COLS, _MEAN, _SCALE, _COEF, _INTERCEPT


def predict_attrition(data: dict) -> dict:
    """
    Takes 15 raw features from user input and predicts Attrition using the Logistic Regression model.
    """
    cols, mean, scale, coef, intercept = load_artifacts()

    # Parse inputs with robust type conversions
    age = float(data.get('Age', 30))
    job_satisfaction = int(data.get('JobSatisfaction', 3))
    monthly_income = float(data.get('MonthlyIncome', 5000))
    job_level = int(data.get('JobLevel', 1))
    years_at_company = float(data.get('YearsAtCompany', 3))
    total_working_years = float(data.get('TotalWorkingYears', 6))
    env_satisfaction = int(data.get('EnvironmentSatisfaction', 3))
    job_involvement = int(data.get('JobInvolvement', 3))
    stock_option_level = int(data.get('StockOptionLevel', 0))
    distance_from_home = float(data.get('DistanceFromHome', 5))
    years_with_curr_manager = float(data.get('YearsWithCurrManager', 2))

    over_time = str(data.get('OverTime', 'No')).strip()
    job_role = str(data.get('JobRole', 'Sales Executive')).strip()
    business_travel = str(data.get('BusinessTravel', 'Travel_Rarely')).strip()
    marital_status = str(data.get('MaritalStatus', 'Single')).strip()

    # Construct the exact 24 encoded features matching knn_columns.pkl
    feature_dict = {
        'Age': age,
        'JobSatisfaction': job_satisfaction,
        'MonthlyIncome': monthly_income,
        'JobLevel': job_level,
        'YearsAtCompany': years_at_company,
        'TotalWorkingYears': total_working_years,
        'EnvironmentSatisfaction': env_satisfaction,
        'JobInvolvement': job_involvement,
        'StockOptionLevel': stock_option_level,
        'DistanceFromHome': distance_from_home,
        'YearsWithCurrManager': years_with_curr_manager,
        'OverTime_Yes': 1.0 if over_time == 'Yes' else 0.0,
        'JobRole_Human Resources': 1.0 if job_role == 'Human Resources' else 0.0,
        'JobRole_Laboratory Technician': 1.0 if job_role == 'Laboratory Technician' else 0.0,
        'JobRole_Manager': 1.0 if job_role == 'Manager' else 0.0,
        'JobRole_Manufacturing Director': 1.0 if job_role == 'Manufacturing Director' else 0.0,
        'JobRole_Research Director': 1.0 if job_role == 'Research Director' else 0.0,
        'JobRole_Research Scientist': 1.0 if job_role == 'Research Scientist' else 0.0,
        'JobRole_Sales Executive': 1.0 if job_role == 'Sales Executive' else 0.0,
        'JobRole_Sales Representative': 1.0 if job_role == 'Sales Representative' else 0.0,
        'BusinessTravel_Travel_Frequently': 1.0 if business_travel == 'Travel_Frequently' else 0.0,
        'BusinessTravel_Travel_Rarely': 1.0 if business_travel == 'Travel_Rarely' else 0.0,
        'MaritalStatus_Married': 1.0 if marital_status == 'Married' else 0.0,
        'MaritalStatus_Single': 1.0 if marital_status == 'Single' else 0.0,
    }

    # Vector in exact column order
    x = np.array([feature_dict[c] for c in cols], dtype=np.float64)

    # Standard scaling: (X - mean) / scale
    x_scaled = (x - mean) / scale

    # Logistic Regression inference: logit z = x_scaled . coef + intercept
    z = np.dot(x_scaled, coef) + intercept

    # Sigmoid activation: P(y=1) = 1 / (1 + exp(-z))
    leave_prob = 1.0 / (1.0 + np.exp(-z))
    stay_prob = 1.0 - leave_prob

    pred = 1 if leave_prob >= 0.5 else 0

    leave_pct = round(float(leave_prob) * 100, 1)
    stay_pct = round(float(stay_prob) * 100, 1)

    if leave_pct >= 60.0:
        risk_level = "High Risk"
        risk_color = "danger"
    elif leave_pct >= 35.0:
        risk_level = "Moderate Risk"
        risk_color = "warning"
    else:
        risk_level = "Low Risk"
        risk_color = "success"

    return {
        "prediction_code": pred,
        "attrition": "Yes" if pred == 1 else "No",
        "result_label": "Likely to Leave" if pred == 1 else "Likely to Stay",
        "stay_probability": stay_pct,
        "leave_probability": leave_pct,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "algorithm": "Logistic Regression",
    }
