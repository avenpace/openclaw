---
name: website-builder
description: Create static websites (HTML/CSS/JS) for users. Build landing pages, company profiles, portfolios, and simple web apps.
metadata: { "clawdbot": { "emoji": "🌐" } }
---

# Website Builder

## 🚨🚨🚨 STOP! READ THIS FIRST! 🚨🚨🚨

### THE #1 RULE: ACTION, NOT WORDS

**YOUR WORDS DO NOT CREATE FILES. ONLY TOOL CALLS CREATE FILES.**

If you respond with text like:

- "I'll do it right now" ← THIS CREATES NOTHING
- "Let me handle this" ← THIS CREATES NOTHING
- "I'll execute immediately" ← THIS CREATES NOTHING
- "This time I won't waste words" ← THIS CREATES NOTHING (ironic, right?)
- "I'll implement that now" ← THIS CREATES NOTHING
- "Let me create the files" ← THIS CREATES NOTHING

**THESE ARE JUST WORDS. THE USER WILL GET NOTHING.**

### WHEN USER ASKS TO MODIFY/UPGRADE AN EXISTING APP:

This is the MOST COMMON failure mode. User says:

- "Switch to PHP" / "Add backend" / "Make it server-side"
- "Change to database" / "Save data on server"
- "Replace localStorage with real database"

**YOUR RESPONSE MUST BE:**

1. **FIRST**: Call `write` tool for api.php (IMMEDIATELY, NO TEXT FIRST)
2. **SECOND**: Call `write` tool for updated app.js with fetch() calls
3. **THIRD**: Call `write` tool for updated index.html if needed
4. **FOURTH**: ONLY AFTER seeing "Successfully wrote X bytes" → tell user the URL

**YOUR RESPONSE MUST NOT BE:**

- ❌ "Ok I'll work on it now, wait" → (then no tool call)
- ❌ "Sure, let me upgrade it" → (then no tool call)
- ❌ "Got it, I'll convert to PHP" → (then no tool call)
- ❌ Any text promising action WITHOUT a tool call in the same response

### SELF-CHECK BEFORE SENDING ANY RESPONSE:

Ask yourself these questions:

1. Did user ask me to create/modify/upgrade something? → YES
2. Did I CALL the write tool in this response? → If NO, GO BACK AND CALL IT
3. Did I just write text promising to do something? → If YES, DELETE IT AND CALL THE TOOL INSTEAD

**IF YOU SAY "I'LL DO IT" WITHOUT CALLING A TOOL, YOU HAVE FAILED THE USER.**

---

## ⚠️ CRITICAL TOOL-CALLING INSTRUCTIONS ⚠️

**YOU MUST CALL THE `write` TOOL TO CREATE FILES. TEXT RESPONSES DO NOT CREATE FILES.**

### FORBIDDEN BEHAVIORS (WILL FAIL THE USER):

❌ Saying "I'll create the files now" → then NOT calling write tool
❌ Saying "Give me a moment" → then NOT calling write tool
❌ Saying "Let me work on that" → then NOT calling write tool
❌ Saying "Sure" / "Ok" / "Ready" → then NOT calling write tool
❌ Saying "Wait a moment" → then NOT calling write tool
❌ Giving a URL without having called write tool first → URL WILL BE BROKEN
❌ Outputting code blocks showing file contents → this does NOT create files
❌ Describing what you will write → this does NOT create files
❌ Asking "should I proceed?" when user already confirmed → JUST DO IT

### REQUIRED BEHAVIOR (ALWAYS DO THIS):

✅ When user says "ok", "yes", "proceed", "do it", "go ahead", "hurry" → IMMEDIATELY call write tool
✅ When user asks to create/build/make → IMMEDIATELY call write tool
✅ When user asks to add/adjust/convert to backend/PHP/database → IMMEDIATELY call write tool for api.php
✅ After calling write tool → you will see "Successfully wrote X bytes" confirmation
✅ Only AFTER tool confirmation → tell user the preview URL

### PHP BACKEND CREATION (WHEN USER ASKS FOR PERSISTENCE):

When user asks for:

- "real database" / "persistent storage" / "server-side"
- "not localStorage" / "survives browser clear"
- "PHP" / "SQLite" / "backend" / "API"
- "switch to backend" / "change to database" / "save on server"

YOU MUST create these files by calling write tool:

1. `write path="websites/{project}/api.php"` → PHP backend with SQLite
2. `write path="websites/{project}/app.js"` → Frontend with API calls (not localStorage)
3. `write path="websites/{project}/index.html"` → Updated HTML
4. `write path="websites/{project}/SELF-HOSTING.md"` → Deployment instructions

**DO NOT** just say "I'll upgrade to PHP now" - CALL THE WRITE TOOL IMMEDIATELY.

---

## Design Requirements (MANDATORY)

