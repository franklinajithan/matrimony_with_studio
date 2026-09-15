# CupidMatch Product Specification

**Last Updated:** September 15, 2026  
**Version:** 1.0  
**Status:** Active Development

## Product Vision

CupidMatch helps Sri Lankan adults find a marriage partner through shared values, cultural understanding, family expectations and practical future plans.

### Brand Promise
"Meet someone who understands where you come from — and where you're going."

### Supporting Copy
"Modern relationship intelligence, shaped for Sri Lankan lives around the world."

## Target Audiences

1. **Primary International Communities**
   - Sri Lankans living in the UK, Canada and Australia
   - Sri Lankan communities in Europe, the US and other countries
   - People in Sri Lanka open to international relationships

2. **Family Support Model**
   - Members who want optional, consent-based family assistance
   - Explicit permissions and boundaries

3. **Diverse Relationship Stages**
   - Never-married adults
   - Divorced adults
   - Widowed adults
   - All aged 18+ only

## Language Support

- Sinhala
- Tamil  
- English

## Core Principles

1. **Member Control**: Members retain control over their profiles, conversations and decisions
2. **Optional Cultural Elements**: Culture and religion must be optional, self-described preferences
3. **Transparency**: Clear labelling of demo content vs. real member activity
4. **Privacy-First**: Strong privacy defaults and granular controls
5. **Honest Capabilities**: Never claim features that don't exist or verification that wasn't performed
6. **Explainable Matching**: Evidence-based compatibility with clear explanations
7. **Consent-Based Family Involvement**: Granular permissions for family helpers

## Design Direction

### Color Palette
- Background: `#FBF8F4` (warm ivory)
- Surface: `#FFFFFF`
- Text: `#17151D` (near-black)
- Muted text: `#6F6979`
- Primary: `#7027E8` (violet)
- Primary soft: `#EEE7FF`
- Coral: `#FF6F72`
- Border: `#EAE4EF`

### Design Principles
- Modern, warm and professional aesthetic
- Generous spacing and clean typography
- Subtle cultural photography
- Flowing vector connection paths
- Consistent spacing tokens
- Rounded cards (20–24px radius)
- Restrained shadows
- Clear keyboard focus
- Accessible controls
- Responsive typography
- Purposeful, subtle motion
- Reduced-motion support

### Cultural Representation
- Natural Sri Lankan photography
- Contemporary sarees and modern clothing
- Subtle textile or botanical vector details
- Diverse and dignified representation
- **Avoid**: Heavy gold decoration, dark ceremonial styling, fake statistics

## Feature Roadmap

### Phase 1: Design Foundation (Current)
- ✅ Design system and tokens
- 🔄 Navigation and footer redesign
- 🔄 Homepage rebuild with proper branding
- Preserve existing authentication

### Phase 2: Launch-Ready Core
- Resumable onboarding flow
- Complete profile management
- Privacy enforcement
- Discovery and matching
- Interest system
- Messaging platform
- Report and block functionality
- Admin moderation tools
- Subscription management

### Phase 3: Distinctive Capabilities
- AI Profile Studio
- Compatibility Interview
- Explainable matching algorithm
- Future Map (international planning)
- Cultural Preferences system
- Family Circle (with granular permissions)

### Phase 4: Advanced Integrations
- Identity/liveness verification
- Voice/video calling
- Translation assistance
- Travel Corridor
- Advanced AI moderation
- Community events (if approved)

## Data Privacy and Security

### Protected Information Categories
1. **Public Profile**: Display name, age (derived), broad location, approved photos, biography
2. **Matching-Only**: Detailed preferences, lifestyle, future plans
3. **Private Account**: Email, phone, date of birth, verification records
4. **Family Permissions**: Granular access logs, permission levels

### Security Requirements
- Server-side authorization on all operations
- Private photos require authorized delivery
- No permanent public URLs for private media
- Revocation must stop future access
- No inference of protected characteristics from photos
- No public exposure of real member data without explicit consent

## Prohibited Features

1. **No Ranking or Scoring Based On:**
   - Skin color
   - Caste
   - Beauty ratings
   - Attractiveness scores

2. **No Fake Content:**
   - No invented testimonials
   - No fictional couples
   - No fake verification badges
   - No simulated member activity
   - No unexplained compatibility percentages

3. **No Unrealistic Promises:**
   - No guaranteed matches
   - No scientifically validated predictions
   - No immigration eligibility decisions
   - No promise of visa approval

## Accessibility Requirements

- Target: WCAG 2.2 AA compliance
- Keyboard navigation throughout
- Visible focus indicators
- Proper semantic HTML
- Accessible labels and errors
- Touch-friendly controls (44px minimum)
- Reduced motion support
- Color contrast validation
- No horizontal overflow
- Screen reader compatibility

## Responsive Breakpoints

Test at minimum:
- 360px (small mobile)
- 390px (standard mobile)
- 768px (tablet)
- 1024px (small desktop)
- 1440px (standard desktop)

## Internationalization

- Language selector in navigation
- Persistent language preference
- Proper font coverage for Sinhala/Tamil scripts
- Locale-aware dates, times, currencies
- Time-zone-aware scheduling
- Native-speaker validation for critical copy
- Fallback language mechanism

## Legal and Compliance

- Adults 18+ only (verified at signup)
- Clear terms of service
- Privacy policy
- Community guidelines
- Data export capability
- Account deletion
- Data retention controls
- Consent mechanisms for family access
- GDPR/CCPA considerations for international users

## Success Metrics (Future)

Will be defined when analytics are implemented:
- Profile completion rate
- Match acceptance rate
- Conversation initiation rate
- Subscription conversion
- Member retention
- Safety report resolution time
- Family Circle adoption

## Technology Constraints

- Must use existing Firebase infrastructure
- Must preserve existing authentication
- Must not break existing user data
- Must not expose secrets in client bundles
- Must not invent external service credentials
- No deployment or production charges during development
- Incremental, reviewable changes only
