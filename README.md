# MAISON — E-Commerce Platform

A modern, responsive e-commerce platform built to deliver an elegant and intuitive online shopping experience.

**Built with Nuxt 4, Vue 3, TypeScript, Tailwind CSS, and Supabase.**

[GitHub Repository](https://github.com/PEC-TECH01/maison-ecommerce)

---

## Overview

Maison is a modern e-commerce web application focused on combining a clean visual experience with practical online shopping functionality.

The project demonstrates the development of a responsive storefront using modern frontend technologies, component-based architecture, and Supabase integration.

## Technology Stack

| Technology | Purpose |
|---|---|
| Nuxt 4 | Application framework |
| Vue 3 | User interface development |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and responsive layouts |
| Supabase | Backend service and database integration |

## Features

- Modern e-commerce storefront
- Responsive user interface
- Product browsing experience
- Interactive shopping interface
- Supabase integration
- Component-based application structure

## Project Structure

```text
maison-ecommerce/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css
│   ├── pages/
│   │   └── index.vue
│   ├── plugins/
│   │   └── supabase.client.ts
│   └── app.vue
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── nuxt.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/PEC-TECH01/maison-ecommerce.git
```

### 2. Navigate to the project directory

```bash
cd maison-ecommerce
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory and configure the Supabase credentials using the exact variable names required by the project configuration.

Never commit your `.env` file or expose private credentials.

### 5. Run the development server

```bash
npm run dev
```

Open the application at:

`http://localhost:3000`

## Production Build

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Security

- Environment variables should remain outside version control.
- Never expose private API keys or database credentials.
- Configure appropriate Supabase access policies.

## Author

**PEC-TECH01**

GitHub: [https://github.com/PEC-TECH01](https://github.com/PEC-TECH01)

Project Repository: [maison-ecommerce](https://github.com/PEC-TECH01/maison-ecommerce)

---

## License

No open-source license has been specified for this project.
