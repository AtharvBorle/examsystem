# Online School Exam Management System

An online multiple-choice question (MCQ) examination portal designed for school systems. It features multi-role dashboards, dynamic question sets, language preferences (English and Hindi), and client-side participation certificate generation.

---

## Repository Structure

*   **`backend/`**: A Next.js 14 API server that connects to a PostgreSQL database using Prisma ORM.
*   **`frontend/`**: A React 18 / Vite / TypeScript Single Page Application (SPA) styling with custom CSS.
*   **`Reference Doc/`**: Contains reference documentation for system design and requirements.

---

## Technology Stack

*   **Frontend**: React (v18), Vite, TypeScript, `jspdf` (PDF generation), `xlsx` (Excel exports), Lucide icons.
*   **Backend**: Next.js (v14), Prisma ORM, PostgreSQL, JWT (Authentication), BcryptJS (Password hashing).
*   **Database**: PostgreSQL.

---

## Getting Started

### 1. Database Setup

1.  Make sure you have a running PostgreSQL database.
2.  Navigate to the `backend/` directory and configure the environment variables:
    ```bash
    cd backend
    cp .env.example .env
    ```
3.  Open the `.env` file and set the `DATABASE_URL` to point to your PostgreSQL instance:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/examsystem?schema=public"
    JWT_SECRET="your-super-secret-key"
    ```
4.  Generate the Prisma client and push the schema to the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
5.  Seed the database with default Super Admin credentials:
    ```bash
    npx prisma db seed
    ```

### 2. Run the Backend Server

1.  From the `backend/` directory, install the required dependencies:
    ```bash
    npm install
    ```
2.  Start the development API server (runs on `http://localhost:5000`):
    ```bash
    npm run dev
    ```

### 3. Run the Frontend Application

1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install the client-side dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server (usually runs on `http://localhost:5173`):
    ```bash
    npm run dev
    ```

---

## Role Workflows

1.  **Super Admin**:
    *   Creates Admins with custom student limits (user counts).
    *   Monitors overall metrics (seeded schools, registrations, results).
2.  **Admin**:
    *   Seeds school records via CSV/Excel imports.
    *   Creates classrooms and classroom groups (e.g. Grade 10-12 Group).
    *   Uploads question banks with multi-language (en/hi) translations.
    *   Creates exams and pushes them to target schools and groups.
    *   Reviews top-3 student results per school/classroom/group and exports report tables to CSV.
3.  **Student**:
    *   Registers with first/last names, school search dropdown, classroom, and unique mobile number verified via OTP.
    *   Takes assigned examinations under a strict auto-submitting timer.
    *   Downloads a custom participation certificate PDF directly on the completion screen.
