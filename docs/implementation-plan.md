# CupidMatch Implementation Plan

**Created:** September 15, 2026  
**Status:** Phase 1 In Progress

## Architecture Overview

### Current Technology Stack

**Framework:** Next.js 15.3.3 with Turbopack  
**Language:** TypeScript 5  
**Styling:** Tailwind CSS 3.4.1  
**UI Components:** Radix UI primitives  
**Database:** Firebase Firestore  
**Authentication:** Firebase Auth  
**Storage:** Firebase Storage  
**AI Integration:** Genkit 1.8.0 with Google AI  
**Forms:** React Hook Form 7.54.2 with Zod validation

### Existing Infrastructure

**Strengths:**
- ✅ Firebase authentication working with placeholder credentials for development
- ✅ Firestore security rules defined for users, chats, match requests, posts
- ✅ UI component library (Radix + shadcn/ui)
- ✅ Basic routing structure established
- ✅ AI flows for profile enhancement (bio, hobbies, music, movies)
- ✅ Horoscope compatibility features
- ✅ Design tokens in globals.css
- ✅ Admin panel structure
- ✅ Messaging infrastructure
- ✅ Success stories collection

**Limitations:**
- ⚠️ Homepage needs complete redesign to match brand vision
- ⚠️ No resumable onboarding flow
- ⚠️ Privacy controls need enhancement
- ⚠️ Matching algorithm needs explainability layer
- ⚠️ Family Circle feature doesn't exist
- ⚠️ No Future Map for international planning
- ⚠️ Cultural preferences not structured properly
- ⚠️ Verification system not implemented
- ⚠️ No internationalization (i18n) system
- ⚠️ AI features need safety boundaries

## Implementation Phases

---

## PHASE 1: Design Foundation & Homepage
**Status:** 🔄 In Progress  
**Goal:** Establish design system and rebuild homepage to match brand vision

### 1.1 Design System Setup
- [ ] Create design token constants (`src/lib/design/tokens.ts`)
- [ ] Define spacing scale
- [ ] Define typography scale  
- [ ] Define color palette (warm ivory, violet, coral)
- [ ] Create component variants
- [ ] Document usage guidelines

### 1.2 Decorative Components
- [ ] `ConnectionPaths` SVG component (aria-hidden)
- [ ] `PairedOrbit` SVG component
- [ ] `CulturalLinePattern` SVG component
- [ ] Ensure lightweight and non-interactive
- [ ] Responsive sizing
- [ ] Respect prefers-reduced-motion

### 1.3 Navigation Redesign
**File:** `src/components/navigation/Navbar.tsx`

**Requirements:**
- [ ] CupidMatch logo (preserve existing)
- [ ] Navigation links: Discover, How it works, Safety, Success stories, Pricing
- [ ] Language selector (English, Sinhala, Tamil)
- [ ] Log in button
- [ ] Create profile CTA
- [ ] Accessible mobile menu
- [ ] Match new color scheme
- [ ] Responsive breakpoints

### 1.4 Footer Redesign
**File:** `src/components/navigation/Footer.tsx`

**Links:**
- [ ] About
- [ ] Contact
- [ ] Safety
- [ ] Privacy
- [ ] Terms
- [ ] Community guidelines
- [ ] Accessibility
- [ ] Language options
- [ ] Social media (if applicable)

### 1.5 Homepage Rebuild
**File:** `src/app/page.tsx` and `src/components/landing/`

**Sections to Implement:**

1. **Hero Section**
   - [ ] Headline: "Meet someone who understands where you come from — and where you're going."
   - [ ] Description copy
   - [ ] CTAs: "Build my profile" + "See how matching works"
   - [ ] Cultural photography (properly sourced)
   - [ ] Sample profile card (clearly labeled as demo)
   - [ ] Privacy preview
   - [ ] ConnectionPaths decoration

2. **Trust and Language Strip**
   - [ ] Privacy controls indicator
   - [ ] Verification explanation
   - [ ] Language support badges (Sinhala, Tamil, English)
   - [ ] Only claim implemented features

3. **Relationship Intelligence Section**
   - [ ] Heading: "More than a match score"
   - [ ] Explanation cards:
     - Shared values
     - Life goals
     - Communication preferences
     - Family expectations
     - Lifestyle compatibility
     - Cultural preferences
   - [ ] Focus on explanations, not percentages

4. **International Relationships Section**
   - [ ] Heading: "Built for life between countries"
   - [ ] Visual elements:
     - Current home indicator
     - Future home preferences
     - Relocation openness
     - Long-distance preferences
     - Family responsibilities
   - [ ] Connection path illustrations
   - [ ] Accessible simplified representation

5. **Feature Grid**
   - [ ] AI Profile Studio card
   - [ ] Future Map card
   - [ ] Culture Preferences card
   - [ ] Family Circle card
   - [ ] Verification card
   - [ ] Guided Conversations card
   - [ ] Clearly mark unavailable features

