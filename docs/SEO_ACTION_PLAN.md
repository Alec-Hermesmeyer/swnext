# 🚀 S&W Foundation SEO Action Plan

## Executive Summary
Complete SEO strategy to drive organic growth for S&W Foundation without paid advertising. Focus on local SEO, technical optimization, and content marketing to dominate Dallas commercial foundation market.

---

## ✅ COMPLETED TASKS

### 1. **Image Optimization** ✓
- Migrated all pages to Supabase cloud storage
- Created centralized image configuration
- Fixed image mismatches across all service pages
- Implemented proper alt text and lazy loading

### 2. **Technical SEO Setup** ✓
- Created comprehensive SEO configuration (`/config/seoConfig.js`)
- Implemented structured data schemas
- Set up proper meta tags on all pages
- Added canonical URLs
- Configured Open Graph and Twitter cards

### 3. **Forms Verification** ✓
- Contact form connected to Supabase
- Careers form connected to Supabase  
- Email notifications via Nodemailer
- Forms send to appropriate team members

---

## 📋 IMMEDIATE ACTIONS (Week 1)

### 1. **Google My Business Optimization**
```
□ Claim/verify GMB listing
□ Add all service categories
□ Upload 20+ project photos
□ Add service area (200-mile radius)
□ Enable messaging
□ Post weekly updates
□ Respond to all reviews
```

### 2. **Technical Fixes**
```bash
# Generate sitemap
npm install next-sitemap
# Add to next.config.js and create next-sitemap.config.js

# Check Core Web Vitals
npm run build && npm run analyze
```

### 3. **Schema Markup Implementation**
Add to every page:
- ✓ LocalBusiness schema
- ✓ Service schema  
- ✓ BreadcrumbList schema
- □ FAQPage schema (add to service pages)
- □ Review/AggregateRating schema

---

## 🎯 30-DAY PLAN

### Week 1: Foundation
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics 4
- [ ] Install Microsoft Clarity for heatmaps
- [ ] Create robots.txt file
- [ ] Verify all forms with test submissions
- [ ] Set up 301 redirects for any old URLs

### Week 2: Local SEO
- [ ] Create location pages:
  - Dallas
  - Fort Worth
  - Plano
  - Arlington
  - Irving
- [ ] Build 25 local citations:
  - Yelp
  - Yellow Pages
  - Angie's List
  - HomeAdvisor
  - BuildZoom
- [ ] Join local associations online

### Week 3: Content Creation
- [ ] Write 4 cornerstone articles:
  1. "Complete Guide to Commercial Pier Drilling in Dallas"
  2. "Foundation Problems in Texas Clay Soil"
  3. "Cost Guide: Commercial Foundation Work"
  4. "When to Choose Helical Piles vs Traditional Piers"
- [ ] Create FAQ sections for each service
- [ ] Add case studies (3 minimum)

### Week 4: Link Building
- [ ] ADSC member page link
- [ ] Supplier partner links (5)
- [ ] Local Chamber of Commerce
- [ ] Industry publication submissions
- [ ] Press release for recent projects

---

## 📈 ONGOING MONTHLY TASKS

### Content Calendar
**Week 1:** Educational post + GMB update
**Week 2:** Case study + social sharing
**Week 3:** Industry news commentary + GMB photos
**Week 4:** Seasonal tips + review requests

### Monthly Checklist
- [ ] 4 blog posts (500+ words)
- [ ] 8 GMB posts
- [ ] 10 new photos added
- [ ] 5 review requests sent
- [ ] 2 video uploads
- [ ] Technical audit
- [ ] Competitor analysis
- [ ] Rank tracking update

---

## 🎯 KEY PERFORMANCE INDICATORS

### Primary Metrics (Check Monthly)
1. **Organic Traffic**: Target 50% increase in 6 months
2. **Local Pack Rankings**: Top 3 for "pier drilling dallas"
3. **Lead Generation**: 20+ organic leads/month
4. **Domain Authority**: Increase from current to 40+