**ALL websites and web applications you create MUST:**

1. **Mobile-First Design**: Design for mobile screens first, then enhance for larger screens
   - Use responsive breakpoints: 480px, 768px, 1024px
   - Touch-friendly buttons (min 44px tap targets)
   - Readable font sizes on mobile (min 16px body text)
   - No horizontal scrolling on mobile

2. **Professional Aesthetic**: Follow the design guidelines in this document
   - Use appropriate color scheme based on business type
   - Modern typography with good hierarchy
   - Generous whitespace and spacing
   - Smooth transitions and hover effects
   - Consistent border-radius and shadows

3. **Good Styling**: Never create plain/unstyled websites
   - Always include comprehensive CSS
   - Use CSS variables for colors and spacing
   - Apply the templates provided in "Design Philosophy" section
   - Make it visually appealing, not generic or dull

**DO NOT create ugly, unstyled, or desktop-only websites. Every website must look professional on mobile devices.**

## How to Build (ALWAYS do this)

### Static Website (HTML/CSS/JS only):

1. **CALL** write tool: `path="websites/{project}/index.html"` → HTML content
2. **CALL** write tool: `path="websites/{project}/style.css"` → CSS content
3. **CALL** write tool: `path="websites/{project}/script.js"` → JS if needed
4. **WAIT** for "Successfully wrote X bytes" confirmations
5. **THEN** share preview URL: `{{API_BASE_URL}}/websites/preview/{{PERSONA_ID}}/{project}/`

### Backend Website (PHP + SQLite):

1. **CALL** write tool: `path="websites/{project}/api.php"` → PHP API (see template below)
2. **CALL** write tool: `path="websites/{project}/index.html"` → HTML
3. **CALL** write tool: `path="websites/{project}/style.css"` → CSS
4. **CALL** write tool: `path="websites/{project}/app.js"` → Frontend with fetch() calls to API
5. **CALL** write tool: `path="websites/{project}/SELF-HOSTING.md"` → Deployment docs
6. **WAIT** for ALL "Successfully wrote X bytes" confirmations
7. **THEN** share preview URL

### VALIDATION CHECKLIST (Before responding to user):

- [ ] Did you CALL the write tool? (not just talk about it)
- [ ] Did you see "Successfully wrote X bytes" in tool result?
- [ ] If user asked for PHP/backend, did you create api.php?
- [ ] If NO to any above → GO BACK AND CALL THE TOOL NOW

**WRONG behaviors (DO NOT DO THESE):**

- ❌ Outputting `<tool_code>write(...)</tool_code>` as text - this does NOT create files
- ❌ Writing code blocks showing write() calls - this does NOT create files
- ❌ Saying "I'll create..." without invoking the tool - this does NOT create files
- ❌ Saying "Let me implement that" then just chatting - this does NOT create files
- ❌ Asking user to confirm AGAIN when they already said yes - JUST DO IT

**CORRECT behavior:**

- Use the function calling capability to invoke write tool
- The tool result will confirm "Successfully wrote X bytes to path"
- Only THEN tell the user the preview URL

## Workspace Structure

All website projects are stored in the `websites/` folder in your workspace:

```
websites/
├── project-name/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── pages/
│       ├── about.html
│       └── contact.html
```

## Creating a Website

### Step 1: Create HTML File

Use the `write` tool to create files (parent directories are created automatically):

```
write path="websites/project-name/index.html" content="<!DOCTYPE html>..."
```

### Step 2: Create CSS File

```
write path="websites/project-name/style.css" content="* { margin: 0; ... }"
```

### Step 3: Create JavaScript (if needed)

```
write path="websites/project-name/script.js" content="// Interactive features..."
```

## Preview URL

After creating a website, users can preview it at:

```
{{API_BASE_URL}}/websites/preview/{{PERSONA_ID}}/project-name/
```

Tell the user this URL so they can view their website.

## Images and Media

**IMPORTANT**: You cannot create images. For images:

1. Ask the user to upload images to **Cloud Storage**
2. User shares the image URL with you
3. Use that URL in the HTML: `<img src="https://...cloud-storage-url...">`

Example conversation:

```
User: Add a hero image to my website
You: Please upload your hero image to Cloud Storage (go to Storage in the sidebar),
     then share the URL with me and I'll add it to your website.
```

## HTML Templates

