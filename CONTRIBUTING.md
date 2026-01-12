# Contributing to Private Chatting App

Thank you for your interest in contributing to **Private Chatting App**, a privacy-first, self-hosted chat application!
Whether you want to fix bugs, implement features, improve docs, or shape the frontend, your involvement is appreciated.

---

## Table of Contents

- Project Overview
- How to Get Started
- Ways You Can Help
- Development Setup
- Coding Standards
- Pull Request Process
- Community & Support
- Code of Conduct
- License

---

## Project Overview

**Private Chatting App** is a secure, self-hosted messaging platform designed for VPS and server setups. The long-term vision includes a free, open-source Android app.

- **Frontend:**  
  - Built with Next.js, TypeScript, and Bootstrap
  - Needs to be created and expanded! Only a static messaging view exists so far
  - You are invited to help design and develop this

- **Backend:**  
  - Built with Express.js and TypeScript
  - Relies on MariaDB/MySQL for data storage
  - Uses OpenLDAP for account management (PBKDF2 encryption for passwords)
  - Backend app structure is defined and looking for further feature work

This is a non-commercial, community-oriented project focusing on privacy and open source best practices.

---

## How to Get Started

- **Check Issues:**
  Explore open [Issues](../../issues) labeled `help wanted`, `good first issue`, or `enhancement`
- **Ask Questions / Start a Discussion:**
  The [Discussions](../../discussions) area is open for questions and brainstorming
- **Collaboration Pace:**
  No strict timelines—work as your schedule permits. Every bit helps!

---

## Ways You Can Help

- **Frontend Engineering:**
  - Build out the Next.js/TypeScript/Bootstrap UI
  - Improve UX and add user-facing features

- **Backend Engineering:**
  - Implement and expand Express.js+TypeScript API endpoints
  - Contribute authentication/authorization logic

- **Database & Directory Integration:**
  - Provide feedback on MariaDB/MySQL and OpenLDAP integration (owner manages these, but suggestions/testers welcome)

- **Documentation:**
  - Enhance setup/setup, usage, and developer docs

- **Testing:**
  - Add/extend tests to ensure quality

- **DevOps:**
  - Enhance deployment, Dockerization, and production readiness scripts

- **UI/UX Design or Localization:**
  - Help with layout, styling, or translations

---

## Development Setup

1. **Install [pnpm](https://pnpm.io/) if you haven't already.**
2. **Clone the repo**
    ```sh
    git clone https://github.com/peTMat-dev/private-chatting-app.git
    cd private-chatting-app
    ```
3. **Go to the relevant directory**
    - `cd client` for frontend
    - `cd server` for backend

4. **Install dependencies**
    ```sh
    pnpm install
    ```
5. **Run in development mode**
    ```sh
    pnpm run dev
    ```
6. **Production build:**
    ```sh
    pnpm build
    pnpm start
    ```
7. **Repeat for both `client` and `server` directories**  
   Visit `localhost:3000` in your browser.

> Windows: `run-dev.bat`  
> Linux: `run-dev.sh`

(See detailed [README](README.md) for more.)

---

## Coding Standards

- Use modern **TypeScript** best practices throughout
- Follow the established code style (`pnpm run lint` to check)
- Document your code with clear comments as needed
- Prioritize privacy and security
- Update docs and tests for any feature enhancements

---

## Pull Request Process

1. **Fork** this repo and create a feature branch (`yourname/feature-xyz`)
2. **Make your changes** with meaningful commit messages
3. **Test** your changes (`pnpm test` if applicable)
4. **Push to your fork** and open a Pull Request (PR)
5. **Reference issues** if your PR fixes or addresses one
6. Participate in code review and address any feedback

*Draft PRs are welcome for early feedback.*

---

## Community & Support

- **Ask in [GitHub Discussions](../../discussions) (Public):**  
  For questions, brainstorming, general project chat, or onboarding.  
  _(Note: Discussions are public and visible to everyone if this repository is public.)_

- **File an [Issue](../../issues):**  
  For bug reports, feature requests, or if you're not sure where to post your idea or question.

- **Pull Requests:**  
  Submit code or documentation changes and discuss them with maintainers via code review.

- **Email:**  
  For private communication or urgent matters, you may contact:  
  [githubpetmat@gmail.com](mailto:githubpetmat@gmail.com)

---

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

By contributing, you agree your code is licensed under GPL v3 or later.

---

Thank you for your interest in helping build Private Chatting App!
