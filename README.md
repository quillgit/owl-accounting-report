# RCT Dashboard

## 📖 Abstract

The **RCT Dashboard** was developed as a high-performance optimization layer for the **OWL Plantation System**.

The legacy main system struggled with performance issues, often loading slowly or hanging when serving complex financial data in the browser. This project addresses those bottlenecks by providing a lightweight, optimized, and modern interface for accessing critical financial modules without compromising the integrity of the underlying data.

## 🚀 Overview & Features

This application serves as a dedicated financial dashboard, offering a streamlined user experience for viewing and managing accounting records.

### Key Features
- **Dashboard**: High-level overview of key financial metrics.
- **General Ledger**: Detailed record of all financial transactions.
- **Journal Entries**: Interface for viewing and managing journal entries.
- **Trial Balance**: Summary of all ledger account balances.
- **Account Details**: Deep dive into specific account activities.
- **Performance Optimized**: Built with React and Vite for blazing fast load times.

## 🛠 Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, Sequelize
- **Database**: MySQL
- **Infrastructure**: Docker, Nginx

## ⚙️ Installation & Setup

You can run the project using **Docker** (recommended) or manually via **NPM**.

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Or Node.js (v18+) for manual setup

### Option 1: Docker (Recommended)

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd rct-dashboard
    ```

2.  **Configure Environment**
    Copy the example environment file and update the credentials:
    ```bash
    cp .env.example .env
    ```
    *Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc., in `.env`.*

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build -d
    ```
    - Client: `http://localhost`
    - Server: `http://localhost:3001`

### Option 2: Manual Setup

1.  **Install Dependencies**
    ```bash
    npm run install:all
    ```
    *(This runs npm install for root, client, and server)*

2.  **Configure Environment**
    - Create `.env` in the root directory (see `.env.example`).
    - Ensure your MySQL database is accessible.

3.  **Start Development Server**
    ```bash
    npm run dev
    ```
    - Client: `http://localhost:5173` (default Vite port)
    - Server: `http://localhost:3001`

## 🤝 Contributing

We welcome contributions to improve the RCT Dashboard!

1.  **Fork the repository**
2.  **Create a feature branch**
    ```bash
    git checkout -b feature/amazing-feature
    ```
3.  **Commit your changes**
    ```bash
    git commit -m 'Add some amazing feature'
    ```
4.  **Push to the branch**
    ```bash
    git push origin feature/amazing-feature
    ```
5.  **Open a Pull Request**

Please ensure your code follows the existing style and conventions.
