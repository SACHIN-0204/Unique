from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import math
import pandas as pd
import numpy as np

from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error


app = Flask(__name__)

CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ML service running",
        "prophet": "available"
    }), 200


@app.route('/predict', methods=['POST'])
def predict():

    try:
        body = request.get_json(silent=True) or {}

        data = body.get('data', [])
        periods = int(body.get('periods', 7))

        if not isinstance(data, list):
            return jsonify({
                "error": "data must be an array"
            }), 400

        if len(data) < 5:
            return jsonify({
                "error": "Need at least 5 data points"
            }), 400

        df = pd.DataFrame(data)

        if 'ds' not in df.columns or 'y' not in df.columns:
            return jsonify({
                "error": "Each data point must contain ds and y"
            }), 400

        df['ds'] = pd.to_datetime(
            df['ds'],
            errors='coerce'
        )

        df['y'] = pd.to_numeric(
            df['y'],
            errors='coerce'
        )

        df = df.dropna(
            subset=['ds', 'y']
        )

        if len(df) < 5:
            return jsonify({
                "error": "Not enough valid data after cleaning"
            }), 400

        # Combine duplicate dates
        df = (
            df.groupby(
                'ds',
                as_index=False
            )['y']
            .sum()
        )

        df = df.sort_values('ds')

        # Fill missing dates
        date_range = pd.date_range(
            df['ds'].min(),
            df['ds'].max()
        )

        df = (
            df.set_index('ds')
            .reindex(
                date_range,
                fill_value=0
            )
            .reset_index()
        )

        df.columns = ['ds', 'y']

        if len(df) < 5:
            return jsonify({
                "error": "Not enough historical dates"
            }), 400

        # Prophet
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.3,
            interval_width=0.8
        )

        model.fit(df)

        future = model.make_future_dataframe(
            periods=periods
        )

        forecast = model.predict(future)

        future_only = forecast[
            forecast['ds'] > df['ds'].max()
        ]

        result = []

        for _, row in future_only.iterrows():

            result.append({
                "date": row['ds'].strftime('%Y-%m-%d'),

                "predictedQty": max(
                    0,
                    round(
                        float(row['yhat']),
                        2
                    )
                ),

                "lower": max(
                    0,
                    round(
                        float(row['yhat_lower']),
                        2
                    )
                ),

                "upper": max(
                    0,
                    round(
                        float(row['yhat_upper']),
                        2
                    )
                )
            })

        total_demand = sum(
            item['predictedQty']
            for item in result
        )

        recent_avg = float(
            df['y'].tail(7).mean()
        )

        older_avg = (
            float(
                df['y'].iloc[-30:-7].mean()
            )
            if len(df) > 30
            else recent_avg
        )

        if recent_avg > older_avg * 1.1:
            trend = "RISING"

        elif recent_avg < older_avg * 0.9:
            trend = "FALLING"

        else:
            trend = "STABLE"

        accuracy = None

        if len(df) >= 17:

            try:

                train = df.iloc[:-7]
                test = df.iloc[-7:]

                model2 = Prophet(
                    daily_seasonality=False,
                    weekly_seasonality=True,
                    yearly_seasonality=False
                )

                model2.fit(train)

                forecast2 = model2.predict(
                    model2.make_future_dataframe(
                        periods=7
                    )
                )

                predictions = (
                    forecast2['yhat']
                    .iloc[-7:]
                    .values
                )

                actuals = test['y'].values

                mae = float(
                    mean_absolute_error(
                        actuals,
                        predictions
                    )
                )

                rmse = float(
                    math.sqrt(
                        mean_squared_error(
                            actuals,
                            predictions
                        )
                    )
                )

                mape = float(
                    np.mean(
                        np.abs(
                            (
                                actuals -
                                predictions
                            ) /
                            (actuals + 1e-5)
                        )
                    ) * 100
                )

                accuracy = {
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "mape": round(mape, 2),
                    "accuracy_pct": round(
                        max(0, 100 - mape),
                        1
                    )
                }

            except Exception as accuracy_error:

                print(
                    "Accuracy calculation failed:",
                    accuracy_error
                )

        return jsonify({

            "forecast": result,

            "totalPredictedDemand": round(
                total_demand,
                2
            ),

            "forecastDays": periods,

            "trend": trend,

            "accuracy": accuracy,

            "modelInfo": {
                "dataPointsUsed": len(df),
                "algorithm": "Facebook Prophet",
                "avgDailySales": round(
                    float(df['y'].mean()),
                    2
                )
            }

        }), 200

    except Exception as e:

        print(
            "❌ Prediction error:",
            repr(e)
        )

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == '__main__':

    port = int(
        os.environ.get(
            'PORT',
            8000
        )
    )

    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )