# 🎂 Wishloom — A Birthday Story, Made Just for You

Wishloom turns a birthday into a personalized, chapter-by-chapter story. Create a surprise with photos, music, a personal video or voice note, animated birthday effects, and a heartfelt wish. Share it with one link.

![Made with HTML, CSS, and JavaScript](https://img.shields.io/badge/Made%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-f36f91?style=for-the-badge&logo=html5&logoColor=white)
![Hosted on Vercel](https://img.shields.io/badge/Hosted%20on-Vercel-black?style=for-the-badge&logo=vercel)

---

## ✨ Features

- 📖 Seven-chapter birthday story with animated transitions
- 🎨 Seven themes: Pastel Garden, Disco After-Dark, Moonlit Constellation, Aurora Dream, Candy Carnival, Ocean Daydream, and Golden Birthday
- 🎂 Eight cake styles and five candle styles
- 🖼️ Photo slideshow with eight animated memory cards
- 🎵 Birthday soundtrack upload
- 🎥 Personal video message upload or live recording
- 🎙️ Voice message upload or recording
- 🎤 Blow out candles using the microphone or tap each flame
- 🎈 Age-based balloon pop animation
- ✨ Seven animation styles: Sparkle, Hearts, Confetti, Fireworks, Bubbles, Petals, and Stars
- 🎁 Gift-wrap reveal and music intro for the recipient
- 🔗 Create a unique link at the final step, copy it, or send it with WhatsApp
- 💌 Recipient comments at the end of the story
- ⏳ Links, media, and comments stop opening after 24 hours and are automatically removed
- ♿ Accessible controls, keyboard navigation, and reduced-motion support

---

## 🚀 Getting Started

Wishloom is hosted on Vercel because share links, media uploads, comments, and automatic expiry use Vercel Functions and Blob storage.

1. Import the `subratadas7/wishloom` GitHub repository into Vercel.
2. Set the project preset to **Other** and the root directory to `./`.
3. In the Vercel project, create a **Private Vercel Blob** store and connect it to Production. In the store's **Projects** connection, enable the webhook public key. Confirm `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` are available in the Production environment; Vercel manages the OIDC credentials.
4. In **Settings → Environment Variables**, add `CRON_SECRET` with a random value of at least 16 characters. Keep this value out of GitHub.
5. Deploy the project. Future commits pushed to the connected branch will trigger a new deployment.

No creator key is needed on the website. Anyone using the public builder can make their own birthday link. If uploads report that Vercel cannot prepare a presigned URL, open the Blob store's **Projects** tab, select the ⋯ menu for Wishloom, choose **Update Project Connection**, and enable the webhook public key. Then redeploy so the Production function receives `BLOB_WEBHOOK_PUBLIC_KEY`.

---

## 🎁 Create and Share a Birthday Story

1. Personalize the recipient's name, messages, theme, cake, candles, and effects.
2. Add photos, a song, a video, or a voice message as you move through the chapters.
3. At the final step, select **Create birthday link**.
4. Select **Copy link** or **Send with WhatsApp** and share it with the recipient.
5. The recipient opens the story, reveals the birthday wish, and can post a comment at the end.

Links and their associated media and comments stop opening 24 hours after creation. Vercel Hobby cleanup runs once per day, so permanent file deletion happens on the next scheduled cleanup after expiry. Copies already downloaded or saved to a device cannot be removed.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Page and styling | HTML5 and CSS3 |
| Interactions | Vanilla JavaScript (ES6+) |
| Media features | Web Audio API, MediaRecorder API, and File API |
| Share links, comments, and media storage | Vercel Functions and Private Vercel Blob |
| Scheduled cleanup | Vercel Cron |

---

## 📁 Project Structure

```text
wishloom/
├── index.html          # Birthday story builder and recipient experience
├── api/
│   ├── cleanup.js      # Deletes expired birthday content
│   ├── comments.js     # Saves and returns recipient comments
│   ├── create-gift.js  # Creates a unique birthday link
│   ├── gift.js         # Serves the recipient story
│   ├── media.js        # Serves media while a link is active
│   └── upload.js       # Handles private media uploads
├── outputs/
│   └── index.html      # Copy of the main HTML page
├── package.json
└── vercel.json         # Daily cleanup schedule
```

---

## 🤝 Contributing

Suggestions for themes, animations, accessibility, and birthday-story features are welcome. Open an issue or submit a pull request.

---

<p align="center">Made with 💛 by <a href="https://github.com/subratadas7">Subrata Das</a></p>
