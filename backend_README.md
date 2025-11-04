# Credit Card Fraud Detection Backend

This is the backend service for the Credit Card Fraud Detection system, built with FastAPI. It provides endpoints for uploading transaction data, training fraud detection models, and making predictions.

## Features

- File upload and processing for transaction data
- Data preprocessing and feature engineering
- Handling of class imbalance using SMOTE
- Model training with Random Forest
- Model evaluation with comprehensive metrics
- API endpoints for predictions

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd credit-card-fraud-detection
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create required directories**
   ```bash
   mkdir -p uploads models reports
   ```

## Running the Application

1. **Start the FastAPI server**
   ```bash
   uvicorn main:app --reload
   ```

2. **Access the API documentation**
   Open your browser and go to: http://localhost:8000/docs

## API Endpoints

### 1. Upload and Process Data
- **POST** `/api/upload`
  - Upload a CSV file containing transaction data
  - The file should include at least these columns: `Time`, `Amount`, and `Class` (0 for legitimate, 1 for fraud)
  - Returns model evaluation metrics and training results

### 2. Make Predictions
- **GET** `/api/predict`
  - Make predictions on new transaction data
  - Parameters:
    - `amount`: Transaction amount
    - `time`: Transaction time in seconds
    - `features`: JSON string of additional features

### 3. Get Latest Report
- **GET** `/api/reports/latest`
  - Get the latest model evaluation report
  - Includes metrics like accuracy, precision, recall, and confusion matrix

## Data Format

The input CSV file should have the following format:

```
Time,V1,V2,V3,...,V28,Amount,Class
0,-1.359807134,-0.072781173,2.536346738,...,-0.021053053,149.62,0
0,1.191857111,0.266150712,0.166480113,...,0.014724387,2.69,0
```

Where:
- `Time`: Number of seconds elapsed between this transaction and the first transaction in the dataset
- `V1-V28`: Anonymized features
- `Amount`: Transaction amount
- `Class`: 0 for legitimate, 1 for fraud

## Model Details

- **Algorithm**: Random Forest Classifier
- **Preprocessing**:
  - Robust scaling of numerical features
  - Time-based feature engineering
  - Handling of class imbalance using SMOTE
- **Evaluation Metrics**:
  - Accuracy
  - Precision
  - Recall
  - F1-Score
  - ROC-AUC
  - Precision-Recall AUC

## Deployment

For production deployment, consider using:

1. **Gunicorn** as the ASGI server
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

2. **Docker** containerization
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   RUN mkdir -p uploads models reports
   
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

## License

This project is licensed under the MIT License.
