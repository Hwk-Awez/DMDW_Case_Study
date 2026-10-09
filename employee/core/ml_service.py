import os
import pickle
from pathlib import Path
import pandas as pd

# Paths to models
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / 'models'

_MODEL = None
_SCALER = None
_COLUMNS = None

def load_artifacts():
    global _MODEL, _SCALER, _COLUMNS
    if _MODEL is None or _SCALER is None or _COLUMNS is None:
        columns_path = MODEL_DIR / 'knn_columns.pkl'
        scaler_path = MODEL_DIR / 'knn_scaler.pkl'
        model_path = MODEL_DIR / 'logistic_regression_model.pkl'

        with open(columns_path, 'rb') as f:
            _COLUMNS = pickle.load(f)
        with open(scaler_path, 'rb') as f:
            _SCALER = pickle.load(f)
        with open(model_path, 'rb') as f:
            _MODEL = pickle.load(f)

    return _MODEL, _SCALER, _COLUMNS


def predict_attrition(data: dict) -> dict:
    """
    Takes 15 raw features from user input and predicts Attrition using the Logistic Regression model.
    """
    model, scaler, columns = load_artifacts()

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
        'OverTime_Yes': 1 if over_time == 'Yes' else 0,
        'JobRole_Human Resources': 1 if job_role == 'Human Resources' else 0,
        'JobRole_Laboratory Technician': 1 if job_role == 'Laboratory Technician' else 0,
        'JobRole_Manager': 1 if job_role == 'Manager' else 0,
        'JobRole_Manufacturing Director': 1 if job_role == 'Manufacturing Director' else 0,
        'JobRole_Research Director': 1 if job_role == 'Research Director' else 0,
        'JobRole_Research Scientist': 1 if job_role == 'Research Scientist' else 0,
        'JobRole_Sales Executive': 1 if job_role == 'Sales Executive' else 0,
        'JobRole_Sales Representative': 1 if job_role == 'Sales Representative' else 0,
        'BusinessTravel_Travel_Frequently': 1 if business_travel == 'Travel_Frequently' else 0,
        'BusinessTravel_Travel_Rarely': 1 if business_travel == 'Travel_Rarely' else 0,
        'MaritalStatus_Married': 1 if marital_status == 'Married' else 0,
        'MaritalStatus_Single': 1 if marital_status == 'Single' else 0,
    }

    # Ensure columns order exactly matches the trained scaler & model
    df_features = pd.DataFrame([feature_dict])[columns]

    # Transform with scaler
    scaled_features = scaler.transform(df_features)

    # Predict
    pred = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]
    
    # probabilities[0] is class 0 (No), probabilities[1] is class 1 (Yes)
    stay_pct = round(float(probabilities[0]) * 100, 1)
    leave_pct = round(float(probabilities[1]) * 100, 1)

    if leave_pct >= 60.0:
        risk_level = "High Risk"
        risk_color = "danger"
    elif leave_pct >= 40.0:
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