### Company Profile / Landing Page (Enhanced)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Company Name - Tagline</title>
    <meta name="description" content="Deskripsi singkat untuk SEO" />
    <link rel="stylesheet" href="style.css" />
    <!-- Preconnect for faster font loading if needed -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
  </head>
  <body>
    <nav>
      <div class="logo">CompanyName</div>
      <ul class="nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>

    <header class="hero">
      <div class="hero-content">
        <span class="hero-badge">🏆 Trusted by 1000+ Clients</span>
        <h1>The <span>Best Solution</span> for Your Business</h1>
        <p>
          We help your business grow with professional services and an experienced team ready to
          support your success.
        </p>
        <div class="hero-buttons">
          <a href="#contact" class="cta-button"> Get Started → </a>
          <a href="#services" class="cta-secondary">Learn More</a>
        </div>
      </div>
    </header>

    <section id="about" class="section">
      <div class="section-header">
        <h2>Why Choose Us?</h2>
        <p>Over 10 years of experience serving thousands of satisfied customers worldwide</p>
      </div>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <h3>Fast & Efficient</h3>
          <p>Streamlined processes for maximum results</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🛡️</div>
          <h3>Trusted & Reliable</h3>
          <p>Security and privacy are our top priorities</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💬</div>
          <h3>24/7 Support</h3>
          <p>Our team is always ready to help anytime</p>
        </div>
      </div>
    </section>

    <section id="services" class="section">
      <div class="section-header">
        <h2>Our Services</h2>
        <p>Complete solutions for all your business needs</p>
      </div>
      <div class="cards-grid">
        <div class="card">
          <div class="card-icon">📊</div>
          <h3>Business Consulting</h3>
          <p>In-depth analysis and growth strategies tailored to your unique business needs.</p>
        </div>
        <div class="card">
          <div class="card-icon">🎨</div>
          <h3>Design & Branding</h3>
          <p>Strong, memorable visual identity to differentiate your business from competitors.</p>
        </div>
        <div class="card">
          <div class="card-icon">🚀</div>
          <h3>Digital Marketing</h3>
          <p>Effective digital marketing strategies to reach more customers.</p>
        </div>
      </div>
    </section>

    <section id="testimonials" class="section">
      <div class="section-header">
        <h2>What Our Clients Say</h2>
        <p>Testimonials from clients who have experienced the benefits of our services</p>
      </div>
      <div class="testimonial">
        <p class="testimonial-quote">
          "Outstanding service! Professional team and satisfying results. Highly recommend for any
          business looking to grow."
        </p>
        <p class="testimonial-author">— John D., CEO TechStart</p>
      </div>
    </section>

    <section id="contact" class="section">
      <div class="section-header">
        <h2>Contact Us</h2>
        <p>Ready to get started? Our team is here to help</p>
      </div>
      <div class="contact-wrapper">
        <a href="#contact" class="cta-button">Schedule Free Consultation</a>
        <div class="contact-info">
          <div class="contact-item">
            <span>📧</span>
            <span>hello@company.com</span>
          </div>
          <div class="contact-item">
            <span>📱</span>
            <span>+1 (555) 123-4567</span>
          </div>
          <div class="contact-item">
            <span>📍</span>
            <span>123 Business Ave, Suite 100</span>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div class="footer-content">
        <div class="footer-logo">CompanyName</div>
        <div class="footer-links">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 CompanyName. All Rights Reserved.</p>
      </div>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
