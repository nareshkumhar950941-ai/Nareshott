# Naresh World Web App – सेटअप

## फाइलें
- `index.html` – मौजूदा Naresh World यूजर ऐप, नए प्लेयर टूल्स के साथ।
- `admin.html` – मौजूदा Admin Panel; इसमें आपके दिए TMDB key को सेट किया गया है।
- `telegram-stream-bot/` – Telegram से अधिकृत वीडियो लेकर होस्ट और Firebase में जोड़ने वाला Node.js बॉट।

## चालू करना
1. `index.html` और `admin.html` को HTTPS hosting पर रखें।
2. Firebase Authentication और Realtime Database rules को production के लिए सुरक्षित करें।
3. Admin panel में मूवी/सीरीज/शॉर्ट का डेटा जोड़ें। भाषा बदलने के लिए किसी रिकॉर्ड में `languageSources` और सबटाइटल के लिए `subtitleTracks` array जोड़ें।
4. Telegram bot के लिए `telegram-stream-bot/README.md` पढ़ें और सर्वर पर environment variables सेट करें।

## भाषा डेटा का उदाहरण
```json
{
  "languageSources": [
    {"label":"Hindi", "url":"https://your-host.example/hindi.mp4"},
    {"label":"English", "url":"https://your-host.example/english.mp4"}
  ],
  "subtitleTracks": [
    {"label":"Hindi", "language":"hi", "url":"https://your-host.example/hindi.vtt"}
  ]
}
```

## जरूरी सीमाएं
- 2x स्पीड और seek कंट्रोल प्लेयर में उपलब्ध हैं।
- Screen lock वेब UI के कंट्रोल लॉक करता है; यह फोन के हार्डवेयर बटन या OS स्क्रीन लॉक को नियंत्रित नहीं करता।
- Browser से MP4/WebM डाउनलोड संभव हो सकता है; HLS `.m3u8` को सीधे डाउनलोड करने के लिए अलग authorized packaging/download service चाहिए।
- कोई वेब प्लेयर रिकॉर्डिंग या स्क्रीनशॉट को पूरी तरह रोक नहीं सकता। DRM के लिए Widevine/FairPlay/PlayReady और लाइसेंस सर्वर जैसी सेवाएं चाहिए।
- Telegram bot केवल आपके या आपके पास वितरण अधिकार वाले वीडियो पर इस्तेमाल करें।
