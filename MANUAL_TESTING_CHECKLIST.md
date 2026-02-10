# 🧪 ProCreators.io - Complete Manual Testing Checklist

> **Testing Date:** _______________  
> **Tester Name:** _______________  
> **App URL:** Your deployed URL  
> **Test Account Email:** _______________

---

## 📋 How to Use This Checklist

- ✅ = Working as expected
- ❌ = Not working / Bug found
- ⚠️ = Partial / Needs attention
- ⏭️ = Skipped / Not applicable
- 📝 = Add notes in the "Notes" column

---

## Phase 1: Authentication & User Management

### 1.1 Registration Flow
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1.1.1 | Navigate to `/register` | Registration page loads | | |
| 1.1.2 | Submit empty form | Validation errors shown | | |
| 1.1.3 | Enter invalid email format | Email validation error | | |
| 1.1.4 | Enter weak password | Password requirements shown | | |
| 1.1.5 | Register with valid details | Account created, redirected | | |
| 1.1.6 | Try registering with same email | Error: "Email already exists" | | |
| 1.1.7 | Check email verification (if enabled) | Verification email received | | |

### 1.2 Login Flow
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1.2.1 | Navigate to `/login` | Login page loads | | |
| 1.2.2 | Submit empty form | Validation errors shown | | |
| 1.2.3 | Login with wrong password | Error: "Invalid credentials" | | |
| 1.2.4 | Login with non-existent email | Error: "User not found" | | |
| 1.2.5 | Login with correct credentials | Redirected to dashboard | | |
| 1.2.6 | Session persistence (refresh page) | Still logged in | | |
| 1.2.7 | Open new tab, still logged in | Session maintained | | |

### 1.3 Password Reset
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1.3.1 | Navigate to `/forgot-password` | Page loads with email input | | |
| 1.3.2 | Submit non-existent email | Appropriate message shown | | |
| 1.3.3 | Submit valid email | "Reset email sent" message | | |
| 1.3.4 | Check email for reset link | Email received with link | | |
| 1.3.5 | Click reset link | Reset password page loads | | |
| 1.3.6 | Submit new password | Password updated successfully | | |
| 1.3.7 | Login with new password | Login successful | | |

### 1.4 Logout
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 1.4.1 | Click logout button | Logged out, redirected to home | | |
| 1.4.2 | Try accessing `/dashboard` | Redirected to login | | |
| 1.4.3 | Browser back button after logout | Cannot access protected pages | | |

---

## Phase 2: Credit System

### 2.1 Initial Credits
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 2.1.1 | Create new account | Receives 50 free credits | | |
| 2.1.2 | Check header credit display | Shows 50 credits | | |
| 2.1.3 | Navigate to `/dashboard/billing` | Shows 50 credits (consistent) | | |
| 2.1.4 | Check credit history | Shows initial allocation | | |

### 2.2 Credit Deduction (Per Tool Category)
**Test each tool with a small generation and verify credits are deducted**

#### Text Generation Tools (Low Cost: 8-20 credits)
| # | Tool | Credit Cost | Deducted? | Notes |
|---|------|-------------|-----------|-------|
| 2.2.1 | Ad Copy Generator | 15 | | |
| 2.2.2 | Professional Email | 10 | | |
| 2.2.3 | Blog Creator | 20 | | |
| 2.2.4 | LinkedIn Posts | 10 | | |
| 2.2.5 | Story Writer | 15 | | |
| 2.2.6 | Love Letter | 10 | | |

#### PDF Generation Tools (Medium Cost: 20-40 credits)
| # | Tool | Credit Cost | Deducted? | Notes |
|---|------|-------------|-----------|-------|
| 2.2.7 | Planner Maker | 25 | | |
| 2.2.8 | Worksheet Maker | 25 | | |
| 2.2.9 | Coloring Book | 30 | | |
| 2.2.10 | Journal Maker | 25 | | |
| 2.2.11 | Checklist Maker | 20 | | |
| 2.2.12 | Ebook Maker | 40 | | |
| 2.2.13 | Storybook Maker | 35 | | |
| 2.2.14 | Activity Book | 30 | | |
| 2.2.15 | Quiz Maker | 20 | | |
| 2.2.16 | Learning Cards | 20 | | |
| 2.2.17 | Slides Maker | 30 | | |
| 2.2.18 | Notion Templates | 25 | | |
| 2.2.19 | Business Plan | 35 | | |
| 2.2.20 | Pitch Deck | 40 | | |
| 2.2.21 | SWOT Analysis | 25 | | |