```

### Enhanced Base CSS Template (Use This!)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* CUSTOMIZE THESE BASED ON BUSINESS TYPE */
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --accent: #ec4899;
  --text: #1f2937;
  --text-light: #6b7280;
  --text-muted: #9ca3af;
  --bg: #ffffff;
  --bg-alt: #faf5ff;
  --bg-dark: #1e1b4b;
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  --radius: 16px;
  --radius-sm: 8px;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family:
    "Inter",
    "Segoe UI",
    system-ui,
    -apple-system,
    sans-serif;
  line-height: 1.7;
  color: var(--text);
  font-size: 1.125rem;
  -webkit-font-smoothing: antialiased;
}

/* ===== NAVIGATION ===== */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 8%;
  position: fixed;
  width: 100%;
  top: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2.5rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  font-size: 1rem;
  position: relative;
  transition: color 0.3s;
}

.nav-links a::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: width 0.3s ease;
}

.nav-links a:hover {
  color: var(--primary);
}

.nav-links a:hover::after {
  width: 100%;
}

/* ===== HERO SECTION ===== */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 50%, var(--bg) 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative background elements */
.hero::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 100%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8rem 2rem 4rem;
  max-width: 900px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 50px;
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
  color: var(--text);
}

.hero h1 span {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 2.5rem;
  max-width: 600px;
  line-height: 1.8;
}

/* ===== BUTTONS ===== */
.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 1rem;
  box-shadow:
    var(--shadow-md),
    0 0 40px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow:
    var(--shadow-lg),
    0 0 60px rgba(99, 102, 241, 0.4);
}

.cta-secondary {
  padding: 1rem 2rem;
  background: transparent;
  color: var(--text);
  text-decoration: none;
  border: 2px solid var(--text-muted);
  border-radius: var(--radius-sm);
  font-weight: 600;
  margin-left: 1rem;
  transition: all 0.3s ease;
}

.cta-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* ===== SECTIONS ===== */
.section {
  padding: 6rem 8%;
  position: relative;
}

.section:nth-child(even) {
  background: var(--bg-alt);
}

.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
}

.section-header h2 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
  color: var(--text);
}

.section-header p {
  color: var(--text-light);
  font-size: 1.125rem;
}

/* ===== CARDS GRID ===== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: var(--bg);
  padding: 2.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  opacity: 0;
  transition: opacity 0.3s;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.card:hover::before {
  opacity: 1;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
}

.card h3 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.card p {
  color: var(--text-light);
  line-height: 1.7;
}

/* ===== FEATURES WITH ICONS ===== */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature {
  text-align: center;
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

/* ===== TESTIMONIALS ===== */
.testimonial {
  background: var(--bg);
  padding: 3rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.testimonial-quote {
  font-size: 1.375rem;
  font-style: italic;
  color: var(--text);
  margin-bottom: 2rem;
  line-height: 1.8;
}

.testimonial-author {
  font-weight: 600;
  color: var(--primary);
}

/* ===== CONTACT ===== */
.contact-wrapper {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg);
  border-radius: var(--radius-sm);
  transition: all 0.3s;
}

.contact-item:hover {
  background: var(--bg-alt);
}

/* ===== FOOTER ===== */
footer {
  background: var(--bg-dark);
  color: white;
  padding: 4rem 8% 2rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

/* ===== ANIMATIONS ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease forwards;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .section {
    padding: 4rem 6%;
  }
}

@media (max-width: 768px) {
  nav {
    padding: 1rem 5%;
  }

  .nav-links {
    display: none;
  }

  .hero-content {
    padding: 6rem 1.5rem 3rem;
  }

  .hero h1 {
    font-size: 2.5rem;
  }

  .section {
    padding: 3rem 5%;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .cta-secondary {
    display: block;
    margin: 1rem 0 0;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .hero h1 {
    font-size: 2rem;
  }

  .card {
    padding: 1.5rem;
  }
}
```

## Design Philosophy - CRITICAL

**Your websites must be visually stunning, not generic or dull.** Follow these principles:

### Core Principles

1. **Bold & Confident**: Use strong visual hierarchy, not everything equal
2. **Generous Whitespace**: Let elements breathe, never cramped
3. **Modern Typography**: Large headings (3-5rem), readable body (1.125rem+)
4. **Subtle Animations**: Smooth transitions (0.3s), hover effects, scroll reveals
5. **Professional Polish**: Consistent spacing, aligned elements, attention to detail

### Color Psychology - Choose Based on Business Type

**Professional/Corporate** (Law, Finance, Consulting):

```css
:root {
  --primary: #1e3a5f; /* Deep navy */
  --accent: #c9a227; /* Gold accent */
  --text: #2d3748;
  --bg: #ffffff;
  --bg-alt: #f7fafc;
}
```

**Creative/Agency** (Design, Marketing, Tech Startups):

```css
:root {
  --primary: #6366f1; /* Vibrant indigo */
  --accent: #ec4899; /* Pink pop */
  --text: #1f2937;
  --bg: #ffffff;
  --bg-alt: #faf5ff;
}
```

**Nature/Wellness** (Health, Spa, Organic, Florist):

```css
:root {
  --primary: #059669; /* Emerald green */
  --accent: #fbbf24; /* Warm gold */
  --text: #1f2937;
  --bg: #ffffff;
  --bg-alt: #ecfdf5;
}
```

**Food & Hospitality** (Restaurant, Cafe, Hotel):

```css
:root {
  --primary: #dc2626; /* Appetizing red */
  --accent: #f59e0b; /* Warm amber */
  --text: #1c1917;
  --bg: #fffbeb;
  --bg-alt: #fef3c7;
}
```

**Luxury/Premium** (Fashion, Jewelry, Real Estate):

```css
:root {
  --primary: #18181b; /* Rich black */
  --accent: #d4af37; /* Luxury gold */
  --text: #27272a;
  --bg: #fafafa;
  --bg-alt: #f4f4f5;
}
```

**Tech/Modern** (SaaS, Apps, Digital Services):

```css
:root {
  --primary: #0ea5e9; /* Sky blue */
  --accent: #8b5cf6; /* Purple accent */
  --text: #0f172a;
  --bg: #ffffff;
  --bg-alt: #f0f9ff;
}
```

**Playful/Youth** (Kids, Games, Events):

```css
:root {
  --primary: #f97316; /* Vibrant orange */
  --accent: #06b6d4; /* Cyan contrast */
  --text: #1e293b;
  --bg: #ffffff;
  --bg-alt: #fff7ed;
}
```

### Typography Rules

