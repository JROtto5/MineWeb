# 🚀 Deploy to Vercel - Quick Guide

Your Minecraft browser game is ready to deploy to Vercel!

## ✅ Code is Already on GitHub

Your code has been pushed to: **https://github.com/JROtto5/MineWeb**

## 🌐 Deploy to Vercel in 3 Steps

### Step 1: Go to Vercel
Visit: **https://vercel.com**

### Step 2: Import Your Repository

1. Click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Connect your GitHub account if needed
4. Find and select: **JROtto5/MineWeb**

### Step 3: Deploy

1. Vercel will auto-detect **Next.js**
2. Click **"Deploy"**
3. Wait 1-2 minutes for build
4. **Done!** Your game will be live at: `https://mineweb.vercel.app` (or similar)

## 🎮 After Deployment

Once deployed, you can:

- **Play instantly** - Open the URL in any browser
- **Share the link** - Anyone can play without installing anything!
- **Auto-deploys** - Push to GitHub = automatic redeploy

## 🔧 Configuration (Optional)

Vercel auto-detects everything, but if needed:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

No environment variables needed!

## 📊 Performance Tips

After deployment, if the game is slow:

1. Go to project settings in Vercel
2. Enable **Edge Functions** (faster worldwide)
3. Or edit `lib/engine/World.ts` and reduce `RENDER_DISTANCE` to 2

## 🐛 Troubleshooting

### Build Failed?
- Check Vercel build logs
- Make sure `package.json` dependencies are correct
- Try: `npm run build` locally first

### Game Won't Load?
- Check browser console for errors
- Make sure browser supports WebGL
- Try different browser (Chrome/Firefox/Edge)

### Low FPS?
The game is CPU-intensive. Reduce render distance or chunk height in `World.ts`.

---

## 🎉 That's It!

Your game will be live at a Vercel URL in minutes!

**Share the link and let people play!** 🎮
