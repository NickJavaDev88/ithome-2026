# iThome Ironman 2026 — Reglas del Proyecto (AGENTS.md)

Este repositorio gestiona la redacción, previsualización web (Astro) y publicación de la serie para el **iThome Ironman 2026 (第 18 屆鐵人賽)** de Nico.

---

## 1. Contexto de la Serie

- **Tema:** *De Spring Boot 4 a un backend con agentes IA — modernizando arquitectura con MCP, A2A, Vue 3 y CI/CD real*
- **Categoría:** Software Development (o 生成式 AI)
- **Meta del Reto:** 30 días consecutivos, mínimo 300 palabras/día (conteo incluye código e imágenes). Meta de calidad: ~1.000 palabras/día.
- **Audiencia e Idioma:** Artículos redactados en **chino tradicional (繁體中文)** para la plataforma de Taiwán (iThome), manteniendo términos técnicos, código y configuraciones en inglés.

---

## 2. Stack Tecnológico del Repositorio

- **Framework Web:** Astro + TypeScript (genera el sitio público para GitHub Pages)
- **Gestor de Paquetes:** pnpm
- **Testing:** Vitest (pnpm test:ithome)
- **Automatización de Publicación:** Playwright + CDP (.claude/skills/ithome-ironman-publisher/)

---

## 3. Comandos Principales

`ash
# Desarrollo local del blog Astro
pnpm dev
pnpm build

# Testing de scripts y utilidades
pnpm test:ithome

# Preparar payloads de artículos para iThome
node scripts/ithome/prepare.mjs --day <1-30>
node scripts/ithome/prepare.mjs --all

# Verificar distribución pública
node scripts/verify-public-distribution.mjs
`

---

## 4. Skills y Comandos de Agente (Claude Code & Antigravity)

Los skills y comandos están disponibles en .claude/:
- /ithome-prepare [--day N | --all] — Valida y genera el payload en output/.
- /ithome-audit [--day N] — Inspecciona borradores en iThome sin mutar.
- /ithome-publish --day N — Publica el borrador verificado del día correspondiente.

---

## 5. Reglas de Contenido y Calidad

1. **Criterios del Jurado:** Priorizar consistencia arquitectónica real sobre tutoriales genéricos. Cada arco debe culminar con un hito demostrable.
2. **Diagramas y Código:** Incluir diagramas Mermaid y snippets funcionales en Java 21 / Spring Boot 4 / Vue 3.
3. **No romper contratos:** Nunca modificar la estructura de output/ manualmente; generar siempre mediante prepare.mjs.
