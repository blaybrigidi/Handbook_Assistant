# HandBookBot

An intelligent chatbot assistant that helps students navigate the Ashesi Student Handbook. Built with React frontend and Python Flask backend.

## 🚀 Features

- **Interactive Chat Interface**: Modern, responsive chat UI built with React and Tailwind CSS
- **Handbook Knowledge**: AI-powered responses about Ashesi University policies and procedures
- **Beautiful Design**: Gradient themes and smooth animations using Framer Motion
- **Real-time Communication**: Fast API responses with axios integration

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern UI framework
- **Tailwind CSS v3** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Heroicons** - Beautiful SVG icons
- **CRACO** - Create React App Configuration Override

### Backend

- **Python Flask** - Web framework
- **Flask-CORS** - Cross-Origin Resource Sharing

## 📁 Project Structure

```
HandBookBot/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind configuration
├── backend/                # Flask API (if exists)
├── app.py                 # Main Flask application
├── test_connection.py     # Connection testing
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd HandBookBot
   ```

2. **Set up the Frontend**

   ```bash
   cd frontend
   npm install
   ```

3. **Set up the Backend**

   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate

   # Install dependencies
   pip install flask flask-cors
   ```

### Running the Application

1. **Start the Backend Server**

   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The app will be available at `http://localhost:3000`

## 🎨 Design Features

- **Gradient Themes**: Beautiful orange-to-red gradients matching Ashesi branding
- **Glass Morphism**: Modern glassmorphism effects with backdrop filters
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Smooth Animations**: Framer Motion animations for enhanced UX
- **Custom Scrollbars**: Styled scrollbars for chat interface

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS v3 with custom configuration:

- Custom colors for Ashesi branding
- Extended animations and keyframes
- Inter font family integration

### PostCSS

Configured with:

- Tailwind CSS processing
- Autoprefixer for browser compatibility

## 📝 Development Notes

- **CRACO Configuration**: Used to override Create React App webpack settings
- **Polyfill Setup**: Configured for browser compatibility with Node.js modules
- **ESLint Warnings**: Currently has some unused imports that can be cleaned up

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 About Ashesi University

This project is designed to help students navigate Ashesi University's student handbook and policies. For more information about Ashesi University, visit [ashesi.edu.gh](https://ashesi.edu.gh).

## 🔗 Links

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

Built with ❤️ for the Ashesi University community
