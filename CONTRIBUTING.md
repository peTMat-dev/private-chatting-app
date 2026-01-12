# Contributing to CUBCHA (Cubical Chat)

Welcome! We're excited you're interested in contributing to **CUBCHA** — a privacy-first, self-hosted chat platform with a unique cube-based navigation UI. 🎉

---

## 🧊 What is CUBCHA?

**CUBCHA (Cubical Chat)** is a privacy-first, self-hosted chat platform designed for independent hosting on VPS, home servers, or other infrastructure. What makes it special is the **cube-based navigation UI**: users move left, right, up, or down to navigate between "screens" — like rotating and exploring faces of a cube. **No traditional menus or dropdowns**, just an immersive, spatial navigation experience.

This is a **non-commercial** project focused on community benefit, personal use, and long-term possibilities including Android support.

---

## 📋 Project at a Glance

### Technology Stack

**Frontend:**
- **Next.js** with **TypeScript**
- **Bootstrap** for styling
- Currently static messaging UI (more features to be built)

**Backend:**
- **Express.js** with **TypeScript**
- RESTful API endpoints

**Services & Infrastructure:**
- **MariaDB/MySQL** database (fully operational on VPS)
- **OpenLDAP v3** for user account management (fully operational on VPS)
- **PBKDF2** password encryption (planned, not yet implemented)

### Project Status
- Backend and database services are running on VPS
- Frontend is in early stages with static messaging components
- OpenLDAP and MariaDB configurations are managed by the project owner
- Long-term vision includes Android app development

---

## 🚪 Onboarding: How We Work

Unlike typical open-source projects, **contributors get VPS access** after an initial discussion. This means:

✅ **You do NOT need to set up your own local stack** (MariaDB, OpenLDAP, etc.)  
✅ **OpenLDAP v3 and MariaDB are already running and ready to use**  
✅ **Foundational services are configured and operational**  
✅ **You'll test and develop directly on the shared VPS environment**

This approach streamlines onboarding and ensures everyone works with the same, fully-configured infrastructure.

---

## 🤝 Ways to Contribute

We welcome contributions in many forms:

### Code Contributions
- **Frontend Development**: Build UI components in Next.js + TypeScript + Bootstrap, implement cube navigation
- **Backend Development**: Create API endpoints, business logic in Express.js + TypeScript
- **Testing**: Write and improve test coverage
- **Bug Fixes**: Identify and fix issues

### Non-Code Contributions
- **Documentation**: Improve guides, add examples, clarify instructions
- **Feature Suggestions**: Share ideas for improving CUBCHA
- **Code Reviews**: Review pull requests from other contributors
- **Design & UX**: Help refine the cube navigation experience

### What the Project Owner Handles
- **MariaDB/MySQL configuration and management**
- **OpenLDAP setup and administration**
- **VPS infrastructure and access management**

**Feedback and suggestions** on database or LDAP design are always welcome — just note that the owner manages the actual configuration.

---

## 🚀 Getting Started

### 1. Make Contact

Before diving in, let's chat! Reach out via:

- **GitHub Issues**: Open an issue to introduce yourself or ask questions
- **GitHub Discussions**: Join or start a [Discussion](../../discussions)
- **Email**: [githubpetmat@gmail.com](mailto:githubpetmat@gmail.com)

This initial conversation helps us understand your interests and provide appropriate VPS access.

### 2. Get VPS Credentials

After discussion, you'll receive:
- VPS connection details (SSH access)
- Development environment information
- Any necessary credentials for services

### 3. Understand the Workflow

Your typical workflow will be:
1. **Develop & Test on VPS**: Make changes and test them in the VPS environment first
2. **Verify Everything Works**: Ensure your changes function correctly
3. **Fork the Repository**: Once ready, fork the repo to your GitHub account
4. **Create a Branch**: Make a feature or fix branch
5. **Commit & Push**: Push your tested changes to your fork
6. **Open a Pull Request**: Submit a PR to the main repository

---

## 📝 Contributing Process

### Step-by-Step Guide

1. **Upload and Test on VPS First**
   - Develop your feature or fix directly on the VPS
   - Test thoroughly in the live environment
   - Ensure MariaDB, OpenLDAP, and all services work with your changes

