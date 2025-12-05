# 📊 Analytics & Tracking Setup Guide

## Current Setup Status
✅ Google Search Console - Configured
✅ GTM Container (GTM-MJNDLQZ) - Partially installed
⏳ GA4 - Needs measurement ID
⏳ GTM - Needs completion

---

## 🔍 Where to Find Your Tracking Codes

### 1. **Google Analytics 4 (GA4)**
1. Go to [Google Analytics](https://analytics.google.com)
2. Click Admin (gear icon) → Data Streams
3. Click on your web stream
4. Find "Measurement ID" (starts with `G-`)
5. Copy the ID (looks like: `G-XXXXXXXXXX`)

### 2. **Google Tag Manager (GTM)**
1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Click on your container
3. Container ID is at the top (GTM-MJNDLQZ)
4. Click "Install Google Tag Manager" for full code

### 3. **Google Search Console**
1. Already configured! ✅
2. Verify at [Search Console](https://search.google.com/search-console)
3. Submit sitemap: `https://www.swfoundation.com/sitemap.xml`

---

## 📝 Quick Setup Instructions

### Step 1: Update Analytics Component
Edit `/components/Analytics.jsx`:
```javascript
// Line 7 - Replace with your actual GA4 ID
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Your GA4 ID here
const GTM_ID = 'GTM-MJNDLQZ'; // Already have this
```

### Step 2: Verify Installation
After updating, check in browser console:
```javascript
// Should return true if GA4 is loaded
typeof gtag !== 'undefined'

// Should return true if GTM is loaded
typeof dataLayer !== 'undefined'
```

### Step 3: Test Events
1. Submit a form - should track as `form_submit`
2. Click phone number - should track as `phone_click`
3. Scroll page - should track scroll depth (25%, 50%, 75%, 90%)

---

## 🎯 What's Being Tracked

### Automatic Events (GA4)
- Page views
- Session start
- First visit
- User engagement
- Scroll tracking (25%, 50%, 75%, 90%)

### Custom Events (Added)
- **form_submit** - Contact & Career forms
- **phone_click** - Phone number clicks
- **scroll** - Depth milestones

### Enhanced Ecommerce (Ready to implement)
- Lead value tracking
- Service interest tracking
- Conversion funnel analysis

---

## ✅ Verification Checklist

### Google Analytics 4
- [ ] GA4 property created
- [ ] Measurement ID added to code
- [ ] Real-time view shows your visit
- [ ] Events appearing in DebugView
- [ ] Conversions configured (forms, calls)

### Google Tag Manager
- [ ] Container installed (both scripts)
- [ ] Preview mode working
- [ ] Tags firing correctly
- [ ] Form submission trigger created
- [ ] Phone click trigger created

### Google Search Console
- [x] Property verified
- [ ] Sitemap submitted
- [ ] No crawl errors
- [ ] Mobile usability passing
- [ ] Core Web Vitals monitored

---

## 📊 Recommended GTM Tags to Create

### 1. GA4 Configuration Tag
- **Tag Type**: Google Analytics: GA4 Configuration
- **Measurement ID**: Your G-XXXXXXXXXX
- **Trigger**: All Pages

### 2. Form Submission Tag
- **Tag Type**: GA4 Event
- **Event Name**: generate_lead
- **Trigger**: Form Submission

### 3. Phone Click Tag
- **Tag Type**: GA4 Event  
- **Event Name**: contact
- **Trigger**: Click - Tel Links

### 4. Scroll Tracking Tag
- **Tag Type**: GA4 Event
- **Event Name**: scroll
- **Trigger**: Scroll Depth (25%, 50%, 75%, 90%)

---

## 🎯 Conversion Goals to Set Up

### Primary Conversions (GA4)
1. **Contact Form Submit** - Value: $500
2. **Career Form Submit** - Value: $50
3. **Phone Call Click** - Value: $200
4. **Email Click** - Value: $100

### Secondary Goals
1. **Service Page View** - Engagement
2. **3+ Page Views** - Quality visitor
3. **2+ Minute Session** - Engaged user
4. **Gallery View** - Interest signal

---

## 📈 KPIs to Monitor

### Weekly
- Users & New users
- Average engagement time
- Form submissions
- Phone clicks
- Top landing pages

### Monthly  
- Organic traffic growth %
- Conversion rate
- Cost per acquisition (CPA)
- User flow through site
- Device & browser stats

### Quarterly
- YoY growth comparison
- Channel performance
- User retention
- Goal completions
- Revenue attribution

---

## 🚨 Common Issues & Fixes

### GA4 Not Tracking
```javascript
// Check in Console
gtag('config', 'G-XXXXXXXXXX');
dataLayer.push({'event': 'test_event'});
```

### GTM Not Loading
- Check for ad blockers
- Verify container ID
- Check publish status in GTM

### Events Not Appearing
- Enable Debug View in GA4
- Use GTM Preview mode
- Check trigger conditions

---

## 📱 Testing Tools

### Browser Extensions
- [Google Tag Assistant](https://tagassistant.google.com/)
- [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- [GTM/GA Debug](https://chrome.google.com/webstore/detail/gtmga-debug)

### Online Tools
- [GA4 DebugView](https://analytics.google.com/analytics/web/#/debugview)
- [GTM Preview Mode](https://tagmanager.google.com/#/container/preview)
- [Rich Results Test](https://search.google.com/test/rich-results)

---

## 📞 Support Resources

### Documentation
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [GTM Quick Start](https://support.google.com/tagmanager/answer/6103696)
- [Search Console Help](https://support.google.com/webmasters)

### Video Tutorials
- [GA4 for Beginners](https://analytics.google.com/analytics/academy/)
- [GTM Fundamentals](https://analytics.google.com/analytics/academy/course/5)

---

## ✅ Next Steps

1. **Today**: Add your GA4 Measurement ID
2. **This Week**: Set up conversion tracking
3. **This Month**: Create custom audiences
4. **Ongoing**: Monitor and optimize

---

*Remember: It takes 24-48 hours for data to fully populate in GA4*