#### Image Generation Tools (Medium-High Cost: 25-35 credits)
| # | Tool | Credit Cost | Deducted? | Notes |
|---|------|-------------|-----------|-------|
| 2.2.22 | Image Editor | 35 | | |
| 2.2.23 | Cover Image Creator | 30 | | |
| 2.2.24 | Podcast Cover Maker | 30 | | |
| 2.2.25 | Thumbnail Maker | 25 | | |
| 2.2.26 | Photo Cards | 25 | | |
| 2.2.27 | Carousels | 30 | | |

#### Video Tools (High Cost: 40-100 credits)
| # | Tool | Credit Cost | Deducted? | Notes |
|---|------|-------------|-----------|-------|
| 2.2.28 | Video Editor | 60 | | |
| 2.2.29 | AI Video Studio | 80 | | |
| 2.2.30 | Quick Reels | 70 | | |
| 2.2.31 | Auto Subtitles | 40 | | |

#### Audio Tools (Medium Cost: 25-50 credits)
| # | Tool | Credit Cost | Deducted? | Notes |
|---|------|-------------|-----------|-------|
| 2.2.32 | Audio Editor | 30 | | |
| 2.2.33 | Noise Remover | 25 | | |
| 2.2.34 | Voice Enhancer | 30 | | |

### 2.3 Credit Refund on Failure
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 2.3.1 | Cancel generation mid-way | Credits refunded | | |
| 2.3.2 | Generation fails (API error) | Credits refunded | | |
| 2.3.3 | Check refund in history | Refund entry visible | | |

### 2.4 Insufficient Credits
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 2.4.1 | Try tool with 0 credits | "Insufficient credits" error | | |
| 2.4.2 | Shown upgrade/purchase option | Modal/link to pricing | | |

---

## Phase 3: Subscription & Billing

### 3.1 Pricing Page
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 3.1.1 | Navigate to `/pricing` | Pricing page loads | | |
| 3.1.2 | All 4 tiers displayed | Free, Creator, Pro, Business | | |
| 3.1.3 | Monthly/Yearly toggle works | Prices update correctly | | |
| 3.1.4 | Current plan highlighted | Your plan shows "Current" | | |
| 3.1.5 | Feature comparison visible | Clear feature list | | |

### 3.2 Subscription Flow (If Stripe is configured)
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 3.2.1 | Click "Start Creator" plan | Redirected to Stripe checkout | | |
| 3.2.2 | Complete test payment | Subscription activated | | |
| 3.2.3 | Credits updated | 400 credits added | | |
| 3.2.4 | Plan shown in billing | "Creator" plan displayed | | |
| 3.2.5 | Cancel subscription | Confirmation required | | |

### 3.3 Billing Page
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 3.3.1 | Navigate to `/dashboard/billing` | Page loads correctly | | |
| 3.3.2 | Credit balance shown | Matches header display | | |
| 3.3.3 | Transaction history | Shows all transactions | | |
| 3.3.4 | Current plan info | Correct plan displayed | | |
| 3.3.5 | Buy credits button | Opens purchase modal | | |

---

## Phase 4: Dashboard & Navigation

### 4.1 Main Dashboard
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 4.1.1 | Navigate to `/dashboard` | Dashboard loads | | |
| 4.1.2 | Welcome message with name | Shows user's name | | |
| 4.1.3 | Credit balance visible | Correct amount shown | | |
| 4.1.4 | Quick stats displayed | Usage stats visible | | |
| 4.1.5 | Recent activity shown | Last generations listed | | |

### 4.2 Sidebar Navigation
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 4.2.1 | All menu items visible | No missing links | | |
| 4.2.2 | No duplicate icons | Clean professional look | | |
| 4.2.3 | Click each category | Category page loads | | |
| 4.2.4 | Active state highlighted | Current page indicated | | |
| 4.2.5 | Collapse sidebar (mobile) | Hamburger menu works | | |

