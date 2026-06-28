from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ── Health Check ──────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ML service running ✅"})

# ── Predict Endpoint ──────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Lazy import Prophet (slow to load — import inside function)
        from prophet import Prophet
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        import pandas as pd
        import numpy as np
        import math

        body    = request.get_json()
        data    = body.get('data', [])
        periods = body.get('periods', 7)

        if len(data) < 5:
            return jsonify({"error": "Need at least 5 data points"}), 400

        df = pd.DataFrame(data)
        df['ds'] = pd.to_datetime(df['ds'])
        df['y']  = pd.to_numeric(df['y'])
        df = df.groupby('ds', as_index=False)['y'].sum()
        df = df.sort_values('ds').reset_index(drop=True)

        # Fill missing dates
        date_range = pd.date_range(df['ds'].min(), df['ds'].max())
        df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
        df.columns = ['ds', 'y']

        # Train Prophet
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.3,
            interval_width=0.8,
        )
        model.fit(df)

        # Forecast
        future   = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        future_only = forecast[forecast['ds'] > df['ds'].max()]

        result = []
        for _, row in future_only.iterrows():
            result.append({
                "date":         row['ds'].strftime('%Y-%m-%d'),
                "predictedQty": max(0, round(float(row['yhat']),       2)),
                "lower":        max(0, round(float(row['yhat_lower']), 2)),
                "upper":        max(0, round(float(row['yhat_upper']), 2)),
            })

        total_demand = sum(r['predictedQty'] for r in result)

        # Trend
        recent_avg = float(df['y'].iloc[-7:].mean())
        older_avg  = float(df['y'].iloc[-30:-7].mean()) if len(df) > 30 else recent_avg
        trend = (
            'RISING'  if recent_avg > older_avg * 1.1 else
            'FALLING' if recent_avg < older_avg * 0.9 else
            'STABLE'
        )

        # Accuracy (holdout)
        accuracy = None
        if len(df) >= 17:
            try:
                train = df.iloc[:-7]
                test  = df.iloc[-7:]
                m2    = Prophet(
                    daily_seasonality=False,
                    weekly_seasonality=True,
                    yearly_seasonality=False,
                )
                m2.fit(train)
                f2      = m2.predict(m2.make_future_dataframe(periods=7))
                preds   = f2['yhat'].iloc[-7:].values
                actuals = test['y'].values
                mae     = float(mean_absolute_error(actuals, preds))
                rmse    = float(math.sqrt(mean_squared_error(actuals, preds)))
                mape    = float(np.mean(np.abs(
                    (actuals - preds) / (actuals + 1e-5)
                )) * 100)
                accuracy = {
                    "mae":          round(mae,  2),
                    "rmse":         round(rmse, 2),
                    "mape":         round(mape, 2),
                    "accuracy_pct": round(max(0, 100 - mape), 1),
                }
            except Exception:
                accuracy = None

        return jsonify({
            "forecast":              result,
            "totalPredictedDemand": round(total_demand, 2),
            "forecastDays":          periods,
            "trend":                 trend,
            "accuracy":              accuracy,
            "modelInfo": {
                "dataPointsUsed": len(df),
                "algorithm":      "Facebook Prophet",
                "avgDailySales":  round(float(df['y'].mean()), 2),
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Reorder Logic ─────────────────────────────────────────
@app.route('/reorder-logic', methods=['POST'])
def reorder_logic():
    try:
        from prophet import Prophet
        import pandas as pd
        import math

        body          = request.get_json()
        products      = body.get('products', [])
        forecast_days = body.get('forecastDays', 7)
        results       = []

        for product in products:
            sales_data = product.get('salesData', [])
            if len(sales_data) < 10:
                results.append({
                    **product,
                    "status":            "INSUFFICIENT_DATA",
                    "suggestedOrderQty": 0,
                    "urgency":           "UNKNOWN",
                })
                continue

            df = pd.DataFrame(sales_data)
            df['ds'] = pd.to_datetime(df['ds'])
            df['y']  = pd.to_numeric(df['y'])
            df = df.groupby('ds', as_index=False)['y'].sum()

            date_range = pd.date_range(df['ds'].min(), df['ds'].max())
            df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
            df.columns = ['ds', 'y']

            model    = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=False,
            )
            model.fit(df)
            future       = model.make_future_dataframe(periods=forecast_days)
            forecast     = model.predict(future)
            future_only  = forecast[forecast['ds'] > df['ds'].max()]
            total_demand = max(0, round(float(future_only['yhat'].sum()), 2))

            current_stock = product.get('currentStock', 0)
            min_threshold = product.get('minThreshold', 0)
            gap           = total_demand - current_stock
            suggested_qty = max(0, math.ceil(gap + min_threshold))

            days_of_stock = (
                (current_stock / (total_demand / forecast_days))
                if total_demand > 0 else 999
            )

            urgency = (
                'CRITICAL'   if days_of_stock <= 2                  else
                'HIGH'       if days_of_stock <= forecast_days / 2  else
                'ORDER'      if gap > 0                              else
                'SUFFICIENT'
            )

            results.append({
                "productId":             product.get('productId'),
                "productName":           product.get('productName'),
                "unit":                  product.get('unit', ''),
                "currentStock":          current_stock,
                "totalPredictedDemand":  total_demand,
                "suggestedOrderQty":     suggested_qty,
                "daysOfStockLeft":       round(days_of_stock, 1),
                "urgency":               urgency,
            })

        urgency_order = {
            'CRITICAL': 0, 'HIGH': 1,
            'ORDER': 2, 'SUFFICIENT': 3, 'UNKNOWN': 4
        }
        results.sort(key=lambda x: urgency_order.get(x['urgency'], 4))

        return jsonify({
            "suggestions":  results,
            "forecastDays": forecast_days,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Start Server ──────────────────────────────────────────
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)