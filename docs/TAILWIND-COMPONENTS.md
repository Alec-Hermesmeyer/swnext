# Tailwind CSS Components Documentation

## 🚀 Migration Progress

This document tracks the migration from CSS modules to Tailwind CSS components.

---

## ✅ Completed Components

### 1. HeroTailwind Component

**Location**: `/components/HeroTailwind.jsx`  
**Original**: `/components/Hero.jsx` (uses CSS modules)  
**Status**: ✅ Complete and tested

#### Features:
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Modern Styling**: Gradient background, glass morphism cards, smooth animations  
- **Performance**: Uses Next.js Image optimization with priority loading
- **Accessibility**: Proper semantic HTML and focus states
- **Brand Consistent**: Maintains S&W Foundation colors and messaging

#### Usage:
```jsx
import HeroTailwind from '@/components/HeroTailwind';

export default function MyPage() {
  return <HeroTailwind />;
}
```

#### Key Improvements:
- ✅ **EXACT UI MATCH**: Perfectly matches live https://swfoundation.com website
- ✅ Full-screen construction site background with dark overlay
- ✅ Centered hero text with proper typography hierarchy
- ✅ Red CTA buttons (#DC2626) matching live site
- ✅ Blue contact section with red stripe accent
- ✅ Nation-wide service messaging and contact details
- ✅ Mobile-responsive design with proper scaling

---

### 2. NavTailwind Component

**Location**: `/components/NavTailwind.jsx`  
**Original**: `/components/Nav.jsx` (uses CSS modules)  
**Status**: ✅ Complete and tested

#### Features:
- **Responsive Navigation**: Desktop horizontal, mobile hamburger menu
- **Sticky Header**: Stays at top during scroll
- **Brand Integration**: Logo, company name, contact info
- **Social Links**: LinkedIn and Facebook integration
- **Mobile Optimized**: Touch-friendly mobile menu

#### Usage:
```jsx
import NavTailwind from '@/components/NavTailwind';

export default function MyPage() {
  return (
    <>
      <NavTailwind />
      {/* Page content */}
    </>
  );
}
```

#### Key Improvements:
- ✅ **EXACT UI MATCH**: Perfectly matches live https://swfoundation.com navigation
- ✅ Clean white header with circular logo (exactly 60px)
- ✅ Simplified navigation menu (About, Services, Contact, Careers, Gallery)
- ✅ Blue social media icons positioned on right
- ✅ Proper spacing and typography matching live site
- ✅ Mobile-responsive hamburger menu
- ✅ No CSS modules required

---

## 🧪 Test Pages

### Hero Showcase Page
**URL**: `/hero-showcase`  
**Purpose**: Demonstrates both Hero and Navigation components together  
**Features**: Side-by-side comparison of improvements

---

## 📋 Next Components to Migrate

### High Priority:
1. **Footer Component** - Used across all pages
2. **Service Cards/Grid** - Important for homepage
3. **Contact Forms** - High conversion priority
4. **Layout Component** - Wrapper for all pages

### Medium Priority:
5. **Info/About Sections** - Content areas
6. **Image Galleries** - Project showcases  
7. **Button Components** - Reusable UI elements

### Low Priority:
8. **Admin Components** - Internal tools
9. **Blog Components** - Content management
10. **Specialized Pages** - Individual service pages

---

## 🎨 Design System

### Color Palette:
- **Primary**: Orange (`bg-orange-500`, `text-orange-600`)
- **Secondary**: Blue (`bg-blue-900`, `text-blue-100`)
- **Neutral**: Gray scale (`bg-gray-50` to `bg-gray-900`)
- **Accent**: White with transparency (`bg-white/10`)

### Typography:
- **Headlines**: Inter font family
- **Body**: Default system fonts
- **Brand**: Lato font family (maintaining original)

### Spacing:
- **Container**: `container mx-auto px-4`
- **Sections**: `py-16 lg:py-24`
- **Cards**: `p-6`
- **Grid Gap**: `gap-6` or `gap-8`

### Responsive Breakpoints:
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Large**: `xl:` (1280px+)

---

## 💡 Migration Guidelines

### Before Starting:
1. Analyze existing CSS module
2. Identify key styling patterns
3. Plan responsive behavior
4. Consider accessibility improvements

### During Migration:
1. Create new component alongside existing
2. Use descriptive Tailwind classes
3. Maintain semantic HTML structure
4. Test on multiple screen sizes
5. Verify accessibility

### After Migration:
1. Create test/showcase page
2. Document component usage
3. Update this documentation
4. Plan integration into existing pages

---

## 🔗 Useful Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Responsive Design Guidelines](https://tailwindcss.com/docs/responsive-design)
- [Next.js + Tailwind Setup](https://nextjs.org/docs/pages/building-your-application/styling/tailwind-css)

---

*Last updated: $(date)*  
*Components ready for production use: 2*  
*Total components to migrate: ~20*