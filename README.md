<div align="center">

# 🎂 wishvilo

### A birthday story, made just for someone special.

Create a multi-chapter birthday surprise with personal photos, messages, music, candles, and celebratory effects—then share one private link with the birthday person.

[![Live on Vercel](https://img.shields.io/badge/Live%20on-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://wishloom-me.vercel.app/)
[![GitHub repository](https://img.shields.io/badge/GitHub-subratadas7%2Fwishvilo-181717?style=for-the-badge&logo=github)](https://github.com/subratadas7/wishvilo)
[![MIT License](https://img.shields.io/badge/License-MIT-8b6bd6?style=for-the-badge)](LICENSE)
[![HTML](https://img.shields.io/badge/HTML5-Story%20UI-e34f26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-Responsive%20Design-1572b6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=111)](https://developer.mozilla.org/docs/Web/JavaScript)

[Open wishvilo](https://wishloom-me.vercel.app/) · [Features](#-features) · [Run locally](#-run-locally) · [Deploy](#-deploy-to-vercel)

</div>

---

## 💌 About

wishvilo is a responsive birthday-wish website that turns a greeting into a guided story. A creator personalizes the experience, checks the recipient view, and creates a shareable link. The recipient gets the finished story without the creator’s editing controls.

The experience opens with an invitation, then guides the recipient through seven chapters. Chapter 4 is omitted from the shared story when neither a personal video nor a voice message was added.

## ✨ Features

### Personalize the celebration

- The birthday person’s name is required before the story can start.
- Add an opening line, a heartfelt note, and a final birthday wish.
- Choose from 7 birthday designs, 7 animation styles, 9 cake designs, and 5 candle styles; these choices start unselected.
- Pick a candle count and recipient age for the candle and balloon effects.
- Preview the finished recipient experience before creating the share link.
- The creator’s wishvilo credit and social profile links stay in the footer.

### Build a photo story

- Add **4 to 8 photos**. Four are required to continue; eight is the maximum.
- Adjust each photo’s crop, position, and zoom.
- Replace or remove photos from their visible memory cards.
- Browse the photo slideshow and reveal matching memory cards in the recipient story.

### Add sound and personal messages

- A built-in birthday soundtrack plays from the opening and loops until the candles are extinguished.
- Add an optional photo to the center of the chapter-three vinyl record; its design rotates with the soundtrack.
- Add a short personal video or voice message by uploading a file or recording with the device camera or microphone.
- The birthday-video chapter includes a default video. The creator can replace it with a personal clip and adjust its crop; the recipient opens it by tapping the gift.
- The final surprise uses the built-in song by default. The creator can search YouTube or upload a personal song instead, preview it, and choose the section to play.
- The final song plays only during the final surprise. Leaving that chapter stops playback.

### Make a wish

- The recipient can blow into the microphone or tap the candle flames to extinguish them.
- The birthday message uses the recipient’s name.
- When the candles go out, wishvilo launches birthday effects, including balloon pops based on the age and an optional fireworks finale.

### Share privately

- Create a unique birthday link, copy it, or share it through WhatsApp.
- Recipients can leave a name and comment on the birthday page without signing in.
- Optional Google sign-in lets participants save their comments to an account; creators can view their own comments and birthday links in an account page.
- Signed-in users can edit their display name and optionally save their birth year. Guest comments can be linked to an account after sign-in.
- Birthday pages, media, and comments become inaccessible after **12 hours**.
- A scheduled cleanup checks for expired files every **15 minutes** and removes them from the connected private Vercel Blob store.

> **Browser audio note:** Browsers may block automatic audio until someone interacts with the page. wishvilo starts music in response to the recipient’s actions; the final song begins when they open the final surprise.

## 📖 The invitation and seven chapters

| Section | What happens |
|---|---|
| Opening · The Invitation | Recipient greeting, design, animation, cake, candle, and celebration settings. |
| Chapter 1 · A Little Time Capsule | Photo slideshow and matching memory cards. |
| Chapter 2 · A Note from the Heart | Personal message. |
| Chapter 3 · Set the Soundtrack | Fixed opening birthday soundtrack and optional photo in the center of the vinyl record. |
| Chapter 4 · A Message Just for You | Optional personal video or voice message; omitted from the shared story if neither is supplied. |
| Chapter 5 · A Little Surprise | Gift-box reveal followed by the default or replaced birthday video. |
| Chapter 6 · Make a Wish | Candle-blowing, personalized birthday message, balloons, and optional fireworks. |
| Chapter 7 · The Big Finale | Reveal the final wish with the default, uploaded, or selected YouTube song. |

## 🧰 Technology

| Area | Technology |
|---|---|
| Front end | HTML, CSS, and vanilla JavaScript |
| Hosting and API routes | Vercel Functions |
| Private media and birthday pages | Vercel Blob (`@vercel/blob`) |
| Direct media uploads | Vercel Blob client and signed upload tokens |
| Song search | YouTube Data API v3; selected songs use YouTube’s embedded player |
| Optional accounts | Google OAuth 2.0 sign-in with signed, secure session cookies |
| Account data | Private Vercel Blob records, keyed by a one-way hash of the Google account ID |
| Camera and microphone | Browser MediaDevices and MediaRecorder APIs |
| Expiry cleanup | Vercel Cron schedule |

There is no front-end build step. The main interface and recipient experience are in `index.html`; server-side features are implemented in `/api`.

## 🚀 Use the live site

1. Open [wishloom-me.vercel.app](https://wishloom-me.vercel.app/).
2. Enter the birthday person’s name and choose a design, animation, cake, and candle.
3. Add 4–8 photos and personalize the story. Add video, voice, and a final song if desired.
4. Use the final-step recipient preview to review the story before sharing.
5. Create the birthday link, copy it, or share it through WhatsApp.

## 🛠️ Run locally

The project has no build command. Copy `.env.example` to `.env.local` for local secrets and never commit that file. To run its Vercel API routes locally:

1. Install Node.js and the Vercel CLI.
2. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/subratadas7/wishvilo.git
   cd wishvilo
   npm install
   ```

3. Link the project to your Vercel account and pull its development settings:

   ```bash
   vercel link
   vercel env pull .env.local
   ```

4. Start the local Vercel environment:

   ```bash
   vercel dev
   ```

A local static file server can display the front end, but sharing, private uploads, comments, YouTube search, and expiry cleanup require the Vercel API routes and their configured services.

## ☁️ Deploy to Vercel

1. Import [the GitHub repository](https://github.com/subratadas7/wishvilo) into Vercel and use the **Other** framework preset with the repository root as the project directory.
2. Create a **Private** Vercel Blob store and connect it to the project. Make sure the connection is enabled for **Production** and its webhook public key is enabled.
3. Confirm the production project receives `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`, and Vercel Blob authentication. Vercel’s project connection supplies these values; do not paste a Blob token into the public source code.
4. Add `CRON_SECRET` as a private Vercel environment variable so the scheduled cleanup endpoint is protected.
5. To enable YouTube song search, enable **YouTube Data API v3** in Google Cloud, create and restrict an API key, then add it to Vercel as `YOUTUBE_API_KEY`. Song uploads do not require this key.
6. To enable Google sign-in, configure the Google OAuth consent screen and create an OAuth **Web application** client. Add `https://wishloom-me.vercel.app/api/auth/callback` as an authorized redirect URI (and `http://localhost:3000/api/auth/callback` only if testing locally). Add the client ID and secret to Vercel as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and add a separate long random value as `SESSION_SECRET`. Keep both secrets private. If the consent screen is in testing mode, add the Google accounts you will use as test users.
7. Deploy. Sign-in becomes available after those three settings are present in Production. Recipients can still view and comment without logging in. Later pushes to the connected GitHub branch trigger new Vercel deployments.

### Environment variables

| Variable | Required for | Where it comes from |
|---|---|---|
| `BLOB_STORE_ID` | Private Blob uploads and storage | Vercel Blob project connection |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Signed Blob uploads | Vercel Blob project connection with its webhook public key enabled |
| Vercel Blob authentication | Private Blob operations | Vercel project connection / deployment environment |
| `CRON_SECRET` | Protecting scheduled expiry cleanup | Generate a long random secret and add it in Vercel |
| `YOUTUBE_API_KEY` | Searching songs on YouTube | Google Cloud API key for YouTube Data API v3 |
| `GOOGLE_CLIENT_ID` | Starting Google sign-in | Google OAuth Web application client |
| `GOOGLE_CLIENT_SECRET` | Completing Google sign-in on the server | Google OAuth Web application client; keep private |
| `SESSION_SECRET` | Signing account sessions | A separate long random secret; keep private |

## ⏳ Expiry and upload limits

- The birthday link, its media/comments, and the matching account activity records expire 12 hours after link creation. The Google profile fields used by the account remain in private storage for future sign-ins; birthday activity records expire with their links.
- A Vercel Cron job checks expired records every 15 minutes. As a result, physical Blob deletion can happen after the access cutoff rather than at the exact second.
- Signed upload limits are **100 MiB per image or audio file** and **150 MiB per video file**. Browser and network constraints may be lower.
- Someone who saves or downloads a copy before expiry cannot have that external copy removed by wishvilo.

## 📁 Project structure

```text
wishvilo/
├── api/
│   ├── cleanup.js        # Scheduled deletion of expired private files
│   ├── account.js        # Private profile, links, and saved comments
│   ├── auth-utils.js     # Signed sessions and account helpers
│   ├── auth/             # Google OAuth start, callback, status, and sign-out
│   ├── comments.js       # Read and post recipient comments
│   ├── create-gift.js    # Save a finished birthday page and return its link
│   ├── gift.js           # Serve a birthday page while its link is valid
│   ├── media.js          # Issue expiring access to private media
│   ├── music-search.js   # Search songs with YouTube Data API v3
│   └── upload.js         # Create signed direct-upload tokens
├── assets/
│   ├── chapter-five-default.mp4
│   ├── wishloom-background.mp3
│   └── wishloom-final-default.mp3
├── outputs/
│   ├── assets/           # Mirrored default finale asset
│   └── index.html        # Mirrored page copy
├── index.html            # Creator, preview, and recipient experience
├── LICENSE
├── package.json
├── README.md
└── vercel.json           # Expiry cleanup schedule (every 15 minutes)
```

## 🔐 Privacy and media

Birthday pages and uploaded files are stored in a private Blob store and served through expiring routes. Share links are intended for the recipient; anyone with an active link can view that birthday story until it expires. Do not upload media you do not have permission to share.

## 📜 License

wishvilo’s source code is licensed under the [MIT License](LICENSE). Media files may have separate usage rights; check their terms before redistributing them.

---

<div align="center">

Made with 💛 by **Subrata Das**

</div>
