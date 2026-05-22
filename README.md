# ScanMe

SaaS para digitalizar facturas físicas mediante OCR. El usuario fotografía un recibo, un modelo de visión extrae los ítems, el usuario confirma o edita los datos, y la aplicación persiste una "factura virtual" estructurada junto con la imagen original como respaldo. El panel de control muestra patrones de gasto por categoría, destinatario y período.

## Características

- Captura de facturas vía cámara o galería con OCR automático.
- Edición y validación humana antes de persistir.
- Colecciones jerárquicas definidas por el usuario (taxonomía con prevención de ciclos).
- Asignación de gastos a "personas" para tracking individual.
- Enlaces de compartición pública (`/p/[token]`) que permiten a un tercero subir facturas a nombre del propietario sin autenticación.
- Anulación suave (soft-delete) de facturas con inmutabilidad post-anulación.
- Exportación CSV de facturas con filtros.
- Diseño monocromo, hairline-driven, responsive (breakpoint canónico en 880px).

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Nuxt 4 (SSR + Nitro) |
| UI | Vue 3, CSS custom properties (sin framework de componentes) |
| Auth + DB + Storage | Supabase (Postgres + RLS) |
| OCR | Groq Vision (`meta-llama/llama-4-scout-17b-16e-instruct`) |
| Gestor de paquetes | pnpm |

Dependencias deliberadamente ausentes: Pinia, axios, librerías de UI.

## Requisitos

- Node.js compatible con Nuxt 4 (≥ 20.x recomendado).
- pnpm instalado globalmente.
- Proyecto Supabase con las migraciones de `supabase/migrations/` aplicadas.
- API key de Groq.

## Instalación

```bash
pnpm install
cp .env.example .env   # completar valores
pnpm dev
```

`pnpm install` ejecuta `nuxt prepare` automáticamente para regenerar los tipos de `.nuxt/`.

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

| Variable | Ámbito | Uso |
|----------|--------|-----|
| `SUPABASE_URL` | público | Cliente Supabase |
| `SUPABASE_KEY` | público | Anon key, consumida por `@nuxtjs/supabase` |
| `GROQ_API_KEY` | servidor | OCR vía Groq (`runtimeConfig.groqApiKey`) |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Solo usada en `server/api/public/share/**` para escribir en nombre del propietario de un enlace de compartición |

La service role key **nunca** se expone al cliente y **nunca** se utiliza fuera de los endpoints de share público.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (Nitro + Vite) |
| `pnpm build` | Build de producción (`.output/`) |
| `pnpm preview` | Sirve el build de producción localmente |
| `pnpm generate` | Prerender estático (no es el target principal; las rutas SSR usan Nitro) |

## Arquitectura

Dos superficies de entrada comparten la misma base de datos:

1. **App autenticada** (`/app/**`): protegida por `@nuxtjs/supabase`, opera bajo el JWT del usuario y queda restringida por RLS.
2. **Compartición pública** (`/p/[token]`): un visitante anónimo sube facturas que se persisten como si fueran del propietario del token. Los endpoints `server/api/public/share/**` resuelven el `share_token` vía service role key porque RLS los bloquearía.

### Rutas y layouts

- `app/layouts/default.vue` — chrome de marketing/auth.
- `app/layouts/landing.vue` — página de aterrizaje.
- `app/layouts/app.vue` — shell autenticado (sidebar + topbar + drawer móvil).
- Páginas autenticadas en `app/pages/app/**`: `dashboard`, `scan`, `invoices`, `collections`, `people`.
- Páginas de auth en `app/pages/`: `signin`, `signup`, `confirm` (todas envuelven `AuthView.vue`).

### API del servidor

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `POST /api/scan` | Usuario | OCR puro: recibe multipart `file`, devuelve JSON parseado. No escribe. |
| `POST /api/invoices` | Usuario | Sube la imagen al bucket `receipts` en `{user_id}/{invoice_id}.{ext}`, inserta la factura y sus ítems. Rollback del objeto si falla el insert. |
| `GET /api/public/share/[token]` | Público | Resuelve token → `{ person, collections }` del propietario. |
| `POST /api/public/share/[token]/scan` | Público | OCR token-gated. |
| `POST /api/public/share/[token]/invoice` | Público | Escritura de factura en nombre del propietario. |