### 4.3 Category Pages
| # | Category | Page Loads | Tools Listed | Notes |
|---|----------|------------|--------------|-------|
| 4.3.1 | Business AI | `/dashboard/business-ai` | | |
| 4.3.2 | Digital Products | `/dashboard/digital-products` | | |
| 4.3.3 | Students & Teachers | `/dashboard/students-teachers` | | |
| 4.3.4 | Jobs & Career | `/dashboard/jobs-career` | | |
| 4.3.5 | Fun & Recreation | `/dashboard/fun-recreation` | | |
| 4.3.6 | Image Generation | `/dashboard/image-generation` | | |
| 4.3.7 | Media Editing | `/dashboard/media-editing` | | |
| 4.3.8 | Viral Posts | `/dashboard/viral-posts` | | |

---

## Phase 5: Content Generation Tools (Functionality)

### 5.1 Social Media Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.1.1 | LinkedIn Posts | | | | | |
| 5.1.2 | Ad Copy | | | | | |
| 5.1.3 | Carousels | | | | | |

### 5.2 Writing Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.2.1 | Blog Creator | | | | | |
| 5.2.2 | Story Writer | | | | | |
| 5.2.3 | Professional Email | | | | | |
| 5.2.4 | Love Letter | | | | | |
| 5.2.5 | Landing Page Copy | | | | | |

### 5.3 Business Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.3.1 | Business Plan | | | | | |
| 5.3.2 | Pitch Deck | | | | | |
| 5.3.3 | SWOT Analysis | | | | | |
| 5.3.4 | Marketing Strategy | | | | | |
| 5.3.5 | Email Campaigns | | | | | |

### 5.4 Education Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.4.1 | Lesson Planner | | | | | |
| 5.4.2 | Quiz Maker | | | | | |
| 5.4.3 | Worksheet Maker | | | | | |
| 5.4.4 | Flashcards | | | | | |
| 5.4.5 | Study Notes | | | | | |
| 5.4.6 | Essay Helper | | | | | |
| 5.4.7 | Exam Prep | | | | | |
| 5.4.8 | Citation Generator | | | | | |

### 5.5 PDF/Document Tools
| # | Tool | Page Loads | Form Works | Generates | PDF Download | Notes |
|---|------|------------|------------|-----------|--------------|-------|
| 5.5.1 | Ebook Maker | | | | | |
| 5.5.2 | Planner Maker | | | | | |
| 5.5.3 | Journal Maker | | | | | |
| 5.5.4 | Checklist Maker | | | | | |
| 5.5.5 | Coloring Book | | | | | |
| 5.5.6 | Activity Book | | | | | |
| 5.5.7 | Storybook Maker | | | | | |
| 5.5.8 | Notion Templates | | | | | |
| 5.5.9 | Slides Maker | | | | | |

### 5.6 Career Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.6.1 | Resume Builder | | | | | |
| 5.6.2 | Cover Letter | | | | | |
| 5.6.3 | Interview Prep | | | | | |
| 5.6.4 | Job Matcher | | | | | |
| 5.6.5 | Salary Negotiator | | | | | |
| 5.6.6 | Networking Message | | | | | |

### 5.7 Image Tools
| # | Tool | Page Loads | Form Works | Generates | Image Quality | Notes |
|---|------|------------|------------|-----------|---------------|-------|
| 5.7.1 | Image Editor | | | | | |
| 5.7.2 | Cover Image Creator | | | | | |
| 5.7.3 | Thumbnail Maker | | | | | |
| 5.7.4 | Photo Cards | | | | | |
| 5.7.5 | Avatar Creator | | | | | |
| 5.7.6 | Meme Generator | | | | | |

### 5.8 Video Tools
| # | Tool | Page Loads | Upload Works | Processes | Export Works | Notes |
|---|------|------------|--------------|-----------|--------------|-------|
| 5.8.1 | AI Video Studio | | | | | |
| 5.8.2 | Video Editor | | | | | |
| 5.8.3 | Auto Subtitles | | | | | |
| 5.8.4 | Story Reels | | | | | |

### 5.9 Audio Tools
| # | Tool | Page Loads | Upload Works | Processes | Export Works | Notes |
|---|------|------------|--------------|-----------|--------------|-------|
| 5.9.1 | Audio Editor | | | | | |
| 5.9.2 | Noise Remover | | | | | |
| 5.9.3 | Voice Enhancer | | | | | |

