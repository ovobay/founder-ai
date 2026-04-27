# SaaS App

A simple SaaS app built with Next.js 13 (App Router), TypeScript, and Tailwind CSS.

## Features

- User authentication (signup/login) with JWT and bcrypt
- Project and task management
- Team collaboration
- Real-time updates placeholder
- Analytics & reports placeholder

## Getting Started

1. Clone the repository:

```bash
git clone <repo-url>
cd saas-app
```

2. Install dependencies:

```bash
npm install
```

3. Set environment variables:

Create a `.env` file in the root with the following variables:

```
DATABASE_URL="your_database_url_here"
JWT_SECRET="your_jwt_secret_here"
```

4. Run database migrations (using Prisma):

```bash
npx prisma migrate dev --name init
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `lib/` - Configuration and utilities
- `prisma/` - Prisma schema and migrations

## Next Steps

- Implement API routes for authentication and project management
- Add database integration with Prisma
- Add interactive React components for project/task CRUD
- Add team collaboration features
- Add payment integration for subscription plans

## License

MIT License

---

This is a starter SaaS app template to build upon.

---

# Prisma Schema (example)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  projects  Project[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  assignedTo  String?
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# Environment Variables

- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing

---

# Notes

This app is a foundation for a SaaS product with user authentication and project management. It uses Next.js 13 App Router and Tailwind CSS for styling. The backend uses Prisma ORM with PostgreSQL. Authentication uses JWT and bcrypt for password hashing.

---

# License

MIT