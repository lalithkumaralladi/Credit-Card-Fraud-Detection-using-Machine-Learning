"""
Data Processing Module

This module contains the DataProcessor class which handles data loading,
preprocessing, and feature engineering for the fraud detection system.
"""

import os
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, RobustScaler
from imblearn.over_sampling import SMOTE
import joblib
from functools import lru_cache
import pyarrow.parquet as pq
import pyarrow as pa
from pathlib import Path
import time

class DataProcessor:
    """
    A class to handle data loading, preprocessing, and feature engineering
    for the fraud detection system.
    """
    
    def __init__(self, scaler: Optional[Any] = None):
        """
        Initialize the DataProcessor.
        
        Args:
            scaler: Pre-fitted scaler object. If None, a new scaler will be created when needed.
        """
        self.scaler = scaler
        self.feature_columns = None
        self.target_column = 'Class'
    
    @lru_cache(maxsize=32)
    def _load_csv_cached(self, filepath: str, file_mtime: float) -> pd.DataFrame:
        """Cached version of CSV loading to avoid repeated I/O."""
        # Use pandas with optimized parameters for faster CSV reading
        return pd.read_csv(
            filepath,
            engine='c',  # Use C engine for better performance
            dtype=np.float32,  # Use float32 to save memory
            low_memory=False,  # Avoid chunking for better performance
            memory_map=True,  # Memory map file for large files
            encoding='utf-8',
            compression='infer'  # Auto-detect compression
        )

    def load_data(self, filepath: str) -> pd.DataFrame:
        """
        Load and validate the input CSV file with optimizations.
        
        Args:
            filepath: Path to the CSV file
            
        Returns:
            Loaded and validated pandas DataFrame
            
        Raises:
            ValueError: If the file is not found or has invalid format
        """
        filepath = str(Path(filepath).resolve())
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
            
        try:
            # Get file modification time for cache invalidation
            file_mtime = os.path.getmtime(filepath)
            
            # Check if we have a cached parquet version that's up to date
            parquet_path = f"{filepath}.parquet"
            if os.path.exists(parquet_path) and os.path.getmtime(parquet_path) > file_mtime:
                # Load from parquet if it's newer than the source file
                df = self._optimize_dataframe(pd.read_parquet(parquet_path))
                
            # Otherwise load from CSV and cache as parquet
            else:
                df = self._load_csv_cached(filepath, file_mtime)
                df = self._optimize_dataframe(df)
                df.to_parquet(parquet_path, compression='snappy')
            
            # Basic validation - make Class optional for prediction-only files
            required_columns = ['Time', 'Amount']
            for col in required_columns:
                if col not in df.columns:
                    raise ValueError(f"Required column '{col}' not found in the dataset")
            
            # If Class column doesn't exist, create a dummy one for processing
            if 'Class' not in df.columns:
                df['Class'] = 0  # Default to non-fraud
            
            return df
            
        except Exception as e:
            raise ValueError(f"Error loading data: {str(e)}")
    
    def _optimize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Optimize DataFrame memory usage by downcasting numeric columns."""
        # Downcast numeric columns to save memory
        for col in df.select_dtypes(include=['int']).columns:
            df[col] = pd.to_numeric(df[col], downcast='integer')
            
        for col in df.select_dtypes(include=['float']).columns:
            df[col] = pd.to_numeric(df[col], downcast='float')
            
        # Convert object columns to category if they have low cardinality
        for col in df.select_dtypes(include=['object']).columns:
            if df[col].nunique() / len(df) < 0.5:  # If less than 50% unique values
                df[col] = df[col].astype('category')
                
        return df
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Preprocess the input data with optimizations.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Tuple of (processed DataFrame, preprocessing metadata)
        """
        start_time = time.time()
        
        # Optimize DataFrame memory usage
        df = self._optimize_dataframe(df)
        
        # Store metadata about the preprocessing
        metadata = {
            'original_columns': df.columns.tolist(),
            'preprocessing_steps': []
        }
        
        def add_step(step: str):
            metadata['preprocessing_steps'].append(f"{step} (took {time.time() - start_time:.2f}s)")
            return time.time()
        
        _ = add_step("Initialization")
        
        # 1. Handle missing values if any
        if df.isnull().any().any():
            # For numerical columns, fill with median (more robust to outliers)
            num_cols = df.select_dtypes(include=['number']).columns[df.select_dtypes(include=['number']).isnull().any()]
            if len(num_cols) > 0:
                medians = df[num_cols].median()
                df[num_cols] = df[num_cols].fillna(medians)
                
            # For categorical columns, fill with mode
            cat_cols = df.select_dtypes(include=['object', 'category']).columns[df.select_dtypes(include=['object', 'category']).isnull().any()]
            if len(cat_cols) > 0:
                modes = df[cat_cols].mode().iloc[0] if not df[cat_cols].mode().empty else 'Unknown'
                df[cat_cols] = df[cat_cols].fillna(modes)
                
            _ = add_step("Handled missing values")
        
        # 2. Create time-based features
        df = self._add_time_features(df)
        
        # 3. Create amount-based features
        df = self._add_amount_features(df)
        
        # 4. Drop original columns that have been transformed
        columns_to_drop = ['Time']  # Keep 'Amount' as it's used in some models
        df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])
        
        # Convert categorical variables to numerical - optimized with category codes
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        if len(categorical_cols) > 0:
            # For low-cardinality columns, use category codes for better performance
            for col in categorical_cols:
                if df[col].nunique() < 50:  # Threshold for using category codes
                    df[col] = df[col].astype('category').cat.codes
                else:
                    # For high-cardinality, use get_dummies but with sparse=True
                    dummies = pd.get_dummies(df[col], prefix=col, sparse=True)
                    df = pd.concat([df.drop(col, axis=1), dummies], axis=1)
                    
            metadata['categorical_columns'] = categorical_cols.tolist()
            _ = add_step("Processed categorical variables")
        
        # Add total preprocessing time
        metadata['total_preprocessing_time'] = f"{time.time() - start_time:.2f} seconds"
        
        return df, metadata
    
    def _add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add time-based features to the dataset.
        
        Args:
            df: Input DataFrame with 'Time' column
            
        Returns:
            DataFrame with added time-based features
        """
        if 'Time' not in df.columns:
            return df
            
        # Convert Time from seconds to hours of the day
        df['Hour'] = df['Time'] % (24 * 3600) // 3600
        
        # Create cyclical time features
        df['Hour_sin'] = np.sin(2 * np.pi * df['Hour']/24.0)
        df['Hour_cos'] = np.cos(2 * np.pi * df['Hour']/24.0)
        
        return df
    
    def _add_amount_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add amount-based features to the dataset.
        
        Args:
            df: Input DataFrame with 'Amount' column
            
        Returns:
            DataFrame with added amount-based features
        """
        if 'Amount' not in df.columns:
            return df
            
        # Log transform amount to handle skewness
        df['Amount_log'] = np.log1p(df['Amount'])
        
        # Create amount bins
        df['Amount_bin'] = pd.qcut(df['Amount'], q=10, labels=False, duplicates='drop')
        
        return df
    
    def split_data(
        self, 
        df: pd.DataFrame, 
        test_size: float = 0.3, 
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Split data into training and testing sets.
        
        Args:
            df: Input DataFrame
            test_size: Proportion of data to use for testing
            random_state: Random seed for reproducibility
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        X = df.drop(self.target_column, axis=1)
        y = df[self.target_column]
        
        # Store feature columns for later use
        self.feature_columns = X.columns.tolist()
        
        # Stratified split to maintain class distribution
        # Optimize: Use smaller test size for large datasets
        if len(df) > 100000:
            test_size = 0.2  # Use 20% for large datasets
        
        # Check if we can stratify
        stratify_param = None
        if len(y.unique()) == 2 and len(y) > 100:
            try:
                stratify_param = y
            except:
                stratify_param = None
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state, 
            stratify=stratify_param
        )
        
        return X_train, X_test, y_train, y_test
    
    def scale_features(
        self, 
        X_train: pd.DataFrame, 
        X_test: Optional[pd.DataFrame] = None,
        method: str = 'robust'
    ) -> Tuple[pd.DataFrame, Optional[pd.DataFrame]]:
        """
        Scale the features using the specified method.
        
        Args:
            X_train: Training features
            X_test: Optional test features to scale using the same scaler
            method: Scaling method ('standard' or 'robust')
            
        Returns:
            Tuple of (scaled_X_train, scaled_X_test) or just scaled_X_train if X_test is None
        """
        # Scale numerical features - optimized with inplace operations
        numerical_cols = X_train.select_dtypes(include=['number']).columns
        if len(numerical_cols) > 0:
            if self.scaler is None:
                self.scaler = RobustScaler()  # More robust to outliers than StandardScaler
                # Use transform with output as numpy array for better performance
                scaled = self.scaler.fit_transform(X_train[numerical_cols])
            else:
                scaled = self.scaler.transform(X_train[numerical_cols])
                
            # Convert back to DataFrame in one operation
            X_train = X_train.drop(columns=numerical_cols)
            X_train[numerical_cols] = scaled
                
            if X_test is not None:
                X_test_scaled = self.scaler.transform(X_test)
                X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns, index=X_test.index)
        
        return X_train, X_test_scaled
    
    def handle_class_imbalance(
        self, 
        X: pd.DataFrame, 
        y: pd.Series,
        sampling_strategy: str = 'auto',
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Handle class imbalance using SMOTE.
        
        Args:
            X: Features
            y: Target variable
            sampling_strategy: Sampling strategy for SMOTE
            random_state: Random seed for reproducibility
            
        Returns:
            Tuple of resampled (X_resampled, y_resampled)
        """
        try:
            # Convert to numpy if needed
            if isinstance(X, pd.DataFrame):
                X_values = X.values
            else:
                X_values = X
                
            if isinstance(y, pd.Series):
                y_values = y.values
            else:
                y_values = y
            
            # Use smaller sampling strategy for speed
            if len(X_values) > 10000:
                sampling_strategy = 0.5
            
            smote = SMOTE(
                sampling_strategy=sampling_strategy,
                random_state=random_state,
                n_jobs=-1,
                k_neighbors=3  # Reduced for speed
            )
            
            X_resampled, y_resampled = smote.fit_resample(X_values, y_values)
            
            # Convert back to DataFrame if original was DataFrame
            if isinstance(X, pd.DataFrame):
                X_resampled = pd.DataFrame(X_resampled, columns=X.columns)
            
            return X_resampled, y_resampled
        except Exception as e:
            print(f"SMOTE failed, using original data: {str(e)}")
            return X, y
    
    def save_processor(self, filepath: str):
        """
        Save the data processor object to disk.
        
        Args:
            filepath: Path where the processor should be saved
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        processor_data = {
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column
        }
        joblib.dump(processor_data, filepath)
    
    @classmethod
    def load_processor(cls, filepath: str) -> 'DataProcessor':
        """
        Load a saved data processor from disk.
        
        Args:
            filepath: Path to the saved processor file
            
        Returns:
            Loaded DataProcessor instance
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Processor file not found: {filepath}")
            
        processor_data = joblib.load(filepath)
        processor = cls(scaler=processor_data['scaler'])
        processor.feature_columns = processor_data['feature_columns']
        processor.target_column = processor_data.get('target_column', 'Class')
        
        return processor
