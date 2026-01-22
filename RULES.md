# Projektregler

## Styling
- **Undvik SCSS-filer**: Använd inte komponent-specifika SCSS-filer om det inte är absolut nödvändigt.
- **Globala stilar**: Globala SCSS-filer är undantagna och får användas.
- **Preferens**: Föredra **Tailwind CSS** och **PrimeNG** komponenter framför separata stilfiler eller inline styles.
  - Tailwind CSS för utility-baserad styling
  - PrimeNG för färdiga UI-komponenter
- **Layout**: Använd Flexbox för layout (Tailwind: `flex`, `flex-col`, `items-center`, etc.)
- **Mobilanpassning**: Allt ska vara mobilanpassat och responsivt. Använd Tailwinds responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) för att anpassa för olika skärmstorlekar.

## Angular Best Practices
- **Signals**: Använd Angular Signals där det passar sig för reaktivitet.

## Definition of Done
- Bygger utan fel.
- Kör grundflöde manuellt.
- Ingen uppenbar TODO kvar i förändringen.

## Kodstil
- **Indentering**: 2 spaces (om relevant).
- **Namngivning**: 
  - `camelCase` i JS/TS.
  - `PascalCase` för komponenter.
- **Magic Numbers**: Undvik "magic numbers" utan förklaring.
- **Kommentarer**: Inga onödiga kommentarer i koden. Implementera själv-dokumenterande kod.

## Projektstruktur
- **Shared Mapp**: Validatorer, services och annat som kan återanvändas ska ligga i `src/app/shared`.

# UI-regler – Burgundy theme (inspirerad av Contentsquare-känslan)

## 1) Designprinciper
- Mörk, varm bakgrund (burgundy) som bas.
- Hög kontrast för text, låg kontrast för ytor (cards/panels) för “depth”.
- Accentfärg används sparsamt (CTA, highlights, active states).
- Rundade hörn + mjuka skuggor/glas-känsla (men inte överdrivet).

## 2) Färgregler
- All färg ska komma från CSS-variabler (tokens).
- Bakgrund:
  - Page background: --bg-0
  - Panels/cards: --bg-1 / --bg-2
- Text:
  - Primär text: --text-0
  - Sekundär text: --text-1
- Accent:
  - Primär CTA: --accent-0
  - Hover/active: --accent-1
  - “Danger/alert” (om behövs): --danger-0
- Inga hårdkodade hex-färger i komponenter.

## 3) Typografi
- Sans-serif, modern (systemfont OK).
- H1: stor, tight, tydlig.
- Brödtext: hög läsbarhet, inte för ljus.
- Begränsa line-length: max 68–76 tecken för brödtext.

## 4) Spacing & layout
- Endast spacing från skalan: --space-1..--space-8
- Default page padding: 24–32px desktop, 16–20px mobile.
- Container maxbredd: 1100–1200px.
- Sektioner separeras med minst --space-7.

## 5) Komponentstil
- Styling ska vara component-scoped (Angular component.scss).
- Globala utilities är ok men få (max ~10).
- Buttons:
  - Primary: accentfärg + tydlig hover
  - Secondary: mörk yta + border
- Cards:
  - Bakgrund: --bg-1
  - Border: subtil (--border-0)
  - Lätt blur/shine är ok men använd tokens.

## 6) Tillgänglighet
- Fokus ska alltid synas: använd --focus-ring.
- Textkontrast: använd --text-0 för viktiga rubriker/brödtext.
- Hover får inte vara enda sättet att se interaktion (även focus/active).

## 7) AI-regel (Antigravity)
- Följ tokens i styles.scss.
- Ingen inline-style (undantag: CSS-variabler på root vid tema-switch).
- Skapa klasser som beskriver roll: .hero, .card, .cta-button (inte .redButton).
