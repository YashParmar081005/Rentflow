
# 🏡 Rentflow

Rentflow is a full-stack rental marketplace web application that allows users to explore, list, and manage rental properties in a simple and intuitive way. The project is divided into a modern frontend and a robust backend API.

---

## 📖 About the Project

Rentflow is designed to connect property owners and renters on a single platform. Users can browse rental properties, create listings, and manage their accounts. The application follows a clean full-stack architecture with separate frontend and backend folders.

---

## ✨ Features

- User authentication (Sign up / Login)
- Browse rental property listings
- Add, edit, and delete property listings
- Search and filter properties
- Responsive and user-friendly UI
- RESTful backend API

---

## 🧠 Tech Stack

**Frontend**
- React
- Vite
- HTML, CSS, JavaScript

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB

**Other Tools**
- JWT Authentication
- REST API
- Git & GitHub

---

## 📁 Project Structure

```

Rentflow/
│
├── rently-suite/        # Frontend application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── server/              # Backend application
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── index.js
│   └── ...
│
├── .gitignore
└── README.md

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YashParmar081005/Rentflow.git
cd Rentflow
````

---

## 🔐 Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
DB_URI=your_database_uri
JWT_SECRET=your_secret_key
```

For frontend (`rently-suite`):

```env
VITE_API_URL=http://localhost:5000
```

---

## ▶️ Running the Application

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd rently-suite
npm install
npm run dev
```

Open your browser and visit:

```
http://localhost:3000
```

---

## 📡 API Overview

| Endpoint            | Method | Description        |
| ------------------- | ------ | ------------------ |
| /api/auth/signup    | POST   | Register user      |
| /api/auth/login     | POST   | Login user         |
| /api/properties     | GET    | Get all properties |
| /api/properties     | POST   | Add property       |
| /api/properties/:id | GET    | Get property by ID |
| /api/properties/:id | PUT    | Update property    |
| /api/properties/:id | DELETE | Delete property    |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Yash Parmar**
GitHub: [@YashParmar081005](https://github.com/YashParmar081005)

---

⭐ If you like this project, don’t forget to give it a star!

```