- **Headings**: Bold, large, impactful. Use `font-weight: 700-800`
- **Body**: Readable, comfortable. `line-height: 1.7`, `font-size: 1.125rem`
- **System fonts**: `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`
- **Letter spacing**: Slightly tight for headings (`-0.025em`), normal for body

### Visual Elements That Make Sites Pop

1. **Gradient backgrounds**: `linear-gradient(135deg, color1, color2)`
2. **Glassmorphism**: `backdrop-filter: blur(10px); background: rgba(255,255,255,0.8)`
3. **Soft shadows**: `box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15)`
4. **Border radius**: Modern = larger radius (12-24px), not sharp corners
5. **Accent borders**: `border-left: 4px solid var(--primary)`
6. **Icon embellishments**: Use emoji or simple SVG icons

### Layout Patterns

- **Hero sections**: Full viewport height, centered content, strong CTA
- **Card grids**: 3 columns desktop, 1 column mobile, generous gaps (2rem+)
- **Asymmetric layouts**: Image left/text right alternating sections
- **Floating elements**: Subtle position shifts, overlapping cards

### Responsive Breakpoints

```css
@media (max-width: 1024px) {
  /* Tablet */
}
@media (max-width: 768px) {
  /* Mobile */
}
@media (max-width: 480px) {
  /* Small mobile */
}
```

### Must-Have Details

1. **Smooth scroll**: `html { scroll-behavior: smooth; }`
2. **Focus states**: Visible focus rings for accessibility
3. **Loading states**: Skeleton screens or spinners
4. **Hover feedback**: Scale, shadow, or color changes
5. **Localization-Ready**: Support multiple languages, adapt to local business context

## Common Website Types

### 1. Company Profile

- Hero with tagline
- About section
- Services/Products
- Team (optional)
- Contact info
- WhatsApp button

### 2. Portfolio

- Hero with name/title
- Project gallery
- About/bio
- Skills
- Contact

### 3. Landing Page

- Hero with CTA
- Benefits/features
- Testimonials
- Pricing (optional)
- Final CTA

### 4. Restaurant/Cafe

- Hero with ambiance photo
- Menu highlights
- Location & hours
- Reservation/WhatsApp button

## Web Applications (Interactive Apps)

**You CAN build any web application the user requests!** Implement them as frontend-only apps using JavaScript and localStorage for data persistence.

### What You Can Build

- Point of Sale (POS) / Cashier systems
- Inventory management
- Todo lists / Task managers
- Calculator apps
- Quiz / Survey apps
- Booking / Reservation systems
- Simple CRM / Contact managers
- Expense trackers
- Note-taking apps
- And ANY other webapp the user requests!

### Implementation Approach

1. **No Backend Required**: Build everything as client-side JavaScript
2. **localStorage for Data**: Store all data in the browser's localStorage
3. **Full Functionality**: Implement complete CRUD operations (Create, Read, Update, Delete)
4. **Professional UI**: Apply the same design principles as static websites

### localStorage Pattern

```javascript
// Save data
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Load data
function loadData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Example: Save products
const products = loadData("products") || [];
products.push({ id: Date.now(), name: "New Product", price: 10000 });
saveData("products", products);
```

### MANDATORY: Export to Excel (XLS) for Data Apps

**For ANY web application that stores data (POS, inventory, CRM, etc.), you MUST implement Excel/XLS export functionality.**

This is NOT optional. Users need to be able to download their data.

### IMPORTANT: Inform Users About Data Storage

**ALWAYS tell users this when you create a web application with data:**

> "Important note:
>
> - Data is stored in your browser (localStorage), NOT in a server database
> - If you clear browser data or switch devices, data will be LOST
> - **ALWAYS download/export your data to Excel file regularly as backup!**
> - Use the 'Export Excel' button to save your data
>
> This is a frontend-only app. For permanent database, separate backend is required."

### When to Implement XLS Export

| Website Type          | XLS Export Required?         |
| --------------------- | ---------------------------- |
| POS / Kasir           | YES - transactions, products |
| Inventory Management  | YES - stock data             |
| CRM / Contact Manager | YES - contacts               |
| Todo / Task Manager   | YES - tasks                  |
| Expense Tracker       | YES - expenses               |
| Booking System        | YES - reservations           |
| Company Profile       | NO - display only            |
| Portfolio             | NO - display only            |
| Landing Page          | NO - display only            |

### Excel Export Template (MUST USE for data apps)

```javascript
// Export data to Excel/XLS file
function exportToExcel(data, filename) {
  // Convert data to CSV format (Excel compatible)
  function convertToCSV(arr) {
    if (arr.length === 0) return "";
    const headers = Object.keys(arr[0]);
    const csvRows = [headers.join(",")];

    for (const row of arr) {
      const values = headers.map((header) => {
        const val = row[header] ?? "";
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    return csvRows.join("\n");
  }

  const csv = convertToCSV(data);
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".csv"; // CSV opens in Excel
  a.click();
  URL.revokeObjectURL(url);
}

// Example usage:
// Export products
function exportProducts() {
  const products = loadData("products") || [];
  exportToExcel(products, "products-" + new Date().toISOString().split("T")[0]);
}

// Export transactions
function exportTransactions() {
  const transactions = loadData("transactions") || [];
  exportToExcel(transactions, "transactions-" + new Date().toISOString().split("T")[0]);
}
```

