// Naresh World Telegram media ingestion bot.
// Only ingest videos you own or are authorized to distribute.
// Telegram Bot API cloud getFile downloads are limited by Telegram's current Bot API limits.
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const {
  TELEGRAM_BOT_TOKEN, PUBLIC_BASE_URL, FIREBASE_DATABASE_URL,
  FIREBASE_SERVICE_ACCOUNT_JSON, PORT = 3000, BOT_ADMIN_IDS = ''
} = process.env;
if (!TELEGRAM_BOT_TOKEN || !PUBLIC_BASE_URL || !FIREBASE_DATABASE_URL || !FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('Set TELEGRAM_BOT_TOKEN, PUBLIC_BASE_URL, FIREBASE_DATABASE_URL and FIREBASE_SERVICE_ACCOUNT_JSON');
}
const adminIds = new Set(BOT_ADMIN_IDS.split(',').map(x => x.trim()).filter(Boolean));
const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: FIREBASE_DATABASE_URL });
const db = admin.database();

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, {recursive:true});
app.use('/media', express.static(uploadDir, { fallthrough:false, maxAge:'1h', setHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');} }));
app.get('/health', (_req,res) => res.json({ok:true, service:'Naresh World media bot'}));
app.listen(PORT, () => console.log(`Media server listening on ${PORT}`));

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {polling:true});
const categoryHelp = 'Send a video with a caption starting with #movie, #series or #short, followed by its title. Example: #short My Drama Episode 1';
bot.onText(/^\/start$/, msg => bot.sendMessage(msg.chat.id, `Naresh World Media Bot\\n\\n${categoryHelp}\\n\\nOnly upload media you own or have distribution permission for.`));
bot.onText(/^\/help$/, msg => bot.sendMessage(msg.chat.id, categoryHelp));

function authorized(msg) {
  return adminIds.size === 0 || adminIds.has(String(msg.from.id));
}
function parseCaption(caption='') {
  const m = caption.trim().match(/^#(movie|series|short)\\s+(.+)$/i);
  if (!m) return null;
  return {kind:m[1].toLowerCase(), title:m[2].trim()};
}
function cleanName(name) {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'video';
}
async function downloadTelegramFile(fileId, filename) {
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Telegram file download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const target = path.join(uploadDir, filename);
  fs.writeFileSync(target, buffer);
  return target;
}
bot.on('message', async msg => {
  try {
    if (!msg.video && !msg.document) return;
    if (!authorized(msg)) return bot.sendMessage(msg.chat.id, 'Not authorized to use this import bot.');
    const media = msg.video || (msg.document && /^video\//.test(msg.document.mime_type || '') ? msg.document : null);
    if (!media) return bot.sendMessage(msg.chat.id, 'Please send a video file.');
    const meta = parseCaption(msg.caption || '');
    if (!meta) return bot.sendMessage(msg.chat.id, categoryHelp);
    const ext = (path.extname((msg.document && msg.document.file_name) || '') || '.mp4').toLowerCase();
    const filename = `${Date.now()}_${cleanName(meta.title)}${['.mp4','.webm','.mov','.mkv'].includes(ext) ? ext : '.mp4'}`;
    await bot.sendMessage(msg.chat.id, 'Uploading authorized video to your hosting…');
    await downloadTelegramFile(media.file_id, filename);
    const videoUrl = `${PUBLIC_BASE_URL.replace(/\/$/,'')}/media/${encodeURIComponent(filename)}`;
    const now = Date.now();
    let ref, record;
    if (meta.kind === 'movie') {
      record = {title:meta.title, link:videoUrl, type:'movie', timestamp:now, source:'telegram-bot', authorizedUpload:true};
      ref = await db.ref('movies').push(record);
    } else if (meta.kind === 'short') {
      record = {title:meta.title, videoUrl, description:'', thumbnail:'', category:'Short Drama', isNew:true, isPremium:false, timestamp:now, source:'telegram-bot', authorizedUpload:true};
      ref = await db.ref('shorts').push(record);
    } else {
      // Match the admin panel's webseries/episodes schema.
      record = {title:meta.title, poster:'', backdrop:'', rating:'', year:String(new Date().getFullYear()), storyline:'Imported by Telegram bot', category:'Drama', episodes:[{season:1,episode:1,title:meta.title,thumbnail:'',link:videoUrl,isPremium:false}], type:'webseries', timestamp:now, source:'telegram-bot', authorizedUpload:true};
      ref = await db.ref('webseries').push(record);
    }
    await bot.sendMessage(msg.chat.id, `✅ Added to ${meta.kind.toUpperCase()}\\nTitle: ${meta.title}\\nHosted URL: ${videoUrl}\\nFirebase ID: ${ref.key}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, `Import failed: ${err.message}`);
  }
});
bot.on('polling_error', err => console.error('Telegram polling error:', err.message));
