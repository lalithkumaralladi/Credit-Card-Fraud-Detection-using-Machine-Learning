# Credit Card Fraud Detection Web Application

A comprehensive web application for detecting fraudulent credit card transactions using machine learning. This application provides a user-friendly interface for uploading transaction data, analyzing it for potential fraud, and visualizing the results.

## Features

- **User Authentication**: Secure login and registration system with email/password and Google sign-in
- **Data Upload**: Easy CSV file upload for transaction data
- **Fraud Detection**: Advanced machine learning models to identify suspicious transactions
- **Interactive Dashboards**: Visualize transaction data with interactive charts and graphs
- **Detailed Reports**: Generate and download comprehensive fraud detection reports
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Tailwind CSS
- **Charts**: Chart.js
- **Authentication**: Firebase Authentication
- **Database**: Firestore (for user data)
- **Icons**: Font Awesome
- **Deployment**: Netlify (or your preferred hosting)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/credit-card-fraud-detection.git
   cd credit-card-fraud-detection
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Email/Password and Google authentication methods
   - Create a Firestore database
   - Get your Firebase configuration object

4. Configure the application:
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
credit-card-fraud-detection/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── app.js          # Main application logic
│   ├── auth.js         # Authentication logic
│   └── charts.js       # Chart visualizations
├── assets/             # Images and other static files
└── README.md           # Project documentation
```

## Usage

1. **Sign Up / Log In**: Create an account or sign in using your Google account
2. **Upload Data**: Click "Upload CSV" to upload your transaction data
3. **Analyze**: Click "Analyze" to process the data and detect potential fraud
4. **View Results**: Explore the interactive dashboard with visualizations
5. **Download Reports**: Generate and download detailed reports of the analysis

## Data Format

The application expects CSV files with the following columns (case-sensitive):

```
Time, V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, ..., V28, Amount, Class
```

Where:
- `Time`: Number of seconds elapsed between this transaction and the first transaction
- `V1-V28`: Anonymized features (result of PCA transformation)
- `Amount`: Transaction amount
- `Class`: 0 for legitimate, 1 for fraudulent (optional, for evaluation)

## Customization

### Styling

- The application uses Tailwind CSS for styling. You can customize the theme in the `tailwind.config.js` file.
- Custom styles can be added to `css/styles.css`.

### Machine Learning Model

To integrate your own machine learning model:

1. Train your model and export it to a compatible format (e.g., TensorFlow.js, ONNX, or a REST API)
2. Update the prediction logic in `app.js` to use your model
3. Modify the data preprocessing in `app.js` to match your model's input requirements

## Deployment

### Netlify

1. Push your code to a GitHub repository
2. Log in to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Select your repository and branch
5. Set the build command: `npm run build` or `yarn build`
6. Set the publish directory: `dist`
7. Add your environment variables in the Netlify dashboard
8. Click "Deploy site"

### Firebase Hosting

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your Firebase project
   - Set the public directory to `dist`
   - Configure as a single-page app: Yes
   - Set up automatic builds: No

4. Build your project:
   ```bash
   npm run build
   # or
   yarn build
   ```

5. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Chart.js](https://www.chartjs.org/) for beautiful, interactive charts
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Firebase](https://firebase.google.com/) for authentication and hosting
- [Font Awesome](https://fontawesome.com/) for icons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
