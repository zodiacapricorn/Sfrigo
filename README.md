# Fridge Manager App

## Project Goal

The project involves the development of a mobile application dedicated to managing and organizing food items inside a shared refrigerator.  
The goal is to provide a practical tool to monitor supplies, improve collaboration among multiple users, and reduce food waste.

## Main Features

The application is designed to:

- Reduce food waste through better control of expiration dates and available quantities  
- Facilitate food sharing among multiple users  
- Improve the organization of spaces and product categories  
- Support recipe creation based on available ingredients  

## Use Cases

The system is intended to be adopted in various contexts, including:

- Shared housing  
- Family households  
- University residences  
- Work environments  

## Vision

The goal is to provide a simple, intuitive and reliable tool that allows groups of people to collaboratively manage food items, optimizing consumption and promoting more conscious resource management.

---

# Getting Started

## Prerequisites

Make sure **Node.js** is installed on your machine:

```bash
node -v
```

If no version is returned, download and install Node.js from [nodejs.org](https://nodejs.org), restart your terminal, then run the command again.

---

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/zodiacapricorn/Sfrigo.git
cd Sfrigo\Code
```

**2. Start the services**

Each service runs in its own terminal. Open five terminal windows and run the following commands — one per terminal.

**API Gateway** — port 8080
```bash
cd api\gateway
npm install
npm start
```

**User Service** — port 8081
```bash
cd api\user-service
npm install
npm start
```

**Fridge Service** — port 8082
```bash
cd api\fridge-service
npm install
npm start
```

**Recipe Service** — port 8083
```bash
cd api\recipe-service
npm install
npm start
```

**Next.js App** — port 3000
```bash
cd code\sfrigo
npm install --legacy-peer-deps
npm run dev
```

**3. Open the app**

Once all services are running, open [http://localhost:3000](http://localhost:3000) in your browser.

# Static Analysis

Open the terminal in the project root and run:
```bash
npx eslint . -f html -o eslint-reports/eslint-report.html
```

An HTML file will be generated in the `eslint-reports/` folder containing the report of the analyzed `.js` files and any issues found.

---

# Dynamic Analysis

To run the automated tests, open a terminal, move to which api folder you want to execute tests(eg. ` cd api\user-service` ):
```bash
npm test
```

The terminal output will show the details of each executed test, with a **PASS** or **FAIL** result for each test case, the total number of tests run, and the execution time.

To generate the coverage report run:
```bash
npm run test:coverage
```

The report will be generated in the `coverage-reports/lcov-report/index.html` folder and will show the percentage of code covered by the tests.
