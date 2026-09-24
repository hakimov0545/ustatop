# UstaTop MVP

React + Vite frontend and Express API for finding local service providers. The frontend follows Feature-Sliced Design. Express modules are split into routes, controllers, services, and repositories. MongoDB Atlas stores application data; Vercel Blob stores uploaded images and videos.

## Local development

Requirements: Node.js 24+, npm, a MongoDB Atlas database URI, and a Vercel Blob read-write token for media uploads.

Create `.env` with:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/
MONGODB_DB=ustatop
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
```

Then run:

```sh
npm install
npm run seed
npm run dev
```

Open the Vite URL (normally `http://127.0.0.1:5173`). Vite proxies `/api` to Express on port 4000. MongoDB indexes and service categories are initialized on first API access.

## Demo accounts

All accounts use password `UstaTop123!`.

| Role | Name | Phone |
| --- | --- | --- |
| Customer | Aziza | `+998901000001` |
| Customer | Bekzod | `+998901000002` |
| Plumber | Aziz | `+998901000003` |
| Electrician | Sardor | `+998901000004` |

`npm run seed` creates sample orders for every status, a chat, and a review. It is disabled in production.

## Product features

1. Describe a repair issue in Uzbek or Russian; keyword rules suggest a service category.
2. Confirm or change the suggested category.
3. Browse nearby masters by district, distance, and approximate travel time.
4. View master profiles, experience, services, portfolio, ratings, and reviews.
5. Compare estimated price ranges.
6. Book a master by date and time.
7. Follow order status and its history.
8. Chat with the other order participant and share image/video attachments.
9. Rate and review completed work.
10. Contact masters by the phone and social links they choose to publish.

## Media and privacy

Uploads accept JPEG, PNG, WebP, MP4, MOV, and WebM up to 50 MB. Files upload directly from the browser to Vercel Blob, bypassing Vercel Functions' 4.5 MB request body limit. Blob URLs are public, unlisted links: anyone with a file URL can view it. Masters choose whether to publish their contact phone; the login phone remains private by default.

## Vercel deployment

The project includes `vercel.json` and an Express function entry at `api/[...path].js`. Set these environment variables in the Vercel project:

- `MONGODB_URI`: MongoDB Atlas connection string
- `MONGODB_DB`: database name, normally `ustatop`
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store token

You can deploy without a GitHub repository using the Vercel CLI from this project folder. Run the first command once to sign in and link this folder to a new Vercel project, then deploy:

```sh
npx vercel
npm run deploy
```

Follow the prompts. In the Vercel project settings, add the three environment variables above for Production (and Preview if needed), create a Blob store, then run `npm run deploy` again. In MongoDB Atlas, allow network access for the deployment; for a no-cost prototype this may require `0.0.0.0/0`, which makes the database reachable from any IP, so use a dedicated database user with a strong password and only the required database permissions. Never commit `.env` or production secrets. Do not run the demo seed against production.

To add demo data to the Atlas database, set the same `MONGODB_URI` and `MONGODB_DB` in your local `.env`, then run `npm run seed` before deploying. If you have an existing local `ustatop.sqlite3` database and its `uploads/` folder, set `SQLITE_FILE` if needed and run `npm run migrate:sqlite`; set `BLOB_READ_WRITE_TOKEN` too if it has media files. The migration script can be safely rerun and uploads media to Blob.

## Prototype limits

MongoDB Atlas Free provides 512 MB storage, 100 operations/second, no managed backups, and can pause after prolonged inactivity. Vercel Hobby is limited to personal, non-commercial use. Check the current [Atlas free-cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), and [Vercel Function limits](https://vercel.com/docs/functions/limitations) before using this as a public business service.

Order/chat updates poll every few seconds because serverless function instances do not share in-memory event connections. GPS-based ETA is an estimate, not a map route. The operating area is Tashkent; SMS verification, payments, provider identity checks, and moderation are outside this MVP.