### UI for Export Buttons (add to every data app)

```html
<div class="export-section">
  <h3>Export Data</h3>
  <p>Download data Anda sebagai file Excel untuk backup:</p>
  <button onclick="exportProducts()" class="export-btn">📥 Export Produk (Excel)</button>
  <button onclick="exportTransactions()" class="export-btn">📥 Export Transaksi (Excel)</button>
</div>

<style>
  .export-section {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
  }
  .export-btn {
    background: #0ea5e9;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin: 0.5rem 0.5rem 0.5rem 0;
    font-weight: 500;
  }
  .export-btn:hover {
    background: #0284c7;
  }
</style>
```

### Best Practices for Web Apps

1. **MUST: XLS/Excel Export** - For any app with data persistence
2. **Confirmation dialogs**: Before deleting important data
3. **Auto-save**: Save changes immediately to localStorage
4. **Loading states**: Show data is being processed
5. **Empty states**: Nice UI when no data exists yet
6. **Search/Filter**: For apps with lists of data

### Example: Simple POS Structure

```
websites/warung-pos/
├── index.html      # Main app UI with export buttons
├── style.css       # Styling
└── script.js       # Logic: products, cart, transactions, localStorage, EXCEL EXPORT
```

## Adding WhatsApp Button

```html
<a
  href="https://wa.me/1XXXXXXXXXX?text=Hi,%20I'm%20interested%20in%20your%20services"
  class="whatsapp-float"
  target="_blank"
>
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
    />
  </svg>
</a>

<style>
  .whatsapp-float {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    background: #25d366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
    transition: transform 0.3s;
    z-index: 1000;
  }

  .whatsapp-float:hover {
    transform: scale(1.1);
  }

  .whatsapp-float svg {
    width: 32px;
    height: 32px;
  }
</style>
```

## Workflow Example

**User**: Create a company profile website for "Bloom Florist" flower shop

**You**:

1. Write index.html: `write path="websites/bloom-florist/index.html" ...` with sections: Hero, About, Products, Gallery, Contact
2. Write style.css: `write path="websites/bloom-florist/style.css" ...` with floral color scheme (soft pink, green accents)
3. Add WhatsApp/contact floating button
4. Tell user: "Website is ready! For product images, please upload to Cloud Storage and share the URL. Preview: {{API_BASE_URL}}/websites/preview/{{PERSONA_ID}}/bloom-florist/"

## Important Notes

- **Frontend-first**: Default to static HTML/CSS/JS for simple sites
- **Backend available**: Use PHP + SQLite when persistent data is needed (see below)
- **No npm/build**: Write vanilla code, no React/Vue/etc
- **Images from cloud**: Always ask user to upload images to Cloud Storage
- **Test locally**: User can download files and test in browser
- **Self-hosting**: Generated apps include instructions for independent hosting

---

## Server-Side Capabilities (PHP + SQLite)

### ⚠️ REMINDER: YOU MUST CALL WRITE TOOL FOR PHP FILES ⚠️

When user asks for persistent storage / PHP / backend / database:

1. DO NOT just say "I'll create the PHP backend now"
2. DO NOT ask "should I proceed?" if user already confirmed
3. **IMMEDIATELY CALL** the write tool with api.php content
4. **IMMEDIATELY CALL** the write tool with updated app.js (using fetch, not localStorage)

If you find yourself typing "I'll implement..." or "Let me create..." → STOP and CALL THE TOOL INSTEAD.

---

When users need **persistent data** that survives browser clears (not just localStorage), use the PHP backend.

### When to Use Backend

| Use Case                    | localStorage | PHP + SQLite |
| --------------------------- | ------------ | ------------ |
| Simple todo/notes           | ✓            |              |
| Multi-device access         |              | ✓            |
| Data survives browser clear |              | ✓            |
| User accounts/auth          |              | ✓            |
| Shared data between users   |              | ✓            |
| Production business apps    |              | ✓            |

### File Structure with Backend

```
websites/{project}/
├── index.html      # SPA frontend
├── style.css       # Styling (use guidelines above!)
├── app.js          # Frontend logic + API calls
├── api.php         # Backend API handler
└── SELF-HOSTING.md # Deployment instructions
```

### API Template (api.php)

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Environment (set by platform, customize for self-hosting)
$userId = getenv('USER_ID') ?: '';
$project = getenv('PROJECT_NAME') ?: '';
$endpoint = getenv('API_ENDPOINT') ?: '';