6. **Discovery Preview**
   - [ ] Sample profile cards (3-4)
   - [ ] Clearly labeled as demos
   - [ ] No real member data
   - [ ] Authentic-looking permitted assets

7. **How It Works**
   - [ ] Step 1: Tell us what matters
   - [ ] Step 2: Understand each introduction
   - [ ] Step 3: Connect at your own pace
   - [ ] Visual flow indicators

8. **Conversation Preview**
   - [ ] Suggested meaningful questions
   - [ ] Messaging interface preview
   - [ ] Privacy explanation
   - [ ] Only show implemented features

9. **Safety Centre Preview**
   - [ ] Explain available controls
   - [ ] Report/block mechanisms
   - [ ] Privacy settings
   - [ ] Verification (when available)

10. **Family Circle Preview**
    - [ ] Member-controlled invitations
    - [ ] Permission levels
    - [ ] Clearly explain as future feature if not ready

11. **Success Stories Section**
    - [ ] Pull from Firestore `successStories` collection
    - [ ] Show consented published stories only
    - [ ] If none exist: tasteful invitation to submit
    - [ ] Never show fake testimonials

12. **Pricing Section**
    - [ ] Read from existing subscription source
    - [ ] Honest feature availability
    - [ ] Clear billing terms
    - [ ] Link to `/pricing` page

13. **FAQ Section**
    - [ ] Accessible accordion
    - [ ] Questions:
      - Who is CupidMatch for?
      - International matches support
      - How verification works
      - Family involvement options
      - Privacy controls
      - AI recommendations
      - Cancellation policy

14. **Final CTA**
    - [ ] Headline: "Connect with clarity and confidence"
    - [ ] Primary action: Build my profile
    - [ ] Design polish

### 1.6 Preserve Existing Functionality
- [ ] Authentication flows unchanged
- [ ] Existing routes continue working
- [ ] User data preserved
- [ ] Dashboard access maintained

### 1.7 Quality Checks
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] Mobile responsive (360px, 390px, 768px)
- [ ] Desktop responsive (1024px, 1440px)
- [ ] Keyboard navigation works
- [ ] Color contrast validated
- [ ] Reduced motion respected

---

## PHASE 2: Launch-Ready Core
**Status:** 📋 Planned  
**Start After:** Phase 1 Complete

### 2.1 Onboarding Flow
- [ ] Multi-step resumable wizard
- [ ] Profile data collection
- [ ] Location and languages
- [ ] Relationship intentions
- [ ] Values and lifestyle
- [ ] Family preferences
- [ ] Future plans
- [ ] Photo upload
- [ ] Privacy settings
- [ ] Review before publish
- [ ] Progress saving

### 2.2 Profile Management
- [ ] Complete profile editing
- [ ] Photo management with Firebase Storage
- [ ] Privacy visibility controls
- [ ] Profile completion indicator
- [ ] Data validation
- [ ] Update timestamps

### 2.3 Discovery & Matching
- [ ] Basic matching algorithm
- [ ] Filter system
- [ ] Search functionality
- [ ] Match cards with proper data
- [ ] Interest sending
- [ ] Accept/decline flows
- [ ] Block and hide
- [ ] Empty states

### 2.4 Messaging
- [ ] Real-time chat with Firestore
- [ ] Message delivery states
- [ ] Read receipts (optional)
- [ ] Conversation list
- [ ] Notification previews
- [ ] Rate limiting

### 2.5 Safety & Moderation
- [ ] Report system
- [ ] Block functionality
- [ ] Admin review queue
- [ ] Moderation actions
- [ ] Audit logs

### 2.6 Subscriptions
- [ ] Integrate with existing payment system
- [ ] Entitlement checks
- [ ] Subscription status
- [ ] Billing portal
- [ ] Plan management

---

## PHASE 3: Distinctive Capabilities
**Status:** 📋 Planned  
**Start After:** Phase 2 Complete

### 3.1 AI Profile Studio
- [ ] Biography enhancement
- [ ] Tone adjustment
- [ ] Translation assistance
- [ ] Profile completeness suggestions
- [ ] User approval required
- [ ] Original text preservation
- [ ] Rate limiting and cost controls

### 3.2 Compatibility Interview
- [ ] Guided questionnaire
- [ ] Free-text to structured answers (AI-assisted)
- [ ] Member confirmation required
- [ ] Matching weight configuration

### 3.3 Explainable Matching
- [ ] Deterministic baseline algorithm
- [ ] Hard requirement enforcement
- [ ] Soft preference ranking
- [ ] Evidence-based explanations
- [ ] Member feedback loop
- [ ] No unexplained percentages

### 3.4 Future Map
- [ ] Current/future location visualization
- [ ] Relocation preferences
- [ ] Long-distance tolerance
- [ ] Career flexibility indicators
- [ ] Family responsibility considerations
- [ ] Visibility controls

