# EcoLoop — Deployment Guide

## Why it was crashing locally (nodemon error)
The server Dockerfile was running `npm run dev` (nodemon) which crashes when it can't
connect to Postgres. On your local machine you don't have Postgres running — Docker
handles it. The fix: always run inside Docker via `docker compose up`.

## Login / Auth — is it working?
**Yes, it works — but only inside Docker.** The "network error" you saw was because:
- The Vite client proxies `/api` → `http://server:3001`
- `server` is a Docker internal hostname — it doesn't resolve on your local browser
- So auth calls fail when running outside Docker

When deployed on VPS with Docker Compose, `server` resolves correctly and login/register works fine.
Auth flow: email + name → no password, no OTP needed (DEV_MODE=true).

---

## Deploy to VPS (step by step)

### 1. Copy files to your VPS
```bash
# From your LOCAL machine (the folder where barter.zip was)
scp -i ~/ctfd/ssh-key.pem -r barter/ root@YOUR_VPS_IP:~/barter/
```
Or if using the .ppk key with PuTTY/psftp on Windows, use psftp to upload the folder.

### 2. SSH into VPS
```bash
ssh -i ~/ctfd/ssh-key.pem root@YOUR_VPS_IP
```

### 3. Edit the .env file — set your VPS IP
```bash
cd ~/barter
nano .env
# Change: VITE_API_URL=http://YOUR_VPS_IP:3001
# Also change: JWT_SECRET=some_long_random_string
```

### 4. Run the deploy script
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Open firewall ports (if needed)
```bash
ufw allow 3001
ufw allow 5173
```

### Access
- Frontend: http://YOUR_VPS_IP:5173
- API:      http://YOUR_VPS_IP:3001/api/health

---

## Auth notes
- Register with email + name. No password. No phone/OTP.
- DEV_MODE=true means OTP is skipped entirely — you can sign in/register with just email.
- To enable real phone OTP: set DEV_MODE=false and fill in Twilio credentials in .env.
- JWT tokens expire after 7 days.

## Useful commands
```bash
docker compose logs -f          # live logs
docker compose logs server -f   # just backend logs
docker compose down             # stop everything
docker compose up -d --build    # rebuild and restart
```
