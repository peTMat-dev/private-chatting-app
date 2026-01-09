# private-chatting-app
Self-hosted private messaging for VPS — MariaDB/MySQL backed; OpenLDAP account management with PBKDF2 encryption, privacy-first. 
Users will be able to install and run it privately based on the given configuration, thanks to its straightforward design. 
The long-term vision includes adapting it into a free, open-source app for Android phones.

---

## 🚀 Looking for a Collaborator! [Next.js + TypeScript + Bootstrap + Express.js]

Hi all,

I'm working on an open-source, self-hosted chat application aimed at privacy and independent hosting (VPS, home server, etc).  
The tech stack is Next.js, TypeScript, and Bootstrap for the frontend (which still needs to be created, as only a static messaging part exists so far), and Express.js with TypeScript for the backend, with MariaDB/MySQL for data plus OpenLDAP for user management.

It’s a non-commercial project—just something for community benefit and personal use. **I'm looking for one contributor who would take care of building the frontend in Next.js/TypeScript/Bootstrap and also handle the Express.js backend.  
I'll handle the OpenLDAP and MariaDB/MySQL parts.**

What you would help with:
- Creating the frontend UI in Next.js/TypeScript/Bootstrap, adding features and improving UX
- Handling the backend logic in Express.js/TypeScript
- Suggesting ideas, troubleshooting, or code reviewing for the app
- Documentation or testing

You’re invited to:
- Take a look at [the repo](https://github.com/peTMat-dev/private-chatting-app)
- Open an issue with your questions, suggestions, or if you want to discuss possible contributions
- Reach out if you want to collaborate or just chat about the project

No expectations for time commitment—you can contribute as little or as much as you like. If you’re interested, I’d be happy to hear from you.

Thanks!

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

## Additional info

- Server runs on port 8080 and the client runs on port 3000.
- In the future we plan to provide a docker container for ease of deployment.