2. **Fork and Clone** (when ready)
   ```bash
   # Fork via GitHub UI, then:
   git clone https://github.com/YOUR-USERNAME/private-chatting-app.git
   cd private-chatting-app
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make Your Changes**
   - Write clean, typed TypeScript code
   - Follow existing code patterns
   - Add comments where necessary

5. **Test Your Changes**
   - Run `pnpm install` in both `client/` and `server/` directories
   - Test locally if possible: `pnpm run dev`
   - Verify on VPS before submitting

6. **Commit Your Work**
   ```bash
   git add .
   git commit -m "feat: add cube navigation for settings screen"
   # Use conventional commit messages when possible
   ```

7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Go to the main repository on GitHub
   - Click "New Pull Request"
   - Provide a clear description of your changes
   - Reference any related issues

### Pull Request Guidelines

- **Title**: Clear and descriptive (e.g., "Add user authentication API endpoint")
- **Description**: Explain what and why, not just how
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include screenshots for UI changes
- **Keep PRs Focused**: One feature or fix per PR when possible

---

## 💡 Coding Principles

### TypeScript Best Practices
- **Type everything**: Avoid `any` types when possible
- **Use interfaces and types**: Define clear contracts
- **Strict mode**: Keep TypeScript strict settings enabled

### Code Style
- **Consistent formatting**: Follow existing code patterns
- **Meaningful names**: Use descriptive variable and function names
- **Comments**: Explain complex logic, not obvious code
- **DRY principle**: Don't Repeat Yourself

### Frontend (Next.js + Bootstrap)
- **Component-based**: Build reusable components
- **Responsive design**: Ensure mobile compatibility
- **Accessibility**: Follow WCAG guidelines where possible
- **Bootstrap utilities**: Leverage Bootstrap classes appropriately

### Backend (Express.js)
- **RESTful APIs**: Follow REST conventions
- **Error handling**: Implement proper error responses
- **Security**: Validate input, sanitize data
- **Async/await**: Use modern async patterns

### Cube Navigation UI
- **Spatial consistency**: Navigation should feel intuitive
- **No menus/dropdowns**: Honor the unique cube navigation concept
- **Smooth transitions**: Ensure good UX when "rotating" between screens

---

## 🌍 Community & Support

### Get Help

- **GitHub Issues**: [Report bugs or ask questions](../../issues)
- **GitHub Discussions**: [Join conversations](../../discussions)
- **Email**: [githubpetmat@gmail.com](mailto:githubpetmat@gmail.com)

### Stay Updated

- **Watch the repository**: Get notifications on new activity
- **Join discussions**: Participate in project planning and ideas
- **Review PRs**: Help review other contributors' work

### Communication Guidelines

- **Be respectful**: Treat everyone with kindness and professionalism
- **Be patient**: Contributors have different schedules and time zones
- **Be constructive**: Offer helpful feedback, not just criticism
- **Be inclusive**: Welcome newcomers and help them get started

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. While we don't have a formal Code of Conduct document yet, we expect all contributors to:

- **Treat others with respect** and empathy
- **Communicate constructively** and professionally
- **Welcome diverse perspectives** and backgrounds
- **Focus on collaboration**, not confrontation
- **Accept feedback gracefully** and provide it kindly

Unacceptable behavior includes harassment, discrimination, trolling, or any conduct that makes others feel unwelcome or unsafe. If you experience or witness such behavior, please contact the project owner at [githubpetmat@gmail.com](mailto:githubpetmat@gmail.com).

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

By contributing, you agree that your contributions will be licensed under the same GPL-3.0 license. This ensures the project remains free and open-source for everyone.

For full license details, see the [LICENSE](./LICENSE) file in the repository root.

---

## 🎯 No Pressure, Your Pace

We understand everyone has different schedules and commitments. **There are no strict deadlines or time expectations** — contribute as little or as much as you like, whenever you have time.

Whether you can dedicate a few hours a week or just want to help occasionally, all contributions are valued and appreciated! 💙

---

## 🙏 Thank You!

Thank you for considering contributing to CUBCHA! Your help makes this project better for everyone. If you have any questions or ideas, don't hesitate to reach out.

Happy coding! 🚀

---

**Maintained by:** [peTMat-dev](https://github.com/peTMat-dev)  
**Project:** [private-chatting-app](https://github.com/peTMat-dev/private-chatting-app)