## Estructura

```
.
├── app/
│   ├── assets/css/         # main.css (design tokens)
│   ├── components/         # AuthView, DigitalInvoice
│   ├── layouts/            # default, landing, app
│   ├── pages/
│   │   ├── app/            # rutas autenticadas
│   │   └── p/[token].vue   # compartición pública
│   └── app.vue
├── server/api/             # endpoints Nitro
├── supabase/migrations/    # SQL versionado
├── public/                 # assets estáticos
├── nuxt.config.ts
├── .claude/                # CLAUDE.md guidelines (security, design)
└── package.json
```

## Base de datos

Migraciones en `supabase/migrations/`, ordenadas y **idempotentes** (`if not exists`, `drop policy if exists`). Aplicar con `supabase db push` o pegando en el SQL editor. Las migraciones ya commiteadas no se editan: para cualquier cambio, agregar `NNNN_short_name.sql`.

Tablas principales (todas con RLS habilitada, owner-only vía `auth.uid() = user_id`):

| Migración | Objeto | Notas |
|-----------|--------|-------|
| 0001 | `invoices`, `invoice_items` | Output del OCR. `image_path` referencia el bucket privado `receipts`. |
| 0002 | Storage policies | RLS en `storage.objects`: primer segmento del path = `auth.uid()`. |
| 0003–0004 | `collections`, `invoice_collections` | Taxonomía jerárquica con trigger anti-ciclo. Vista `v_collection_stats` con `security_invoker = true`. |
| 0005–0006 | `invoices.voided_at` | Soft-delete con trigger de inmutabilidad: una factura anulada no se puede mutar. |
| 0007–0008 | `people`, `invoices.person_id` | Asignación a personas. `user_id` con `default auth.uid()` para evitar errores 42501. |
| 0009 | `people.share_token` UUID | Habilita `/p/[token]`. Sin policy de select público; solo lo lee el service role. |
| 0010 | `profiles` | `plan` (`beta` \| `free` \| `pro`) creado vía trigger sobre `auth.users`. Sin policy de escritura del cliente. |

### Storage

Bucket `receipts` privado. Convención de path: `{user_id}/{invoice_id}.{ext}`. El cliente SSR de Supabase no propaga consistentemente el JWT del usuario a las llamadas de Storage; los endpoints del servidor que suben archivos construyen un cliente dedicado con `Authorization: Bearer <access_token>` (ver `server/api/invoices/index.post.ts`).

## Diseño

El sistema de diseño está documentado en [`.claude/design.md`](.claude/design.md). Resumen:

- Paleta monocroma: tinta sobre off-white cálido, separadores de 1px al ~9% de negro.
- Tipografía Geist (sans) + Geist Mono (numerales, meta, eyebrows).
- Tokens CSS en `:root` (`app/assets/css/main.css`); referenciar tokens, nunca hex crudo.
- Radio default de paneles: `--radius` (14px).
- Breakpoint móvil canónico: 880px.

## Seguridad

Las reglas de seguridad operacionales están en [`.claude/security.md`](.claude/security.md). Puntos clave:

- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en `server/api/public/share/**`.
- Todo input validado del lado del servidor (incluida la respuesta del OCR) antes de persistir.
- RLS habilitada en toda tabla con datos de usuario; las queries que fallan por RLS se resuelven ajustando la policy, nunca desactivándola.
- Las migraciones publicadas son inmutables.

## Convenciones

- Lógica de negocio en `composables/`, no en componentes.
- Funciones cortas, una responsabilidad cada una.
- Manejo explícito de errores de Supabase: nunca asumir que una query funcionó sin revisar `error`.
- Sin comentarios redundantes; nombres claros sustituyen comentarios.

## Licencia

Privado. Todos los derechos reservados.
