# Proyecto: scan-me

## Que hace la app 
SaaS para que un usuario suba facturas físicas (foto), un OCR extrae ítems vía endpoint, el usuario confirma o edita, y la app guarda una 
"factura virtual" con la imagen original como respaldo. El dashboard muestra: en qué gasta, a quién destina los gastos, y evolución temporal.

## Conceptos de dominio
- **Factura virtual**: registro estructurado generado desde una factura 
  física vía OCR. Siempre conserva referencia a la imagen original.
- **Colección**: agrupación de gastos creada por el usuario (ej: "Casa").
- **Subcategoría**: nivel dentro de una colección (ej: "Casa > Luz").
- **Persona**: persona registrada en la plataforma a la que se le 
  puede asignar un gasto para tracking (ej: "Tecnología → Ramón").

## Stack 
- pnpm (gestor de paquetes)
- Nuxt 4 (framework)
- groq (OCR)
- nuxt/supabase (auth + DB + storage)

## Stack NO USADO 
- No Pinia.
- No axios: fetch nativo o `$fetch` de Nuxt.

## Estructura 
Estructura default de Nuxt 4. Convenciones específicas:
- Lógica de negocio en `composables/`, no en componentes.

## Convenciones detalladas
@.claude/security.md

## Comandos
- `pnpm dev` — desarrollo local
- `pnpm build` — build de producción
- `pnpm typecheck` — verificación de tipos TypeScript
- `pnpm lint` — ESLint

## Reglas de comportamiento
1. **IMPORTANT**: si los requerimientos del usuario son ambiguos o 
   incompletos, NO ejecutes nada. Preguntá explícitamente qué falta 
   antes de actuar.

2. **YOU MUST**: si una petición rompe alguna convención de 
   `security.md`, DETEN la edición, indicá exactamente 
   qué convención se rompería y qué consecuencias trae, y pide
   confirmación explícita antes de proceder.

3. Después de cualquier cambio de código, corre `pnpm typecheck` y 
   `pnpm lint`. Si hay errores, arreglalos antes de dar la tarea 
   por terminada. Sin esto, el despliegue a producción falla.

4. Respuestas y resúmenes directos al grano. Sin preámbulos, sin 
   "claro!", sin explicar lo obvio. Si una explicación no aporta 
   información accionable, omitila.

5. No agregues comentarios en el código a menos que la lógica sea 
   genuinamente no obvia. Nombres claros sustituyen comentarios.

6. Convenciones de código:
   - Lógica de negocio en composables, no en componentes.
   - DRY: si copiás código dos veces, extraelo a una función o composable.
   - Funciones cortas, una responsabilidad cada una.
   - Manejo explícito de errores de Supabase: nunca asumas que una 
     query funcionó sin revisar `error`.

7. **NEVER** commitees archivos `.env` ni claves de Supabase.