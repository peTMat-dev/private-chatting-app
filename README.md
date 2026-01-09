# private-chatting-app
Self-hosted private messaging for VPS — MariaDB/MySQL backed; OpenLDAP account management with PBKDF2 encryption, privacy-first. 
Users will be able to install and run it privately based on the given configuration, thanks to its straightforward design. 
The long-term vision includes adapting it into a free, open-source app for Android phones.

---

## 🚀 Looking for a Collaborator! [Next.js + TypeScript + Bootstrap + Express.js]

Hi all,

I'm working on an open-source, self-hosted chat application aimed at privacy and independent hosting (VPS, home server, etc).  
The tech stack is Next.js, TypeScript, and Bootstrap for the frontend (which still needs to be created, as only a static messaging part exists so far), and Express.js with TypeScript for the backend, with MariaDB/MySQL for data plus OpenLDAP for user management.

It’s a non-commercial project—just something for community benefit and personal use. **I'm looking for one or two collaborators who would take care of building the frontend in Next.js/TypeScript/Bootstrap and also help with the Express.js backend.  
I'll handle the OpenLDAP and MariaDB/MySQL parts.**

What you would help with:
- Creating the frontend UI in Next.js/TypeScript/Bootstrap, adding features and improving UX
- Handling the backend logic in Express.js/TypeScript
- Suggesting ideas, troubleshooting, or code reviewing for the app
- Documentation or testing

You’re invited to:
- Take a look at [the repo](https://github.com/peTMat-dev/private-chatting-app)
- Open an issue with your questions, suggestions, or if you want to discuss possible contributions
- Start or join a [Discussion](../../discussions) for project chat and ideas
- Reach out if you want to collaborate or just chat about the project

The pace of contribution is entirely up to you—work on the project whenever you have spare time, with no pressure or strict deadlines.

No expectations for time commitment—you can contribute as little or as much as you like. If you’re interested, I’d be happy to hear from you.

Thanks!

---

## Contact

For questions, collaboration, or any other inquiries, feel free to:
- Open an issue in this repository
- Start or reply to a [Discussion](../../discussions)
- Email me directly at: [githubpetmat@gmail.com](mailto:githubpetmat@gmail.com)

---

## Stack

- Frontend: nextjs + bootstrap + typescript
- Backend:  expressjs + typescript

## How to run 

1. Install pnpm .
2. cd into the respective directories.
3. Run `pnpm install` .
4. Execute `pnpm run dev` for the dev version
5. Alternatively for the production version run `pnpm build` then  `pnpm start`
6. Make sure to do this for both the client and server directories.
7. Visit port `localhost:3000` to see the server in action

> [!TIP]
> You can alternatively run the scripts `run-dev.bat` or `run-dev.sh` depending if you are on Windows or Linux (make sure pnpm is installed)

## Third-party licenses

This project uses open-source dependencies such as Express.js, Next.js, and others.  
Each dependency includes its license information in its own npm package.  
For details, see `node_modules/[package]/package.json` or refer to their respective npm and GitHub pages.

## Additional info

- Server runs on port 8080 and the client runs on port 3000.
- In the future we plan to provide a docker container for ease of deployment.