### 5.10 Fun Tools
| # | Tool | Page Loads | Form Works | Generates | Output Quality | Notes |
|---|------|------------|------------|-----------|----------------|-------|
| 5.10.1 | Joke Generator | | | | | |
| 5.10.2 | Fortune Teller | | | | | |
| 5.10.3 | Quote Generator | | | | | |

---

## Phase 6: Library & Content Management

### 6.1 Auto-Save Functionality
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 6.1.1 | Generate content | Auto-saves to library | | |
| 6.1.2 | Check library immediately | Content appears | | |
| 6.1.3 | Check for duplicates | No duplicate entries | | |

### 6.2 Library Page
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 6.2.1 | Navigate to `/dashboard/library` | Page loads | | |
| 6.2.2 | Saved items displayed | Grid/list of content | | |
| 6.2.3 | Filter by content type | Filters work correctly | | |
| 6.2.4 | Search functionality | Search returns results | | |
| 6.2.5 | Sort by date | Newest/oldest sorting works | | |

### 6.3 Content Actions
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 6.3.1 | View saved content | Content displays correctly | | |
| 6.3.2 | Copy to clipboard | Content copied | | |
| 6.3.3 | Download/Export single item | Downloads correctly | | |
| 6.3.4 | Download thread (all posts) | All posts included | | |
| 6.3.5 | Delete content | Item removed from library | | |
| 6.3.6 | Undo delete (if available) | Item restored | | |

---

## Phase 7: User Profile

### 7.1 Profile Page
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 7.1.1 | Navigate to `/dashboard/profile` | Page loads | | |
| 7.1.2 | User info displayed | Name, email shown | | |
| 7.1.3 | Avatar displayed | Profile picture shown | | |
| 7.1.4 | Edit name | Name updated | | |
| 7.1.5 | Upload new avatar | Avatar updated | | |
| 7.1.6 | Change password | Password updated | | |
| 7.1.7 | Account stats visible | Usage statistics shown | | |

---

## Phase 8: Admin Panel (Admin Users Only)

### 8.1 Admin Access
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.1.1 | Access `/dashboard/admin` as admin | Admin panel loads | | |
| 8.1.2 | Access as non-admin | Access denied / redirected | | |

### 8.2 User Management
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.2.1 | View all users | User list displayed | | |
| 8.2.2 | Search users | Search works | | |
| 8.2.3 | Edit user details | Changes saved | | |
| 8.2.4 | Change user role | Role updated | | |
| 8.2.5 | Add/remove credits | Credits modified | | |
| 8.2.6 | Disable/enable user | Account status changed | | |

### 8.3 Menu Management
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.3.1 | View menu items | All menus listed | | |
| 8.3.2 | Add new menu item | Item added | | |
| 8.3.3 | Edit menu item | Changes saved | | |
| 8.3.4 | Reorder menu items | Order updated | | |
| 8.3.5 | Delete menu item | Item removed | | |

### 8.4 Site Settings
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.4.1 | Access site settings | Settings page loads | | |
| 8.4.2 | Update site name | Name changed | | |
| 8.4.3 | Update logo | Logo updated | | |
| 8.4.4 | Toggle features | Features enabled/disabled | | |

### 8.5 Prompt Management
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 8.5.1 | View system prompts | Prompts listed | | |
| 8.5.2 | Edit prompts | Changes saved | | |
| 8.5.3 | Test prompt changes | Generation uses new prompt | | |

---

## Phase 9: Public Pages

### 9.1 Marketing Pages
| # | Page | Loads | Content Correct | Links Work | Notes |
|---|------|-------|-----------------|------------|-------|
| 9.1.1 | Home `/` | | | | |
| 9.1.2 | About `/about` | | | | |
| 9.1.3 | Pricing `/pricing` | | | | |
| 9.1.4 | Contact `/contact` | | | | |
| 9.1.5 | Blog `/blog` | | | | |
| 9.1.6 | FAQ `/faq` | | | | |
| 9.1.7 | Careers `/careers` | | | | |
| 9.1.8 | Roadmap `/roadmap` | | | | |

### 9.2 Legal Pages
| # | Page | Loads | Content Present | Notes |
|---|------|-------|-----------------|-------|
| 9.2.1 | Privacy Policy `/privacy` | | | |
| 9.2.2 | Terms of Service `/terms` | | | |
| 9.2.3 | Cookie Policy `/cookies` | | | |
| 9.2.4 | Security `/security` | | | |

