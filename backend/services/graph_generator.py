"""
Graph Generation Service

This module handles the generation of visualizations and graphs
for fraud detection analysis using matplotlib and seaborn.
"""

import os
import base64
import io
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import json

# Set style
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except OSError:
    try:
        plt.style.use('seaborn-darkgrid')
    except OSError:
        plt.style.use('default')
sns.set_palette("husl")


class GraphGenerator:
    """
    A class to generate various graphs and visualizations for fraud detection.
    """
    
    def __init__(self, output_dir: Optional[str] = None):
        """
        Initialize the GraphGenerator.
        
        Args:
            output_dir: Directory to save generated graphs. If None, uses temp directory.
        """
        if output_dir is None:
            self.output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "static", "graphs")
        else:
            self.output_dir = output_dir
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Set matplotlib parameters for better quality
        plt.rcParams['figure.figsize'] = (12, 8)
        plt.rcParams['figure.dpi'] = 100
        plt.rcParams['savefig.bbox'] = 'tight'
        plt.rcParams['savefig.facecolor'] = 'white'
    
    def generate_class_distribution_chart(
        self, 
        data: Dict[str, Any],
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a pie/donut chart showing class distribution.
        
        Args:
            data: Dictionary containing genuineCount and fraudulentCount
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(10, 8))
        
        labels = ['Genuine', 'Fraudulent']
        sizes = [
            data.get('genuineCount', 0),
            data.get('fraudulentCount', 0)
        ]
        colors = ['#10b981', '#ef4444']
        explode = (0, 0.1)  # Explode the fraudulent slice
        
        # Create pie chart
        wedges, texts, autotexts = ax.pie(
            sizes,
            explode=explode,
            labels=labels,
            colors=colors,
            autopct='%1.1f%%',
            shadow=True,
            startangle=90,
            textprops={'fontsize': 14, 'fontweight': 'bold'}
        )
        
        # Enhance text
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
        
        ax.set_title('Transaction Class Distribution', fontsize=18, fontweight='bold', pad=20)
        
        # Convert to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_amount_distribution_histogram(
        self,
        df: pd.DataFrame,
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a histogram showing transaction amount distribution.
        
        Args:
            df: DataFrame with transaction data
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        
        if 'Amount' in df.columns:
            # Sample for faster processing on large datasets
            if len(df) > 100000:
                df = df.sample(n=100000, random_state=42)
            amounts = df['Amount'].dropna()
            
            # Create histogram
            n, bins, patches = ax.hist(
                amounts,
                bins=50,
                color='#3b82f6',
                alpha=0.7,
                edgecolor='black',
                linewidth=1.2
            )
            
            # Color code by amount (fraudulent transactions are usually higher)
            if 'Class' in df.columns:
                fraud_amounts = df[df['Class'] == 1]['Amount'].dropna()
                if len(fraud_amounts) > 0:
                    ax.hist(
                        fraud_amounts,
                        bins=50,
                        color='#ef4444',
                        alpha=0.8,
                        label='Fraudulent Transactions',
                        edgecolor='black',
                        linewidth=1.2
                    )
            
            ax.set_xlabel('Transaction Amount ($)', fontsize=12, fontweight='bold')
            ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
            ax.set_title('Transaction Amount Distribution', fontsize=16, fontweight='bold', pad=15)
            ax.legend(fontsize=11)
            ax.grid(True, alpha=0.3)
        else:
            ax.text(0.5, 0.5, 'Amount data not available', 
                   ha='center', va='center', fontsize=14, transform=ax.transAxes)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_confusion_matrix_heatmap(
        self,
        confusion_matrix: list,
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a heatmap for the confusion matrix.
        
        Args:
            confusion_matrix: 2x2 confusion matrix as list of lists
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Convert to numpy array
        cm = np.array(confusion_matrix)
        
        # Create heatmap
        sns.heatmap(
            cm,
            annot=True,
            fmt='d',
            cmap='RdYlGn_r',
            xticklabels=['Genuine', 'Fraudulent'],
            yticklabels=['Genuine', 'Fraudulent'],
            ax=ax,
            cbar_kws={'label': 'Count'},
            linewidths=2,
            linecolor='black',
            annot_kws={'fontsize': 16, 'fontweight': 'bold'}
        )
        
        ax.set_xlabel('Predicted', fontsize=14, fontweight='bold')
        ax.set_ylabel('Actual', fontsize=14, fontweight='bold')
        ax.set_title('Confusion Matrix Heatmap', fontsize=16, fontweight='bold', pad=15)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_metrics_bar_chart(
        self,
        metrics: Dict[str, float],
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a bar chart showing model performance metrics.
        
        Args:
            metrics: Dictionary with accuracy, precision, recall, f1_score
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        
        metric_names = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
        metric_values = [
            metrics.get('accuracy', 0) * 100,
            metrics.get('precision', 0) * 100,
            metrics.get('recall', 0) * 100,
            metrics.get('f1_score', 0) * 100
        ]
        
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
        bars = ax.bar(metric_names, metric_values, color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)
        
        # Add value labels on bars
        for bar, value in zip(bars, metric_values):
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width() / 2., height,
                f'{value:.2f}%',
                ha='center', va='bottom',
                fontsize=12, fontweight='bold'
            )
        
        ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
        ax.set_title('Model Performance Metrics', fontsize=16, fontweight='bold', pad=15)
        ax.set_ylim(0, 100)
        ax.grid(True, alpha=0.3, axis='y')
        ax.set_axisbelow(True)
        
        plt.xticks(rotation=0, fontsize=11)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_feature_correlation_heatmap(
        self,
        df: pd.DataFrame,
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a correlation heatmap for features.
        
        Args:
            df: DataFrame with features
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(14, 12))
        
        # Select numeric columns only
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            # Sample data for faster computation on large datasets
            if len(df) > 10000:
                df = df.sample(n=10000, random_state=42)
            # Limit to top 15 features for readability
            if len(numeric_cols) > 15:
                numeric_cols = numeric_cols[:15]
            
            corr_matrix = df[numeric_cols].corr()
            
            sns.heatmap(
                corr_matrix,
                annot=True,
                fmt='.2f',
                cmap='coolwarm',
                center=0,
                square=True,
                linewidths=1,
                cbar_kws={'shrink': 0.8},
                ax=ax,
                annot_kws={'fontsize': 8}
            )
            
            ax.set_title('Feature Correlation Heatmap', fontsize=16, fontweight='bold', pad=15)
        else:
            ax.text(0.5, 0.5, 'Numeric features not available', 
                   ha='center', va='center', fontsize=14, transform=ax.transAxes)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_time_series_chart(
        self,
        df: pd.DataFrame,
        save_path: Optional[str] = None
    ) -> Tuple[str, bytes]:
        """
        Generate a time series chart of transactions.
        
        Args:
            df: DataFrame with Time column
            save_path: Optional path to save the image
            
        Returns:
            Tuple of (base64 encoded image, binary image data)
        """
        fig, ax = plt.subplots(figsize=(14, 6))
        
        if 'Time' in df.columns:
            # Sample for faster processing on large datasets
            if len(df) > 100000:
                df = df.sample(n=100000, random_state=42)
            # Convert time to hours
            df_copy = df.copy()
            df_copy['Hour'] = (df_copy['Time'] % (24 * 3600)) // 3600
            
            # Group by hour
            hourly_counts = df_copy.groupby('Hour').size()
            
            ax.plot(hourly_counts.index, hourly_counts.values, 
                   marker='o', linewidth=2, markersize=8, color='#3b82f6')
            ax.fill_between(hourly_counts.index, hourly_counts.values, alpha=0.3, color='#3b82f6')
            
            ax.set_xlabel('Hour of Day', fontsize=12, fontweight='bold')
            ax.set_ylabel('Number of Transactions', fontsize=12, fontweight='bold')
            ax.set_title('Transaction Distribution by Hour', fontsize=16, fontweight='bold', pad=15)
            ax.grid(True, alpha=0.3)
            ax.set_xticks(range(0, 24, 2))
        else:
            ax.text(0.5, 0.5, 'Time data not available', 
                   ha='center', va='center', fontsize=14, transform=ax.transAxes)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_data = img_buffer.read()
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        if save_path:
            plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
        
        plt.close(fig)
        
        return img_base64, img_data
    
    def generate_all_graphs(
        self,
        df: pd.DataFrame,
        analysis_data: Dict[str, Any],
        model_id: str
    ) -> Dict[str, str]:
        """
        Generate basic graphs (pie, histogram, bar) and return base64 images.
        
        Args:
            df: Original DataFrame
            analysis_data: Analysis results dictionary
            model_id: Unique model identifier
            
        Returns:
            Dictionary mapping graph names to base64 encoded images
        """
        graphs = {}
        
        try:
            # Pie: class distribution
            class_data = {
                'genuineCount': analysis_data.get('data', {}).get('class_distribution', {}).get('0', 0),
                'fraudulentCount': analysis_data.get('data', {}).get('class_distribution', {}).get('1', 0)
            }
            graphs['class_distribution'] = self.generate_class_distribution_chart(class_data)[0]

            # Histogram: amount distribution
            graphs['amount_distribution'] = self.generate_amount_distribution_histogram(df)[0]

            # Bar: model metrics
            metrics = analysis_data.get('data', {}).get('model_metrics', {})
            graphs['metrics_chart'] = self.generate_metrics_bar_chart(metrics)[0]

        except Exception as e:
            print(f"Error generating graphs: {str(e)}")
        
        return graphs

