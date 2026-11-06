# 🎂 Wishloom

A birthday surprise told as a little interactive story. Personalize the recipient’s page, add memories and messages, then share one private link.

[![Open Wishloom](https://img.shields.io/badge/Hosted%20on-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://wishloom-me.vercel.app/)
![Made with HTML, CSS, and JavaScript](https://img.shields.io/badge/Made%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-f36f91?style=for-the-badge&logo=html5&logoColor=white)
[![MIT License](https://img.shields.io/badge/License-MIT-9b78c8?style=for-the-badge)](LICENSE)

**Live site:** [wishloom-me.vercel.app](https://wishloom-me.vercel.app/) · **Repository:** [subratadas7/wishloom](https://github.com/subratadas7/wishloom)

---

## ✨ What it does

Wishloom guides a creator through a seven-scene birthday experience. The creator edits the recipient’s name and message, chooses a visual style, adds media, previews the recipient view, and creates a link to share. The recipient sees the finished story without the editing controls.

### 🎨 Personalize the story

- Add the recipient’s name, an opening message, a heartfelt note, and a final birthday wish.
- Choose from seven visual themes, seven animation styles, eight cake designs, and five candle styles.
- Set the number of candles and the recipient’s age for the birthday effects.
- Preview the finished recipient experience before creating a share link.

### 📸 Add memories and messages

- Upload multiple photos, crop and reposition each one, and view them in a slideshow and memory cards.
- Add a photo to the center of the chapter-three vinyl record.
- Add a personal video by uploading a clip or recording with the device camera.
- Add a voice message by uploading audio or recording with the device microphone.

### 🎂 Make a birthday wish

- A built-in soundtrack loops from the opening until the candle wish.
- The recipient can blow out candles with the microphone or tap the flames.
- When the candles go out, the page plays the birthday celebration effects, including the age-based balloon pop.
- Preview and trim the final song before sharing. The chosen start and end points apply to the default song, a personal upload, or a selected YouTube track.
- The final surprise plays the included default song unless the creator selects a YouTube song or uploads a personal song.

### 🔗 Share and leave a note

- Create a unique recipient link and copy it or open WhatsApp to share it.
- Birthday pages, uploaded media, and comments expire after 12 hours.
- Recipients can leave a comment on the birthday page.

> **Audio note:** Browsers may require a tap before they allow audio playback. Wishloom starts music in response to the recipient’s on-page actions. The final song starts when they press **Reveal my surprise**.

---

## 🚀 Use the live site

1. Open [Wishloom](https://wishloom-me.vercel.app/).
2. Enter the recipient’s name and personalize the messages, theme, cake, candles, and effects.
3. Move through the scenes to add photos, soundtrack artwork, a video, or a voice message. These uploads are optional.
4. In the final scene, preview the default song, select a YouTube song, or upload a personal song. Adjust the start and end points to choose the section that plays during the final surprise.
5. Select **Create birthday link**, then copy the link or share it with WhatsApp.

The recipient link is read-only: it shows the completed birthday story, without the creator’s upload and editing controls.

---

## 🧰 Built with

| Part | Technology |
|---|---|
| Page, design, and interactions | HTML, CSS, and vanilla JavaScript |
| Camera and voice recording | Browser MediaRecorder and MediaDevices APIs |
| Photo editing | Browser image and canvas APIs |
| Secure media and birthday-page storage | Vercel Functions and Private Vercel Blob |
| Final song search | Official YouTube Data API search and YouTube embedded player |
| Expiry cleanup | Vercel Schedules |
| Blob client | `@vercel/blob` 2.8.2 |

The site has no frontend build step. The main experience lives in `index.html`; the `/api` routes provide the sharing and storage features.

---

## 🛠️ Deploy your own copy

1. Import [this GitHub repository](https://github.com/subratadas7/wishloom) into Vercel.
2. Use the **Other** framework preset and `./` as the project root directory.
3. Create a **Private Vercel Blob** store and connect it to the project’s **Production** environment. In the Blob store’s project connection, enable the webhook public key. Confirm that `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` are available to the Production deployment; Vercel provides the deployment authentication.
4. Add a `CRON_SECRET` environment variable with a long, randomly generated value. Keep it private.
5. To enable final-song search, enable **YouTube Data API v3** in Google Cloud, create an API key restricted to this API, and add it in Vercel as `YOUTUBE_API_KEY`. Keep the key out of source files. Uploaded songs work without this key.
6. Deploy. Future pushes to the connected branch will trigger deployments automatically.

If the page reports that a Blob upload cannot be prepared, check the Private Blob store’s project connection and webhook public key, then redeploy. The public birthday builder does not require a creator API key.

### Local development

Install the Vercel CLI, link the repository to your Vercel project, and run `vercel dev`. The sharing, uploads, comments, and expiry behavior need a working Vercel Blob connection; opening `index.html` directly only provides a static page and cannot run the API routes.

---

## ⏳ Expiry details

Final-song search uses the YouTube Data API and plays selected videos in YouTube’s embedded player; song uploads play in the page audio player. Creators can preview and trim the selected song, and the recipient hears only the chosen segment. Search requires a `YOUTUBE_API_KEY` in Vercel.

A birthday link and its media are refused after 12 hours. A scheduled cleanup checks for expired pages, photos, videos, audio, and comments every 15 minutes and deletes them from the connected Private Blob store. Vercel may delay scheduled runs by up to 15 minutes, and deletion can take up to 60 seconds to propagate, so physical removal can happen shortly after the 12-hour access cutoff rather than at the exact second. Copies that someone already downloaded or saved cannot be removed remotely.

---

## 📁 Project structure

```text
wishloom/
├── api/
│   ├── cleanup.js       # Deletes expired pages, media, and comments
│   ├── comments.js      # Reads and saves recipient comments
│   ├── create-gift.js   # Stores the finished page and returns its link
│   ├── gift.js          # Serves a birthday page while its link is valid
│   ├── media.js         # Serves private media while its link is valid
│   └── upload.js        # Issues signed upload tokens for private media
├── assets/
│   ├── wishloom-background.mp3     # Built-in looping soundtrack
│   └── wishloom-final-default.mp3  # Default final-wish song
├── outputs/
│   ├── assets/          # Default finale audio for the mirrored page
│   └── index.html       # Mirrored copy of the main page
├── index.html           # Birthday builder and recipient experience
├── LICENSE
├── package.json
├── README.md
└── vercel.json          # 15-minute expiry-cleanup schedule
```

---

## 📜 License

The project source is available under the [MIT License](LICENSE). Audio and other media assets may have separate rights; check their terms before redistributing them.

---

## 🤝 Contributing

Ideas and improvements for the themes, animations, accessibility, or birthday-story experience are welcome. Open an issue or submit a pull request.

---

<p align="center">Made with 💛 by <a href="https://github.com/subratadas7">Subrata Das</a></p>
