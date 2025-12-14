# private-chatting-app
Self-hosted private messaging for VPS — MariaDB/MySQL backed; OpenLDAP account management with PBKDF2 encryption, privacy-first. 
Users will be able to install and run it privately based on the given configuration, thanks to its straightforward design. 
The long-term vision includes adapting it into a free, open-source app for Android phones.


## Stack

- Frontend: nextjs + bootstrap + typescript
- Backend:  expressjs + typescript

## How to run 

1. Install pnpm .
2. cd into the respective directories.
3. Run `pnpm install` .
4. Execute `pnpm run dev` for the dev version
5. Alterntivally for the production version run `pnpm build` then  `pnpm start`
6. Make sure to do this for both the client and server directories.
7. Visit port `localhost:3000` to see the server in action

## Additonal info

- Server runs on port 8080 and the client runs on port 3000 .
- In the future we plan to provide a docker container for ease of deployment.