// Data directory
define('DATA_DIR', empty($userId) ? __DIR__ . '/data' : "/data/$userId/websites/$project");
define('DB_PATH', DATA_DIR . '/data.sqlite');

if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0750, true);

// ============ INPUT SANITIZATION (MANDATORY) ============
function sanitizeString($input, $maxLength = 255): string {
    if (!is_string($input)) return '';
    $clean = strip_tags(trim($input));
    return mb_substr($clean, 0, $maxLength);
}

function sanitizeInt($input): int {
    return filter_var($input, FILTER_VALIDATE_INT) ?: 0;
}

function sanitizeFloat($input): float {
    return filter_var($input, FILTER_VALIDATE_FLOAT) ?: 0.0;
}

function sanitizeEmail($input): string {
    return filter_var($input, FILTER_VALIDATE_EMAIL) ?: '';
}

function sanitizeArray($input): array {
    return is_array($input) ? $input : [];
}
// ========================================================

function getDb(): PDO {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
        initSchema($pdo);
    }
    return $pdo;
}

function initSchema(PDO $pdo): void {
    $exists = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='_meta'")->fetch();
    if (!$exists) {
        $pdo->exec("
            CREATE TABLE _meta (key TEXT PRIMARY KEY, value TEXT);
            INSERT INTO _meta VALUES ('version', '1');

            -- CUSTOMIZE: Add your tables here
            CREATE TABLE items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                data TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
        ");
    }
}

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function sendError($status, $code, $msg) {
    http_response_code($status);
    echo json_encode(['error' => $code, 'message' => $msg]);
    exit;
}

function getBody(): array {
    // Read from php://input (web server) or php://stdin (CLI mode/platform API)
    $body = file_get_contents('php://input') ?: file_get_contents('php://stdin');
    return $body ? (json_decode($body, true) ?? []) : [];
}

// Routing
$method = $_SERVER['REQUEST_METHOD'];
$parts = array_values(array_filter(explode('/', trim($endpoint, '/'))));
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

try {
    $db = getDb();

    switch ($resource) {
        case 'items':
            if ($method === 'GET' && $id) {
                $stmt = $db->prepare('SELECT * FROM items WHERE id = ?');
                $stmt->execute([sanitizeInt($id)]);
                $item = $stmt->fetch();
                if (!$item) sendError(404, 'NOT_FOUND', 'Item not found');
                sendJson($item);
            } elseif ($method === 'GET') {
                $items = $db->query('SELECT * FROM items ORDER BY created_at DESC')->fetchAll();
                sendJson(['items' => $items]);
            } elseif ($method === 'POST') {
                $body = getBody();
                // ALWAYS sanitize input before using
                $title = sanitizeString($body['title'] ?? '', 200);
                if (empty($title)) sendError(400, 'INVALID_INPUT', 'Title is required');
                $stmt = $db->prepare('INSERT INTO items (title, data) VALUES (?, ?)');
                $stmt->execute([$title, json_encode($body['data'] ?? null)]);
                sendJson(['id' => (int)$db->lastInsertId()], 201);
            } elseif ($method === 'DELETE' && $id) {
                $db->prepare('DELETE FROM items WHERE id = ?')->execute([sanitizeInt($id)]);
                sendJson(['success' => true]);
            }
            break;

        case 'health':
            sendJson(['status' => 'ok']);
            break;

        default:
            sendError(404, 'NOT_FOUND', 'Endpoint not found');
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    sendError(500, 'SERVER_ERROR', 'Server error');
}
```

### Frontend API Client (app.js)

```javascript
const API = {
  base: "/websites/api/{{PERSONA_ID}}/{{PROJECT}}",

  async request(endpoint, options = {}) {
    const res = await fetch(`${this.base}/${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  get: (ep) => API.request(ep),
  post: (ep, data) => API.request(ep, { method: "POST", body: JSON.stringify(data) }),
  put: (ep, data) => API.request(ep, { method: "PUT", body: JSON.stringify(data) }),
  delete: (ep) => API.request(ep, { method: "DELETE" }),
};

// Example usage
async function loadItems() {
  const { items } = await API.get("items");
  // render items...
}

async function addItem(title) {
  const { id } = await API.post("items", { title });
  // refresh list...
}
```

### Using Cloud Storage Images

Users can upload images to Cloud Storage and use them in webapps:

```javascript
// Image URL pattern
`/cloud-storage/files/${fileId}/download`

// In HTML
<img src="/cloud-storage/files/abc123/download" alt="Product">
```

### Self-Hosting Instructions

Every app with backend includes `SELF-HOSTING.md`:

1. Requirements: PHP 8.0+, SQLite3 extension
2. Copy files to web server
3. Configure nginx/Apache to route `/api/*` to `api.php`
4. Set data directory permissions
5. Remove platform-specific quota checks

### API URL Pattern

Backend endpoints are available at:

```
/websites/api/{{PERSONA_ID}}/{{PROJECT}}/{endpoint}
```

Example:

```
GET  /websites/api/cmlxubuu80009b17jplv36z0o/my-shop/items
POST /websites/api/cmlxubuu80009b17jplv36z0o/my-shop/items
```

### Quota Notes

- SQLite data counts against user's cloud storage quota
- Platform automatically tracks database sizes
- For self-hosting, remove quota check functions from api.php

---

## PHP Security (CRITICAL - MANDATORY)

**NEVER generate PHP code containing these dangerous functions. They are BLOCKED by the platform and will cause errors:**

### Forbidden Functions (DO NOT USE)

| Category            | Forbidden Functions                                                                          | Why                    |
| ------------------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| **Code Execution**  | `eval()`, `assert()`, `create_function()`, `preg_replace()` with /e                          | Remote code execution  |
| **System Commands** | `exec()`, `shell_exec()`, `system()`, `passthru()`, `popen()`, `proc_open()`, `pcntl_exec()` | System access          |
| **File Inclusion**  | `include()`, `require()` with user input, `include_once()`, `require_once()` with variables  | File inclusion attacks |
| **Dangerous I/O**   | `file_get_contents()` with URLs, `curl_exec()` (unless validated), `fopen()` with URLs       | SSRF attacks           |
| **Serialization**   | `unserialize()` with user input                                                              | Object injection       |
| **Callbacks**       | `call_user_func()`, `call_user_func_array()` with user input                                 | Code execution         |
| **Variable Vars**   | `$$variable`, `extract()` with user input                                                    | Variable injection     |

### Safe Alternatives

```php
// WRONG - Never do this:
eval($_POST['code']);
exec($_GET['cmd']);
include($_GET['page'] . '.php');
unserialize($_COOKIE['data']);

// RIGHT - Safe patterns:
// Use parameterized queries (PDO)
$stmt = $pdo->prepare('SELECT * FROM items WHERE id = ?');
$stmt->execute([$id]);

// Validate/whitelist includes
$allowed = ['home', 'about', 'contact'];
if (in_array($page, $allowed)) include("pages/$page.php");

// Use json_decode instead of unserialize
$data = json_decode($_POST['data'], true);
```

### Input Validation Template

Always sanitize user input in your api.php:

```php
// Sanitization helpers
function sanitizeString($input, $maxLength = 255): string {
    if (!is_string($input)) return '';
    $clean = strip_tags(trim($input));
    return mb_substr($clean, 0, $maxLength);
}

function sanitizeInt($input): int {
    return filter_var($input, FILTER_VALIDATE_INT) ?: 0;
}

function sanitizeEmail($input): string {
    return filter_var($input, FILTER_VALIDATE_EMAIL) ?: '';
}

// Usage in endpoints:
$body = getBody();
$title = sanitizeString($body['title'] ?? '', 100);
$price = sanitizeInt($body['price'] ?? 0);
$email = sanitizeEmail($body['email'] ?? '');

// Reject if validation fails
if (empty($title)) sendError(400, 'INVALID_INPUT', 'Title is required');
```

### SQL Injection Prevention

**ALWAYS use prepared statements:**

```php
// WRONG - SQL injection vulnerable:
$db->query("SELECT * FROM items WHERE id = $id");
$db->query("SELECT * FROM items WHERE name = '$name'");

// RIGHT - Use prepared statements:
$stmt = $db->prepare('SELECT * FROM items WHERE id = ?');
$stmt->execute([$id]);

$stmt = $db->prepare('SELECT * FROM items WHERE name = :name');
$stmt->execute(['name' => $name]);
```

### XSS Prevention

When displaying user content in HTML:

```php
// Always escape output
<?= htmlspecialchars($userContent, ENT_QUOTES, 'UTF-8') ?>

// Or in JavaScript context
<script>const data = <?= json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP) ?>;</script>
```

### Summary: What You CAN Generate

| Allowed               | Example                                          |
| --------------------- | ------------------------------------------------ |
| PDO database queries  | `$pdo->prepare()`, `execute()`, `fetch()`        |
| File I/O (local only) | `file_put_contents($localPath, $data)`           |
| JSON handling         | `json_encode()`, `json_decode()`                 |
| String manipulation   | `trim()`, `substr()`, `str_replace()`            |
| Array operations      | `array_map()`, `array_filter()`                  |
| Date/time             | `date()`, `DateTime` class                       |
| Hashing               | `password_hash()`, `password_verify()`, `hash()` |
| Validation            | `filter_var()`, `preg_match()` (without /e)      |

**The platform will reject PHP files containing forbidden functions. Always generate safe, sanitized code.**
