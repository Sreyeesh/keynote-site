#!/bin/bash

# Update the slide typography section in styles.css
sed -i '141,191c\
/* ---------- SLIDE TYPOGRAPHY ---------- */\
.slide h1 {\
  font-size: clamp(4rem, 8vw, 7rem);\
  font-weight: 700;\
  letter-spacing: -0.05em;\
  line-height: 1.1;\
  margin-bottom: 3rem;\
  color: var(--fg);\
  font-style: italic;\
  text-transform: none;\
  text-shadow: none;\
}\
\
.slide h2 {\
  font-size: clamp(3rem, 6vw, 5rem);\
  font-weight: 600;\
  letter-spacing: -0.03em;\
  line-height: 1.2;\
  margin-bottom: 3rem;\
  color: var(--fg);\
  font-style: italic;\
  text-transform: none;\
  text-shadow: none;\
}\
\
.slide h3 {\
  font-size: clamp(2rem, 4vw, 3rem);\
  font-weight: 500;\
  letter-spacing: -0.02em;\
  line-height: 1.3;\
  margin-bottom: 2rem;\
  color: var(--fg);\
  font-style: italic;\
  text-transform: none;\
}\
\
.slide .subtitle {\
  font-size: clamp(1.5rem, 4vw, 2.5rem);\
  font-weight: 400;\
  color: var(--muted);\
  line-height: 1.4;\
  margin-bottom: 4rem;\
  max-width: 90%;\
  font-style: italic;\
  text-transform: none;\
  letter-spacing: 0.02em;\
}\
\
.slide p {\
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);\
  line-height: 1.6;\
  color: var(--muted);\
  margin-bottom: 2rem;\
  font-weight: 400;\
  font-style: italic;\
}' styles.css

echo "✅ Typography updated successfully!"
echo "🎨 Applied elegant italic style to all slide text"
echo "🚀 Refresh your browser at http://localhost:8081 to see the changes"
