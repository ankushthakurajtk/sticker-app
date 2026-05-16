const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const archiver = require('archiver');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ TEXT GENERATION ============
const textLibrary = {
  motivational: {
    positive: [
      "You are stronger than you think! 💪",
      "Every day is a new opportunity 🌟",
      "Believe in yourself always ✨",
      "Your potential is limitless 🚀",
      "Keep pushing forward 🔥",
      "You've got this! 🎯",
      "Success starts with determination 💎",
      "Be the best version of yourself 👑",
      "Your dreams are worth fighting for 💭",
      "Stay focused, stay strong 🧠"
    ],
    neutral: [
      "Progress over perfection 📈",
      "Small steps lead to big results 🎲",
      "Focus on what you can control 🎯",
      "One day at a time ⏰",
      "Keep it simple, keep moving 🚶",
    ]
  },
  casual: {
    positive: [
      "Hey there! 👋",
      "What's up? 😎",
      "How's it going? 🤔",
      "Just chilling 😌",
      "Living my best life ✨",
      "Good vibes only ☀️",
      "Catching up soon? 🙌",
      "Let's hang sometime! 🎉",
      "Just thinking of you 💭",
      "Hope you're doing amazing! 🌈"
    ],
    humorous: [
      "Me: having a productive day 📱",
      "Coffee: my best friend ☕",
      "Sleep is overrated anyway 😴",
      "Adulting is hard 😅",
      "Current mood: vibing ✨",
      "Professional procrastinator 🎭",
      "Existing is exhausting 😂",
      "Send snacks 🍕"
    ]
  },
  romantic: {
    positive: [
      "Thinking of you 💕",
      "You make me smile 😊",
      "You mean the world to me 🌍",
      "My heart belongs to you 💗",
      "Forever starts with you 💫",
      "You're my favorite 💖",
      "With you, everything feels right 🌟",
      "You complete me ❤️",
      "Every moment with you is special 💝"
    ],
    thoughtful: [
      "Missed you today 🥺",
      "Can't stop thinking about you 💭",
      "You matter so much 💙",
      "Thank you for being you 🙏",
      "Distance doesn't change how I feel 🌙",
      "You inspire me daily ✨"
    ]
  },
  funny: {
    humorous: [
      "I'm not lazy, I'm just on eco mode 🔋",
      "Sarcasm is my second language 😏",
      "I pretend to work, they pretend to pay me 💼",
      "Nope 👎",
      "Maybe later 🤷",
      "Still thinking about it 🤔",
      "Goals: sleep, repeat 😴",
      "Plot twist: I have no idea what I'm doing 🎬",
      "Chaotic energy activated ⚡",
      "Zero productivity mode unlocked 🔓"
    ]
  },
  inspirational: {
    positive: [
      "You are capable of amazing things 🌟",
      "Your voice matters 📣",
      "Change starts with you 🔄",
      "Lead with kindness 🤍",
      "Embrace your uniqueness 🦋",
      "Make it happen 🎯",
      "You're unstoppable 🌪️",
      "Rise and shine ☀️",
      "Be the change you want to see 🌍",
      "Your story is just beginning 📖"
    ]
  }
};

// Generate AI texts with Gemini/GPT
async function generateAITexts(style, sentiment, location) {
  // Fallback: use library + personalization
  const baseTexts = textLibrary[style]?.[sentiment] || textLibrary.motivational.positive;
  
  // Personalize with location
  let personalizedTexts = [...baseTexts];
  if (location) {
    personalizedTexts = personalizedTexts.map(text => 
      text.replace(/!$/, ` from ${location}!`)
    );
  }

  // Generate variations
  const variations = [];
  const timeGreetings = [
    "Good morning! 🌅",
    "Good afternoon! ☀️",
    "Good evening! 🌙",
    "Happy day! 🎉",
    "Top of the morning! 🍀"
  ];

  const emojis = [
    "💫", "✨", "🌟", "⭐", "🎯", "🔥", "💯", "🎉", "🙌", "💪",
    "🚀", "💡", "🎊", "🎈", "💝", "🌈", "☀️", "🌙", "⚡", "🦋"
  ];

  for (let i = 0; i < 150; i++) {
    const randomText = baseTexts[i % baseTexts.length];
    const randomGreeting = timeGreetings[i % timeGreetings.length];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    let variedText = randomText;
    
    // Add variations
    if (i % 5 === 0) {
      variedText = `${randomGreeting} ${variedText}`;
    }
    if (i % 3 === 0 && location) {
      variedText = `${variedText} (from ${location})`;
    }
    if (i % 2 === 0) {
      variedText = `${variedText} ${randomEmoji}`;
    }
    
    variations.push(variedText);
  }

  return variations;
}

// ============ SENTIMENT ANALYSIS ============
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'amazing', 'love', 'happy', 'awesome', 'wonderful', 'fantastic'];
  const negativeWords = ['bad', 'sad', 'hate', 'terrible', 'awful', 'worst', 'angry'];
  
  const lower = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// ============ IMAGE PROCESSING ============
async function createSticker(imageBuffer, text, width = 512, height = 512) {
  try {
    // Read image
    let image = await Jimp.read(imageBuffer);
    
    // Resize to sticker size
    image.resize(width, height);
    
    // Add semi-transparent overlay for text readability
    const overlay = new Jimp(width, height, 0x00000080); // 50% transparent black
    image.composite(overlay, 0, 0);
    
    // Add text with Jimp's built-in font
    // Load default font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    
    // Measure text and position
    const textX = 20;
    const textY = height - 100;
    
    // Add text to image
    image.print(font, textX, textY, {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      maxWidth: width - 40
    }, width, height);
    
    return await image.getBuffer('image/png');
  } catch (error) {
    console.error('Error creating sticker:', error);
    // Fallback: return basic image
    return imageBuffer;
  }
}

// ============ ZIP CREATION ============
function createZipStream(stickers) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];

    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    stickers.forEach((stickerData, index) => {
      archive.append(Buffer.from(stickerData, 'binary'), { 
        name: `sticker_${String(index + 1).padStart(3, '0')}.png` 
      });
    });

    archive.finalize();
  });
}

// ============ MAIN ROUTE ============
app.post('/api/generate-stickers', upload.single('image'), async (req, res) => {
  try {
    const { preferences } = req.body;
    const prefs = JSON.parse(preferences);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('Preferences:', prefs);

    // Get texts
    let texts;
    if (prefs.useAI) {
      texts = await generateAITexts(prefs.textStyle, prefs.sentiment, prefs.location);
    } else {
      texts = prefs.uploadedTexts || [];
      // Pad to 150 if fewer
      while (texts.length < 150) {
        texts.push(...prefs.uploadedTexts);
      }
      texts = texts.slice(0, 150);
    }

    console.log(`Generated ${texts.length} texts`);

    // Generate stickers
    const stickers = [];
    for (let i = 0; i < texts.length; i++) {
      console.log(`Creating sticker ${i + 1}/${texts.length}`);
      const stickerBuffer = await createSticker(req.file.buffer, texts[i]);
      stickers.push(stickerBuffer);
    }

    // Create ZIP
    const zipBuffer = await createZipStream(stickers);

    // Send ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="stickers.zip"');
    res.send(zipBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Sticker server running on http://localhost:${PORT}`);
  console.log('Frontend: http://localhost:5000');
  console.log('API: http://localhost:${PORT}/api/generate-stickers\n');
});

module.exports = app;