### 9.3 Footer & Header
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 9.3.1 | Header navigation links | All links work | | |
| 9.3.2 | Footer links | All links work | | |
| 9.3.3 | Social media links | Open correct profiles | | |
| 9.3.4 | Logo click | Returns to home | | |

---

## Phase 10: Security Testing

### 10.1 Authentication Security
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 10.1.1 | Access protected route without login | Redirected to login | | |
| 10.1.2 | API call without auth token | 401 Unauthorized | | |
| 10.1.3 | Try accessing other user's data | Access denied | | |
| 10.1.4 | Session expires after inactivity | Must re-login | | |
| 10.1.5 | Logout invalidates session | Session cleared | | |

### 10.2 Input Validation
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 10.2.1 | SQL injection in login | Input sanitized | | |
| 10.2.2 | XSS in text fields | Scripts escaped | | |
| 10.2.3 | Large file upload | Size limit enforced | | |
| 10.2.4 | Invalid file type upload | Type validation works | | |

### 10.3 Rate Limiting
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 10.3.1 | Rapid login attempts | Rate limited after X tries | | |
| 10.3.2 | Rapid API calls | Rate limited | | |
| 10.3.3 | After rate limit | Cooldown message shown | | |

---

## Phase 11: Performance & UX

### 11.1 Loading States
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 11.1.1 | Page load shows loader | Loading indicator visible | | |
| 11.1.2 | Generation shows progress | Progress bar/spinner | | |
| 11.1.3 | Long operations have feedback | User knows it's processing | | |

### 11.2 Error Handling
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 11.2.1 | Network error | Friendly error message | | |
| 11.2.2 | API error | Error displayed to user | | |
| 11.2.3 | Invalid route | 404 page shown | | |
| 11.2.4 | Server error | 500 error handled gracefully | | |

### 11.3 Responsive Design
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 11.3.1 | Desktop (1920px) | Layout correct | | |
| 11.3.2 | Laptop (1366px) | Layout adapts | | |
| 11.3.3 | Tablet (768px) | Responsive layout | | |
| 11.3.4 | Mobile (375px) | Mobile-friendly | | |
| 11.3.5 | Sidebar on mobile | Hamburger menu works | | |

---

## Phase 12: Edge Cases

### 12.1 Empty States
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 12.1.1 | Empty library | "No items" message | | |
| 12.1.2 | Empty search results | "No results" message | | |
| 12.1.3 | No credit history | Appropriate message | | |

### 12.2 Boundary Conditions
| # | Test Case | Expected Result | Status | Notes |
|---|-----------|-----------------|--------|-------|
| 12.2.1 | Very long text input | Handled/truncated | | |
| 12.2.2 | Special characters | Processed correctly | | |
| 12.2.3 | Unicode/Emoji input | Displayed correctly | | |
| 12.2.4 | Exactly 0 credits | Clear messaging | | |

---

## 🐛 Bug Report Template

When you find a bug, document it here:

### Bug #___

| Field | Details |
|-------|---------|
| **Title** | |
| **Test Case #** | |
| **Severity** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Page/Feature** | |
| **Steps to Reproduce** | 1. <br>2. <br>3. |
| **Expected Result** | |
| **Actual Result** | |
| **Screenshots** | |
| **Browser/Device** | |
| **Console Errors** | |

---

## 📊 Test Summary

| Phase | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Warning | ⏭️ Skipped |
|-------|-------------|-----------|-----------|------------|------------|
| 1. Authentication | | | | | |
| 2. Credits | | | | | |
| 3. Subscription | | | | | |
| 4. Dashboard | | | | | |
| 5. Tools | | | | | |
| 6. Library | | | | | |
| 7. Profile | | | | | |
| 8. Admin | | | | | |
| 9. Public Pages | | | | | |
| 10. Security | | | | | |
| 11. Performance | | | | | |
| 12. Edge Cases | | | | | |
| **TOTAL** | | | | | |

---

## 📝 Additional Notes

_Use this space for any additional observations, suggestions, or findings:_

---

## ✅ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Reviewer | | | |

---

**Document Version:** 1.0  
**Last Updated:** June 2025  
**Created By:** ProCreators Development Team
