#!/usr/bin/env python3
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import os

def train_model():
    df = pd.read_parquet("data/train/train_dataset.parquet")
    df = df.dropna()

    X = df[[
        "disp_last","disp_1h_mean","disp_1h_std",
        "pore_kpa","vibration_g",
        "slope_deg","aspect_deg","curvature","roughness",
        "precip_mm_1h","temp_c"
    ]]

    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=0.2,random_state=42)

    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)

    params = {
        "objective":"binary:logistic",
        "eval_metric":"auc",
        "tree_method":"hist"
    }

    model = xgb.train(params, dtrain, num_boost_round=200, evals=[(dtest,"test")])

    preds = model.predict(dtest)
    print("AUC:", roc_auc_score(y_test, preds))
    print(classification_report(y_test, (preds>0.5).astype(int)))

    os.makedirs("models", exist_ok=True)
    model.save_model("models/xgb_baseline.json")

if __name__ == "__main__":
    train_model()