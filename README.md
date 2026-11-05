# Wishloom

A personalized birthday-story builder deployed as static HTML with Vercel Functions.

## Share links and 24-hour expiry

1. In the Wishloom Vercel project, open **Storage** and create a new **Private Vercel Blob** store. Connect it to Production. Private storage is required so uploaded media can only be served through the birthday link's expiry check.
2. In **Settings → Environment Variables**, add `CRON_SECRET` with a random value of at least 16 characters. Do not commit the secret to GitHub.
3. Redeploy the project. In Wishloom, add photos, video, voice note, and song, then choose **Create birthday link**. Copy the link or use **Send with WhatsApp**. The recipient can leave a comment at the end of the birthday story.

Anyone using the public builder can create a birthday link; no creator key is needed. The share link, its media, and comments stop opening exactly 24 hours after link creation. Vercel's daily cleanup job then deletes their private Blob files automatically. The scheduled cleanup runs once per day on the Vercel Hobby plan, so physical deletion may happen on its next daily run after the 24-hour expiry. Already downloaded or saved copies cannot be removed from someone's device.
