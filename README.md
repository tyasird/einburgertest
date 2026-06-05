# Einbürgerungstest

A cross-platform test preparation application for German citizenship exam (Einbürgerungsprüfung) with cloud-based authentication and multi-language support.

## 🚀 Tech Stack

### Frontend
- **Expo** (v53.0.0) - Cross-platform framework for React Native
- **React** (18.3.1) - UI framework
- **React Native** (0.76.9) - Native mobile development
- **React Native Web** (0.20.0) - Web runtime for React Native
- **AsyncStorage** - Local data persistence

### Backend / Auth
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare KV** - Key-value database for user credentials
- **SHA-256 hashing** + salt for password security

### Deployment
- **Vercel** - Web app hosting (connected to GitHub)
- **Expo EAS** - iOS app build & distribution
- **Wrangler CLI** - Cloudflare Workers deployment

## 📋 Project Structure

```
einburgertest/
├── App.js                    # Main React Native app
├── app.json                  # Expo config
├── eas.json                  # Expo EAS build config
├── wrangler.toml            # Cloudflare Worker config
├── package.json             # Dependencies & scripts
├── worker/
│   └── index.js             # Cloudflare Worker auth API
├── data/
│   ├── questions.json       # German source questions
│   ├── questions_meta.json  # Question metadata
│   ├── questions_tr.json    # Turkish translations
│   ├── questions_en.json    # English translations
│   ├── questions_es.json    # Spanish translations
│   ├── questions_ar.json    # Arabic translations
│   ├── questions_fa.json    # Persian translations
│   └── questions_ru.json    # Russian translations
├── assets/                  # Images & static files
└── dist/                    # Web build output (auto-generated)
```

## 🔑 Key Features

- **Cross-platform:** iOS, Android, Web (single codebase)
- **Cloud auth:** User registration & login via Cloudflare Workers
- **Persistent login:** Session stored locally via AsyncStorage
- **Multi-language:** German source text with Turkish, English, Spanish, Arabic, Persian, and Russian translations
- **Question tracking:** Favorites, progress
- **Offline-first:** Works offline after first load

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for Worker deployment)

### Installation

```bash
# Install dependencies
npm install

# Set up Cloudflare KV namespace
npx wrangler kv namespace create AUTH_USERS

# Copy namespace ID to wrangler.toml
# Find the id and update:
# [[kv_namespaces]]
# binding = "AUTH_USERS"
# id = "YOUR_KV_NAMESPACE_ID"
```

### Local Development

```bash
# Web development
npm run web
# Opens http://localhost:19000

# Mobile preview
npm run android    # Android emulator
npm run ios        # iOS simulator

# Worker development (local)
npm run worker:dev
# Opens local Worker at http://localhost:8787
```

### Configuration

Update `App.js` line 22 with your deployed Worker URL:
```javascript
const AUTH_API_BASE_URL = "https://YOUR_WORKER_NAME.ACCOUNT.workers.dev";
```

## 📦 Deployment

### Web (Vercel)

1. **Connect GitHub repo to Vercel**
   - Settings > Build & Development
   - Build Command: `npm run build:web`
   - Output Directory: `dist`

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update questions"
   git push
   ```
   Vercel auto-deploys on push.

### Worker API (Cloudflare)

```bash
# Deploy Worker + KV binding
npm run worker:deploy
```

Worker endpoints:
- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate user

### iOS (EAS)

```bash
# Requires EAS CLI setup
npm run build:ios       # Build for App Store
npm run submit:ios      # Submit to App Store
```

## 🔄 Update Workflow

### Update Questions JSON

1. Edit files under `data/` such as `questions.json`, `questions_meta.json`, or a translation file
2. Test locally:
   ```bash
   npm run web
   ```
3. Push changes:
   ```bash
   git add data/*.json
   git commit -m "Update questions"
   git push
   ```
4. Vercel automatically redeploys

### Update Worker Code

1. Edit `worker/index.js`
2. Test locally:
   ```bash
   npm run worker:dev
   ```
3. Deploy:
   ```bash
   npm run worker:deploy
   ```

## 📝 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run start` | Start Expo development server |
| `npm run web` | Run web version locally |
| `npm run android` | Run Android emulator |
| `npm run ios` | Run iOS simulator |
| `npm run build:web` | Build web app for production |
| `npm run worker:dev` | Start Cloudflare Worker locally |
| `npm run worker:deploy` | Deploy Worker to Cloudflare |
| `npm run build:ios` | Build iOS app for distribution |
| `npm run submit:ios` | Submit iOS app to App Store |

## 🔐 Security

- Passwords hashed with SHA-256 + random salt
- No plain-text password storage
- Worker API enforces CORS headers
- Minimum password length: 6 characters
- KV namespace isolated to this Worker

## 📊 User Data Storage

| Data | Storage | Scope |
|------|---------|-------|
| Credentials (username, hash) | Cloudflare KV | Global (all users) |
| Current session | AsyncStorage | Device-only |
| Favorites & answers | AsyncStorage | Device-only |
| Test progress | AsyncStorage | Device-only |

## 🚀 Environment Variables

Create `.env.production` for secrets (not tracked by git):

```env
# For Wrangler
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## 📱 Supported Platforms

| Platform | Status | How to Deploy |
|----------|--------|---------------|
| Web | ✅ Production | Vercel (auto) |
| iOS | ✅ Production | EAS (manual) |
| Android | ✅ Beta | EAS (manual) |

## 🐛 Troubleshooting

### Worker returns 404
- Check `wrangler.toml` has correct `id` for KV namespace
- Verify Worker URL in `App.js` matches deployed Worker

### Auth fails with "Not found"
- Worker URL must match deployment URL
- Ensure `/auth/register` and `/auth/login` paths are correct

### Vercel build fails
- Clear Vercel cache and redeploy
- Check `package.json` dependencies are installed

## 📄 License

MIT

## 👤 Author

Developed for German Citizenship Test Preparation
