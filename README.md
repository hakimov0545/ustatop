# UstaTop MVP

React + Vite frontend and Express API for finding local service providers. The frontend follows Feature-Sliced Design. Express modules are split into routes, controllers, services, and repositories. MongoDB Atlas stores application data; Vercel Blob stores uploaded images and videos.

## Local development

Requirements: Node.js 24+, npm, a MongoDB Atlas database URI, and a Vercel Blob read-write token for media uploads.

Create `.env` with:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/
MONGODB_DB=ustatop
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_BOT_USERNAME=<bot-username-without-at-sign>
TELEGRAM_WEBHOOK_SECRET=<random-webhook-secret>
ADMIN_NAME=<admin-name>
ADMIN_PHONE=<admin-phone>
ADMIN_PASSWORD=<at-least-12-characters>
```

Customers link their own Telegram account from the order form. The site opens the bot with a short lived one-time link; after the customer presses **Start**, Telegram sends their chat ID to the app and new orders are sent to that customer. Telegram bots cannot message a person until that person starts the bot. Create the bot with `@BotFather`, set these variables, and register `https://<your-domain>/api/telegram/webhook` as its webhook using the same `TELEGRAM_WEBHOOK_SECRET`. Without the bot configuration or customer link, orders are still saved, but Telegram notifications cannot be delivered. A Telegram delivery error does not discard a saved order.

Then run:

```sh
npm install
npm run init:db
npm run admin:create
npm run seed
npm run dev
```

Open the Vite URL (normally `http://127.0.0.1:5173`). Vite proxies `/api` to Express on port 4000. Initialize MongoDB indexes and service categories once with `npm run init:db` before starting the API; regular API requests do not run database setup.

Set `ADMIN_NAME`, `ADMIN_PHONE`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`, then run `npm run admin:create` once. The command provisions the super-admin account; admins sign in at `/login` and are redirected to the `/admin` dashboard. Admin role cannot be selected during public registration. Search and master-profile view analytics begin collecting after deployment of this version; district user counts use the district saved in user profiles.

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
9. Receive Telegram messages when an order is created or its status changes; customers can manage Telegram notification preferences in their account.
10. Rate and review completed work.
11. Contact masters by the phone and social links they choose to publish.

## Media and privacy

Uploads accept JPEG, PNG, WebP, MP4, MOV, and WebM up to 50 MB. Files upload directly from the browser to Vercel Blob, bypassing Vercel Functions' 4.5 MB request body limit. Blob URLs are public, unlisted links: anyone with a file URL can view it. Masters choose whether to publish their contact phone; the login phone remains private by default.

## Vercel deployment

The project includes `vercel.json` and an Express function entry at `api/[...path].js`. Set these environment variables in the Vercel project:

- `MONGODB_URI`: MongoDB Atlas connection string
- `MONGODB_DB`: database name, normally `ustatop`
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store token
- `TELEGRAM_BOT_TOKEN`: Telegram bot token from `@BotFather`
- `TELEGRAM_BOT_USERNAME`: bot username without `@`
- `TELEGRAM_WEBHOOK_SECRET`: secret Telegram must include when calling the webhook

You can deploy without a GitHub repository using the Vercel CLI from this project folder. Run the first command once to sign in and link this folder to a new Vercel project, then deploy:

```sh
npx vercel
npm run deploy
```

Follow the prompts. In the Vercel project settings, add the environment variables above for Production (and Preview if needed), create a Blob store, then run `npm run deploy` again. Register the webhook with Telegram's `setWebhook` API, passing `url=https://<your-domain>/api/telegram/webhook` and `secret_token=<TELEGRAM_WEBHOOK_SECRET>`. In MongoDB Atlas, allow network access for the deployment; for a no-cost prototype this may require `0.0.0.0/0`, which makes the database reachable from any IP, so use a dedicated database user with a strong password and only the required database permissions. Never commit `.env` or production secrets. Do not run the demo seed against production.

To populate a pitch-preview database, set `MONGODB_URI` and `MONGODB_DB` in `.env`, run `npm run seed`, then run `npm run refresh:pitch`. The pitch refresh creates fictional profile text, review examples, and illustrated portfolio entries for presentation use. Replace these with verified details and work images before accepting real customers. The script updates the seeded accounts in place so existing order links remain valid. If you have an existing local `ustatop.sqlite3` database and its `uploads/` folder, set `SQLITE_FILE` if needed and run `npm run migrate:sqlite`; set `BLOB_READ_WRITE_TOKEN` too if it has media files. The migration script can be safely rerun and uploads media to Blob.

## Prototype limits

MongoDB Atlas Free provides 512 MB storage, 100 operations/second, no managed backups, and can pause after prolonged inactivity. Vercel Hobby is limited to personal, non-commercial use. Check the current [Atlas free-cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), and [Vercel Function limits](https://vercel.com/docs/functions/limitations) before using this as a public business service.

Order/chat updates poll every few seconds because serverless function instances do not share in-memory event connections. GPS-based ETA is an estimate, not a map route. The operating area is Tashkent; SMS verification, payments, provider identity checks, and moderation are outside this MVP.