### 3.5 Cultural Preferences
- [ ] Structured preference questions
- [ ] Language preferences
- [ ] Festival importance
- [ ] Food preferences
- [ ] Faith practices
- [ ] Family involvement levels
- [ ] Wedding preferences
- [ ] Granular importance levels

### 3.6 Family Circle
- [ ] Invitation system
- [ ] Role definitions (parent, sibling, friend, advisor)
- [ ] Granular permissions
- [ ] Activity logs
- [ ] Revocation mechanisms
- [ ] Clear member vs. helper distinction
- [ ] Privacy boundaries enforcement

---

## PHASE 4: Advanced Integrations
**Status:** 📋 Future  
**Start After:** Phase 3 Complete & User Validation

### 4.1 Identity Verification
- [ ] Choose verification provider
- [ ] Identity document check
- [ ] Liveness detection
- [ ] Verification badge system
- [ ] Precise status indicators
- [ ] Webhook handling
- [ ] Secure document storage

### 4.2 Voice/Video Calling
- [ ] Choose provider (Twilio, Agora, Daily.co)
- [ ] Secure room generation
- [ ] Short-lived access tokens
- [ ] In-app calling interface
- [ ] Honest availability states

### 4.3 Translation Assistance
- [ ] Real-time message translation
- [ ] Original text preservation
- [ ] Translation labeling
- [ ] Sinhala/Tamil/English support
- [ ] Profile translation

### 4.4 Travel Corridor
- [ ] Opt-in travel intentions
- [ ] Coarse location disclosure
- [ ] Approximate timing
- [ ] Introduction preferences
- [ ] Authorized audience only
- [ ] Never publish exact itineraries

### 4.5 Advanced AI Moderation
- [ ] Content flags
- [ ] Spam detection
- [ ] Harassment identification
- [ ] Pattern analysis
- [ ] Human review integration

---

## Development Principles

### Code Quality
1. TypeScript strict mode
2. ESLint + Prettier configured
3. Component-driven architecture
4. Server-side validation always
5. Client-side validation for UX
6. Error boundaries
7. Loading states
8. Empty states
9. Meaningful tests for critical paths

### Security
1. Server-side authorization on every operation
2. No secrets in client code
3. Firestore security rules enforced
4. Input validation and sanitization
5. Rate limiting
6. CSRF protection
7. Secure session management

### Performance
1. Image optimization with Next.js Image
2. Lazy loading below fold
3. Code splitting
4. Database query optimization
5. Indexing strategy
6. Caching (safe data only)
7. AI latency monitoring

### Accessibility
1. Semantic HTML
2. Keyboard navigation
3. ARIA labels where needed
4. Focus indicators
5. Color contrast
6. Touch targets 44px minimum
7. Reduced motion support

### Documentation
1. Update implementation status after each change
2. Document external service requirements
3. Note configuration needed
4. Explain design decisions
5. Keep README accurate

---

## Risk Management

### Technical Risks
- **Firebase placeholder credentials:** Need real Firebase project before production
- **AI costs:** Monitor Genkit usage and implement budgets
- **Image storage:** Need proper Firebase Storage rules and quota monitoring
- **Scalability:** Firestore query limits with large user bases

### Product Risks
- **Cultural sensitivity:** Need native speaker review for Sinhala/Tamil content
- **Legal compliance:** GDPR, CCPA, age verification requirements
- **Moderation capacity:** Need human moderator availability for reports
- **Verification provider:** Need to select and integrate identity verification service

### Mitigation Strategies
1. Implement feature flags for incomplete capabilities
2. Build admin tools early for operational needs
3. Keep unverified features clearly labeled
4. Start with limited beta audience
5. Establish moderation protocols before public launch

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Homepage matches brand vision
- ✅ Navigation/footer redesigned
- ✅ Design system documented
- ✅ All links work correctly
- ✅ Mobile + desktop responsive
- ✅ Lint, typecheck, build pass
- ✅ No console errors
- ✅ Accessibility basics covered

### Phase 2 Complete When:
- Full onboarding flow works end-to-end
- Profiles can be created and edited
- Discovery shows real filtered results
- Messaging delivers and displays correctly
- Report/block functions
- Admin can moderate
- Subscriptions integrate

### Phase 3 Complete When:
- AI Profile Studio enhances bios safely
- Matching provides clear explanations
- Future Map visualizes plans
- Cultural Preferences are granular
- Family Circle has working permissions

### Phase 4 Complete When:
- Verification provider integrated
- Video calling works (if included)
- Translation assists real conversations
- All features tested in production-like environment

---

## Next Steps

**Immediate Actions (Phase 1):**
1. Create design tokens file
2. Build decorative SVG components
3. Redesign Navbar component
4. Redesign Footer component
5. Rebuild homepage sections one by one
6. Test responsiveness thoroughly
7. Validate accessibility
8. Run all checks

**After Phase 1:**
- User testing on homepage
- Gather feedback on messaging
- Adjust design based on learnings
- Begin Phase 2 onboarding flow
