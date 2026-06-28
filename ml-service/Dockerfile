FROM python:3.11-slim
WORKDIR /app

# ✅ All system deps Prophet needs
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ✅ Upgrade pip first
RUN pip install --upgrade pip setuptools wheel

# ✅ Install packages one by one (avoids conflicts)
RUN pip install --no-cache-dir numpy==1.26.2
RUN pip install --no-cache-dir pandas==2.1.4
RUN pip install --no-cache-dir pystan==3.5.0
RUN pip install --no-cache-dir prophet==1.1.5
RUN pip install --no-cache-dir scikit-learn==1.3.2
RUN pip install --no-cache-dir flask==3.0.0
RUN pip install --no-cache-dir flask-cors==4.0.0
RUN pip install --no-cache-dir gunicorn==21.2.0

# ✅ Copy app files
COPY . .

# ✅ Verify Flask app starts correctly
RUN python -c "from flask import Flask; print('Flask OK ✅')"

EXPOSE 8000

# ✅ Use gunicorn for production (more stable than flask dev server)
CMD ["gunicorn", "app:app", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "1", \
     "--timeout", "120", \
     "--preload"]