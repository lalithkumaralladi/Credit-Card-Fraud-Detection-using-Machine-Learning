# Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## Pre-Deployment

- [ ] **Code is working locally**
  - [ ] Run `python run.py` and test the application
  - [ ] Upload a sample CSV file and verify it works
  - [ ] Check for any errors in console

- [ ] **Dependencies are up to date**
  - [ ] `requirements.txt` includes all necessary packages
  - [ ] Run `pip install -r requirements.txt` to verify

- [ ] **Environment configuration**
  - [ ] `.env.example` file exists (for reference)
  - [ ] `.env` file is in `.gitignore` (DO NOT commit secrets)
  - [ ] `config.py` loads environment variables correctly

- [ ] **Git repository**
  - [ ] Create GitHub repository
  - [ ] Add all files: `git add .`
  - [ ] Commit: `git commit -m "Initial commit for Render deployment"`
  - [ ] Push: `git push origin main`

## Render Setup

- [ ] **Create Render account**
  - [ ] Sign up at https://render.com
  - [ ] Verify your email

- [ ] **Connect GitHub**
  - [ ] Connect your GitHub account to Render
  - [ ] Authorize Render to access your repository

## Deployment (Choose ONE method)

### Method A: Using render.yaml (Recommended) ✨

- [ ] **Verify render.yaml exists** in your repository root
- [ ] **Create Blueprint on Render**
  - [ ] Dashboard → New → Blueprint
  - [ ] Select your repository
  - [ ] Render auto-detects `render.yaml`
  - [ ] Click "Apply"
- [ ] **Wait for deployment** to complete
- [ ] **Check logs** for any errors

### Method B: Manual Setup

- [ ] **Create Web Service**
  - [ ] Dashboard → New → Web Service
  - [ ] Select your repository
  - [ ] Name: `credit-card-fraud-detection`
  - [ ] Region: Choose closest to your users
  - [ ] Branch: `main`
  - [ ] Runtime: `Python 3`
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `python run.py`
  - [ ] Plan: `Free` (or `Starter` for better performance)

- [ ] **Set Environment Variables** (minimum required):
  ```
  APP_ENV=production
  DEBUG=False
  WORKERS=2
  LOG_LEVEL=info
  ```

- [ ] **Deploy**
  - [ ] Click "Create Web Service"
  - [ ] Wait for build and deployment

## Post-Deployment Verification

- [ ] **Check deployment status**
  - [ ] Build completed successfully (green checkmark)
  - [ ] Service is live and running

- [ ] **Test the application**
  - [ ] Visit your Render URL: `https://your-app.onrender.com`
  - [ ] Homepage loads correctly
  - [ ] Upload a small test CSV file
  - [ ] Verify fraud detection works
  - [ ] Check results are displayed

- [ ] **Review logs**
  - [ ] No critical errors in logs
  - [ ] Application starts without warnings
  - [ ] API endpoints respond correctly

- [ ] **Performance check**
  - [ ] Page loads in reasonable time
  - [ ] File upload works smoothly
  - [ ] Processing completes successfully

## Troubleshooting (If Issues Occur)

### Build Fails
- [ ] Check build logs for specific error
- [ ] Verify all packages in `requirements.txt` are correct
- [ ] Ensure Python version is compatible (3.11+)

### Application Won't Start
- [ ] Check runtime logs
- [ ] Verify `python run.py` works locally
- [ ] Check environment variables are set correctly
- [ ] Reduce `WORKERS` to `1` if memory issues

### Out of Memory Errors
- [ ] Set `WORKERS=1`
- [ ] Enable `SAMPLE_LARGE_DATASETS=True`
- [ ] Reduce `MAX_FILE_SIZE_MB`
- [ ] Consider upgrading to Starter plan

### Slow Performance
- [ ] Enable compression: `ENABLE_COMPRESSION=True`
- [ ] Increase workers (if on paid plan)
- [ ] Check `LARGE_DATASET_THRESHOLD` is appropriate
- [ ] Consider upgrading plan

## Optional Enhancements

- [ ] **Custom Domain** (Paid plans)
  - [ ] Add custom domain in Render settings
  - [ ] Update DNS records
  - [ ] Enable automatic HTTPS

- [ ] **Persistent Storage** (Paid plans)
  - [ ] Add disk storage in Render
  - [ ] Update `UPLOAD_DIR` and `MODEL_DIR` paths
  - [ ] Test file persistence

- [ ] **Monitoring**
  - [ ] Set up health check endpoint
  - [ ] Configure alerts in Render
  - [ ] Monitor usage metrics

- [ ] **Security Hardening**
  - [ ] Set specific `ALLOWED_HOSTS`
  - [ ] Configure proper `CORS_ORIGINS`
  - [ ] Use strong `SECRET_KEY`
  - [ ] Enable HTTPS redirect

## Support & Resources

- 📚 **Full Guide**: See `RENDER_DEPLOYMENT.md`
- 🔗 **Render Docs**: https://render.com/docs
- 💬 **Render Support**: https://render.com/support
- 📖 **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## Quick Reference: Minimum Environment Variables

For a quick deployment, these are the minimum variables needed:

```bash
APP_ENV=production
DEBUG=False
WORKERS=2
LOG_LEVEL=info
```

All other settings have sensible defaults and will work out of the box!

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Render URL**: _________________

**Status**: ⬜ Deployed ⬜ Verified ⬜ Production Ready

---

Good luck! 🚀
