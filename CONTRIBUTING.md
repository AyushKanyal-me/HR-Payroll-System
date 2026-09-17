# Contributing to HR Pay 360

Thank you for your interest in contributing to HR Pay 
360! This document outlines our development process, standards, and guidelines.

---

## Development Prerequisites

- **Node.js**: `v20.x` LTS or higher (required)
- **npm**: `v10.x` or higher
- **Supabase Account / Project**: For database, authentication, and storage

---

## Getting Started

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/HR-Payroll-System.git
   cd HR-Payroll-System
   ```

2. **Install Dependencies**:
   ```bash
   # Install Backend Dependencies
   cd backend && npm install

   # Install Frontend Dependencies
   cd ../frontend && npm install
   ```

3. **Configure Environment Variables**:
   - Backend: Copy `backend/.env.example` to `backend/.env` and supply your Supabase keys.
   - Frontend: Copy `frontend/.env.example` to `frontend/.env`.

4. **Run the Development Servers**:
   ```bash
   # In terminal 1 (Backend)
   cd backend && npm run dev

   # In terminal 2 (Frontend)
   cd frontend && npm run dev
   ```

---

## Quality Checks & Testing

Before submitting a Pull Request, make sure all tests and typechecks pass locally:

### Backend Checks
```bash
cd backend
npm run typecheck    # TypeScript verification
npm test             # Vitest test suites (170 tests across 15 suites)
npm run build        # Production build verification
```

### Frontend Checks
```bash
cd frontend
npm run typecheck    # TypeScript verification
npm run build        # Production bundle build verification
```

---

## Coding Guidelines

- **TypeScript**: Strictest type safety. Avoid `any` types whenever possible.
- **Code Style**: Follow standard 2-space indentation (configured in `.editorconfig`).
- **Security**: Never commit actual API keys, service role keys, or secrets into git. Keep `.env` ignored.
- **Commit Messages**: Write clear, descriptive commit messages summarizing the functional changes.

---

## Pull Request Process

1. Create a feature branch from `main` (`git checkout -b feature/my-new-feature`).
2. Implement your changes following the architectural principles and test coverage expectations.
3. Verify that all 170+ backend tests pass and both frontend & backend build without error.
4. Open a Pull Request with a clear summary of your changes and test verification results.
