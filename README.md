# Mayin – One-Click Self-Hosted AI Visibility Platform

Deploy **Mayin** on your own infrastructure in minutes using **Railway**.  
No servers, no Docker knowledge, no DevOps headaches.

This setup gives you:
- Full control of your data
- Your own database
- Your own API keys
- Your own infrastructure

---

## 🚀 One-Click Deployment

Click the button below to deploy Mayin on Railway.

👉 **Deploy on Railway**

https://railway.app/new/template?template=YOUR_GITHUB_REPO_URL

⏱️ Typical deployment time: **2–5 minutes**

---

## 🧠 What Gets Deployed

This template automatically creates:

- Backend API (Node.js / Express)
- Frontend App (Next.js)
- PostgreSQL database (Railway plugin)
- Secure environment variable setup

You do **not** need to manage servers, networking, or Docker.

---

## 🔑 Environment Variables You Need to Fill

During deployment, Railway will ask for the following values:

| Variable | Description |
|--------|------------|
| LICENSE_SIGNING_SECRET | Private secret used to sign licenses |
| LICENSE_SERVER_URL | URL of your license server (if used) |
| LICENSE_SERVER_API_KEY | API key for license validation |
| OPENAI_API_KEY | (Optional) Your OpenAI API key |
| ADMIN_EMAIL | (Optional) Admin contact email |

🚫 You do **NOT** need to set:
- Database credentials
- Backend URL
- Ports
- Docker configuration

Railway handles these automatically.

---

## 🗄️ Database

- PostgreSQL is added using Railway’s managed plugin
- Backend connects automatically using `DATABASE_URL`
- Database migrations are **not run automatically** (safe by design)

If needed, migrations can be run manually via Railway Shell.

---

## 🌍 Accessing the App

After deployment:
- Frontend is available via a Railway public URL
- Backend is connected internally and securely
- You can attach a custom domain anytime via Railway settings

---

## 🔐 Security & Ownership

- Your data lives in your own database
- Your API keys are never shared
- No SaaS lock-in
- You can shut down or migrate anytime

This is **true self-hosting**, made simple.

---

## 🧑‍💻 For Developers

This repository is an **installer template only**.

It contains:
- Dockerfiles for backend and frontend
- `railway.json` for service wiring
- `.env.example` for configuration

The application source code lives in a separate private repository.

---

## ❓ Troubleshooting

If something doesn’t work:
- Check Railway build logs
- Confirm environment variables are filled
- Ensure PostgreSQL plugin is added

For licensing or support questions, contact the Mayin team.

---

## ✅ Summary

- One-click deployment
- Fully self-hosted
- No DevOps required
- Production-ready
- Founder-friendly
