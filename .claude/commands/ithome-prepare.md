---
description: Valida y prepara los payloads de los artículos para iThome Ironman
argument-hint: [--day N | --all]
---

Ejecuta el paso de preparación de payloads para la serie iThome Ironman 2026:

1. Ejecuta: 
ode scripts/ithome/prepare.mjs .
2. Valida que el conteo de palabras supere el mínimo oficial de 300 palabras (meta ideal ~1000 palabras).
3. Revisa si hay imágenes o enlaces rotos en output/.
4. Reporta el estado de los artículos preparados y cualquier error detectado.
