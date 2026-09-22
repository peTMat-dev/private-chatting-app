# private-chatting-app
Self-hosted private messaging for VPS — MariaDB backed; OpenLDAP account management with Argon2 encryption, privacy-first. 
Users will be able to install and run it privately based on the given configuration, thanks to its straightforward design. 
Available as a cross-platform app (Android + Web) built with Expo / React Native.

---

## 🚀 Looking for a Collaborator! [React Native / Expo + TypeScript + Express.js]

Hi all,

I'm working on an open-source, self-hosted chat application aimed at privacy and independent hosting (VPS, home server, etc).  
The tech stack is React Native (Expo) with TypeScript for the cross-platform client (Android + Web), and Express.js with TypeScript for the backend, with MariaDB for data storage plus OpenLDAP for user management.

It’s a non-commercial project—just something for community benefit and personal use. **I'm looking for one or two collaborators who would take care of building the client in React Native/Expo/TypeScript and also help with the Express.js backend.  
I'll handle the OpenLDAP and MariaDB parts.**

What you would help with:
- Building the cross-platform client UI in React Native/Expo/TypeScript, adding features and improving UX
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

- Frontend (`client_rn`): Expo (React Native) + TypeScript
  - React Native Reanimated — animations
  - React Native Gesture Handler — gestures
  - Expo Router — file-based navigation
  - expo-secure-store — secure token storage
  - react-native-web — web support
- Backend: Express.js + TypeScript
- Database: MariaDB (MySQL compatible)
- Authentication: OpenLDAP with Argon2 password hashing
- Email: Nodemailer for password reset emails

## Features

- **User Authentication**: Secure login/registration via OpenLDAP integration
- **Argon2 Password Hashing**: Modern, secure password encryption
- **Email-Based Password Reset**: Token-based password recovery system
- **User Settings Management**: Customizable language, timezone, chat preferences, and profile visibility
- **Interactive Chat Interface**: 3D cube navigation UI for chats, contacts, and settings
- **Contacts Management**: Add, manage, and organize chat contacts
- **Group Conversations**: Support for multi-participant chat rooms
- **Timezone Support**: Full IANA timezone database integration
- **Database Migrations**: SQL scripts for schema setup and data backfilling

## How to run 

1. Install pnpm .
2. cd into the respective directories.
3. Run `pnpm install` .
4. Execute `pnpm run dev` for the dev version
5. Alternatively for the production version run `pnpm build` then  `pnpm start`
6. Make sure to do this for both the `client` and `server` directories.
7. Visit port `localhost:3000` to see the web client in action

### Running `client_rn` (Expo / React Native)

1. `cd client_rn`
2. `npm install`
3. `npm start` — starts the Expo dev server
4. `npm run android` — run on Android device/emulator
5. `npm run web` — run in the browser (Expo Web)

> [!TIP]
> You can alternatively run the scripts `run-dev.bat` or `run-dev.sh` depending if you are on Windows or Linux (make sure pnpm is installed)

## Third-party licenses

This project uses open-source dependencies including:
- **Express.js** - Web framework (MIT License)
- **React** - UI library (MIT License)
- **React-DOM** - React rendering (MIT License)
- **React Native** - Mobile framework (MIT License)
- **Expo** - App framework and tooling (MIT License)
- **React Native Reanimated** - Animations (MIT License)
- **React Native Gesture Handler** - Gesture system (MIT License)
- **Expo Router** - File-based navigation (MIT License)
- **expo-secure-store** - Secure token storage (MIT License)
- **react-native-web** - Web support for React Native (MIT License)
- **Argon2** - Password hashing (MIT License)
- **ldapts** - LDAP client (MIT License)
- **ldapjs** - LDAP protocol client/server (MIT License)
- **Nodemailer** - Email sending (MIT License)
- **mysql** - MariaDB/MySQL driver (MIT License)
- **cors** - CORS middleware (MIT License)
- **cookie-parser** - Cookie parsing middleware (MIT License)
- **dotenv** - Environment configuration (MIT License)
- **socket.io** - Real-time bidirectional communication server (MIT License)
- **socket.io-client** - Real-time bidirectional communication client (MIT License)

Each dependency includes its license information in its own npm package.  
For details, see `node_modules/[package]/package.json` or refer to their respective npm and GitHub pages.

## Database Setup

1. **Install MariaDB** on your VPS or local machine
2. **Create the database schema**: Run the SQL script located at `chat_schema/create_cubcha_v1.sql`
3. **Populate timezones** (optional): Use `timezones_bulk_insert.sql` for timezone data
4. **Backfill existing users** (if applicable): Run `server/scripts/backfill-user-settings.sql` to add settings for pre-existing users
5. **Configure environment**: Set up your `.env` file with MariaDB connection details

The database schema includes tables for users, contacts, messages, conversations, groups, and timezone management.

## Additional info

- Server runs on port 8080, the web client (`client`) runs on port 3000, and `client_rn` web runs on port 8081.
- Database: MariaDB (MySQL-compatible)
- `client` — original web frontend (Next.js), kept as reference source
- `client_rn` — cross-platform client (Expo / React Native) for Android + Web
- In the future we plan to provide a docker container for ease of deployment.
