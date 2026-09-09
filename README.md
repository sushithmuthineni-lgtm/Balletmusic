# Ballet — Music Bot

A premium-style Discord music bot built on **discord.js v14** + **Kazagumo/Shoukaku (Lavalink)**.

## What's included right now

~25 solid, fully-working commands across:
- **Playback**: play, playnext, pause, resume, skip, skipto, stop, replay, seek, join, leave
- **Queue**: queue, nowplaying, volume, loop, shuffle, remove, clear, move
- **Premium features**: `/247` (24/7 mode), `/autoplay`, `/filter` (13 presets), `/bassboost`, `/grab` (DM current song), `/lyrics`
- **Utility**: help, ping, invite, botinfo

This is a real, working foundation — not filler. See "Scaling to 100+ commands" below for how to keep growing it honestly.

## 1. Requirements
- A Discord bot application + token (you already have this)
- Node.js 18+ (Railway handles this automatically)
- A **Lavalink server** — this is what actually streams audio. Your bot talks to Lavalink, Lavalink talks to YouTube/SoundCloud/etc.

## 2. Deploy Lavalink on Railway (do this FIRST)

Lavalink is a separate Java service, not part of the bot's Node.js code.

1. In your Railway project, click **+ New → Deploy from Docker Image**
2. Use the image: `ghcr.io/lavalink-devs/lavalink:4`
3. Upload/mount the `lavalink/application.yml` from this project as the container's `/opt/Lavalink/application.yml` (Railway → your Lavalink service → Settings → Volumes, or use a Railway "Config as code" file mount)
4. Set the service's exposed port to `2333`
5. Once deployed, copy its **public domain** (Railway gives you one under Settings → Networking) — you'll need it as `LAVALINK_URL`

> ⚠️ Change `password: "youshallnotpass"` in `application.yml` to your own secret before going live — it's a well-known default and public Lavalink servers get scanned for it.

## 3. Deploy the bot on Railway

1. Push this folder to a GitHub repo, connect it to a new Railway service
2. In Railway → Variables, set everything from `.env.example`:
   - `BOT_TOKEN`, `CLIENT_ID` — from your existing bot app
   - `LAVALINK_URL` — the Railway domain from step 2 (no `https://`, just `host:port`)
   - `LAVALINK_AUTH` — must match the password in `application.yml`
   - `LAVALINK_SECURE` — `true` if Railway gives you an HTTPS-only domain (usually yes)
3. Railway will run `npm install && npm start` automatically
4. Watch the deploy logs — on success you'll see `[Lavalink] Node "main" connected.` and `[Commands] Registered N commands.`

## 4. Invite the bot & test

Use `/invite` once it's running, or build the link manually with the `bot` + `applications.commands` scopes and these permissions: View Channel, Send Messages, Embed Links, Connect, Speak.

Then in your server: `/play query: never gonna give you up`

## Project structure
```
ballet-bot/
├── index.js                 # entry point
├── config.js                 # env-driven config
├── commands/
│   ├── music/                # all playback/queue/filter commands
│   └── utility/               # help, ping, botinfo, invite
├── events/                   # ready.js, interactionCreate.js
├── handlers/                 # auto-loads commands/ and events/
├── utils/
│   ├── musicManager.js       # Kazagumo setup, autoplay + 24/7 logic
│   ├── filters.js             # all audio filter presets
│   ├── playerUtils.js         # shared "is user in my VC" checks
│   └── embeds.js              # consistent premium-style embeds
└── lavalink/application.yml  # Lavalink server config
```

## Adding a new command
Every file in `commands/music/` or `commands/utility/` auto-loads — no registry to edit. Copy an existing file as a template:

```js
const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('yourcommand').setDescription('...'),
  async execute(interaction) {
    return interaction.reply({ embeds: [successEmbed('Done!')] });
  }
};
```
Restart the bot and the command auto-registers.

## Scaling to 100+ commands
Real premium bots hit big command counts by combining:
1. **Filter variants as separate commands** (you have `/filter` with 13 choices — you could also expose each as its own command: `/nightcore`, `/vaporwave`, `/8d`, etc. — same logic, different entry point)
2. **DJ role / permissions system**: `/setdj`, `/djrole`, `/247channel`
3. **Playlists**: `/playlist create|save|load|delete|list` (needs a small database — SQLite via `better-sqlite3` is easiest on Railway)
4. **Queue power tools**: `/removedupes`, `/reverse-queue` (reorders queue, not audio), `/jump`, `/skipvote`
5. **Fun/utility padding that still adds value**: `/avatar`, `/serverinfo`, `/userinfo`, `/uptime`, `/8ball`, `/coinflip`

I built the architecture so any of these are ~15-30 line files. If you tell me which category to tackle next, I'll write that full batch out.

## Honest limitation: "reverse"
True reverse playback (audio playing backwards) isn't technically possible on a live-decoded stream — Lavalink can't play frames before they're decoded. The `/filter reverse` here does a slowed + muffled effect (what some other bots also secretly implement under that name). If you specifically need real reversed clips, that requires pre-downloading and processing the file offline, which breaks live streaming — happy to build that as a separate "clip" feature if you want it.