### Target Keywords to Track
```
PRIMARY (Must rank top 3):
- "pier drilling dallas"
- "foundation contractors dallas"
- "commercial foundation repair dallas"

SECONDARY (Top 10):
- "limited access drilling texas"
- "helical piles dallas"
- "turn key foundation contractor"
- "crane foundation services"
- "ADSC contractor dallas"

LONG-TAIL (Top 20):
- "emergency foundation repair dallas tx"
- "deep pier drilling contractors near me"
- "commercial building foundation specialists"
- "confined space drilling services dallas"
```

---

## 💡 QUICK WINS

### This Week
1. **Add FAQ Schema** to services page
2. **Create Google Posts** about safety awards
3. **Upload project photos** to GMB (before/after)
4. **Request reviews** from last 5 clients
5. **Add alt text** to remaining images

### Easy Content Ideas
1. "Project Spotlight" posts (weekly)
2. "Safety Tip Tuesday" series
3. "Equipment Feature Friday"
4. "Meet the Team Monday"
5. Before/after transformations

---

## 📞 FORM TESTING CHECKLIST

### Contact Form (/contact)
- [x] Submits to Supabase `contact_form` table
- [x] Sends email to: mattm@swfoundation.com, colinw@swfoundation.com
- [ ] Test submission successful
- [ ] Email received
- [ ] Mobile responsive

### Careers Form (/contact)
- [x] Submits to Supabase `job_form` table  
- [x] Sends email to: cliffw@swfoundation.com, colinw@swfoundation.com
- [ ] Test submission successful
- [ ] Email received
- [ ] Position dropdown works

### Required Environment Variables
```env
# Add to .env.local
MAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
NEXT_PUBLIC_SUPABASE_URL=https://edycymyofrowahspzzpg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔧 TECHNICAL SETUP

### Install Required Packages
```bash
# If not already installed
npm install nodemailer
npm install @supabase/supabase-js
npm install next-sitemap
```

### Sitemap Configuration
Create `next-sitemap.config.js`:
```javascript
module.exports = {
  siteUrl: 'https://www.swfoundation.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/admin' }
    ]
  }
}
```

---

## 📱 COMPETITIVE ADVANTAGE

### Your Strengths to Highlight
1. **13-Time ADSC Safety Award Winner** - Use in every title/description
2. **Family-Owned Since 1986** - Trust signal
3. **Limited Access Specialists** - Unique capability
4. **Turn-Key Solutions** - Complete service offering
5. **Emergency Response** - 24/7 availability

### Content Gaps to Fill
- Video tutorials on foundation issues
- Cost calculators
- Interactive project galleries
- Client success stories
- Equipment capability guides
- Seasonal maintenance checklists

---

## 🎬 NEXT STEPS

### Priority 1 (Today)
1. Test both forms with actual submissions
2. Set up Google Search Console
3. Submit sitemap
4. Create first GMB post

### Priority 2 (This Week)  
1. Write first blog post
2. Add 10 project photos to GMB
3. Request 5 reviews
4. Create location pages

### Priority 3 (This Month)
1. Build 25 citations
2. Publish 4 articles
3. Get 10+ reviews
4. Create video content

---

## 📊 SUCCESS METRICS

### Month 1 Goals
- 20% increase in organic traffic
- 5 new reviews
- 10 organic leads
- Top 10 for primary keywords

### Month 3 Goals  
- 50% increase in organic traffic
- 15+ total reviews (4.5+ rating)
- 30 organic leads/month
- Top 5 for primary keywords

### Month 6 Goals
- 100% increase in organic traffic
- 30+ reviews
- 50+ organic leads/month
- Top 3 for all primary keywords
- Featured snippets for 5+ queries

---

## ⚠️ IMPORTANT REMINDERS

1. **Never** buy backlinks or reviews
2. **Always** respond to reviews within 24 hours
3. **Update** GMB weekly minimum
4. **Monitor** Search Console for errors
5. **Track** phone calls from organic
6. **Test** forms monthly
7. **Audit** site quarterly
8. **Review** competitors monthly

---

## 📈 ROI PROJECTION

With consistent implementation:
- **Month 1-3**: 10-20 leads/month = $50-100k potential revenue
- **Month 4-6**: 30-50 leads/month = $150-250k potential revenue  
- **Month 7-12**: 50-100 leads/month = $250-500k potential revenue

**Zero advertising spend required!**

---

*Last Updated: September 5, 2025*
*Next Review: October 5, 2025*