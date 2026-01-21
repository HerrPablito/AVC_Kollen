# Projektregler

## Styling
- **Undvik SCSS-filer**: Använd inte komponent-specifika SCSS-filer om det inte är absolut nödvändigt.
- **Globala stilar**: Globala SCSS-filer är undantagna och får användas.
- **Preferens**: Föredra **Tailwind CSS** och **PrimeNG** komponenter framför separata stilfiler eller inline styles.
  - Tailwind CSS för utility-baserad styling
  - PrimeNG för färdiga UI-komponenter

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
