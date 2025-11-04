"""
Fraud Detection Model

This module contains the FraudDetector class which encapsulates the machine learning
model for credit card fraud detection.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple

class FraudDetector:
    """
    A class to handle fraud detection using a trained machine learning model.
    
    This class provides methods to load a pre-trained model, make predictions,
    and evaluate model performance.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the FraudDetector.
        
        Args:
            model_path: Path to a pre-trained model file. If None, a new model will be created.
        """
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_path = model_path
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        **model_params
    ) -> Dict[str, Any]:
        """
        Train the fraud detection model.
        
        Args:
            X_train: Training features
            y_train: Training labels
            **model_params: Additional parameters for the model
            
        Returns:
            Dictionary containing training results
        """
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import classification_report, confusion_matrix
        
        # Optimized parameters for better accuracy while maintaining good speed
        n_samples = len(X_train)
        # Adjust parameters based on dataset size
        if n_samples < 1000:
            n_estimators = 50
            max_depth = 10
        elif n_samples < 5000:
            n_estimators = 30
            max_depth = 8
        else:
            n_estimators = 25
            max_depth = 6
            
        params = {
            'n_estimators': n_estimators,
            'max_depth': max_depth,
            'min_samples_split': 10,
            'min_samples_leaf': 5,
            'class_weight': 'balanced',
            'random_state': 42,
            'n_jobs': -1,
            'max_features': 'sqrt',
            'bootstrap': True,
            'oob_score': True  # Use out-of-bag samples for better validation
        }
        
        # Update with any provided parameters
        params.update(model_params)
        
        # Initialize and train the model
        self.model = RandomForestClassifier(**params)
        self.model.fit(X_train, y_train)
        
        # Store feature names for reference
        self.feature_names = list(X_train.columns)
        
        # Get predictions and probabilities
        y_pred = self.model.predict(X_train)
        # Handle case where only one class is present
        if len(self.model.classes_) == 2:
            y_pred_proba = self.model.predict_proba(X_train)[:, 1]
        else:
            # If only one class, create dummy probabilities
            y_pred_proba = np.zeros(len(y_pred))
            if self.model.classes_[0] == 1:
                y_pred_proba = np.ones(len(y_pred))
        
        # Calculate metrics
        report = classification_report(y_train, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_train, y_pred).tolist()
        
        return {
            'model_type': 'RandomForestClassifier',
            'parameters': params,
            'training_metrics': report,
            'confusion_matrix': conf_matrix,
            'feature_importances': dict(zip(self.feature_names, self.model.feature_importances_)),
            'feature_names': self.feature_names
        }
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions on new data.
        
        Args:
            X: Input features for prediction
            
        Returns:
            Array of predicted class labels (0 for legitimate, 1 for fraud)
        """
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")
        return self.model.predict(X)
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict class probabilities.
        
        Args:
            X: Input features for prediction
            
        Returns:
            Array of predicted probabilities for each class
        """
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")
        return self.model.predict_proba(X)
    
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        """
        Evaluate the model on test data.
        
        Args:
            X_test: Test features
            y_test: True labels for test data
            
        Returns:
            Dictionary containing evaluation metrics
        """
        from sklearn.metrics import (
            classification_report, 
            confusion_matrix,
            roc_auc_score,
            average_precision_score,
            precision_recall_curve,
            roc_curve
        )
        
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")
        
        # Make predictions
        y_pred = self.predict(X_test)
        y_pred_proba = self.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        report = classification_report(y_test, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        pr_auc = average_precision_score(y_test, y_pred_proba)
        
        # Calculate precision-recall curve
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        
        # Calculate ROC curve
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        
        return {
            'classification_report': report,
            'confusion_matrix': conf_matrix,
            'roc_auc': roc_auc,
            'pr_auc': pr_auc,
            'precision_recall': {
                'precision': precision.tolist(),
                'recall': recall.tolist()
            },
            'roc_curve': {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist()
            }
        }
    
    def save_model(self, filepath: str):
        """
        Save the trained model to disk.
        
        Args:
            filepath: Path where the model should be saved
        """
        if self.model is None:
            raise ValueError("No model to save")
            
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'model_type': 'RandomForestClassifier'
        }
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath: str):
        """
        Load a trained model from disk.
        
        Args:
            filepath: Path to the saved model file
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
            
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.feature_names = model_data.get('feature_names')
        self.model_path = filepath
        
        return self
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importances from the trained model.
        
        Returns:
            Dictionary mapping feature names to their importance scores
        """
        if self.model is None or not hasattr(self.model, 'feature_importances_'):
            return {}
            
        if self.feature_names is None:
            self.feature_names = [f"feature_{i}" for i in range(len(self.model.feature_importances_))]
            
        return dict(zip(self.feature_names, self.model.feature_importances_))
