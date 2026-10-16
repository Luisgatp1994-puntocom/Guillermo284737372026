# Apps personales

| Carpeta / archivo | Qué es | Dónde corre |
|---|---|---|
| `discursos/` | **Discursos Públicos · Congregación Tierra Baja.** Programa de los sábados, confirmación de oradores, plan B y avisos a los ancianos. | Vercel: https://discursos-tierra-baja.vercel.app |
| `rutina.html` | **Gym · Lucho & Juli.** Rutinas por día y videos de técnica. | GitHub Pages |

## Discursos — cómo está armado

- Front estático sin build: `index.html` + `app.js` + `titulos.js` (los 194 bosquejos de la S-99).
- Datos en Supabase (proyecto `discursos-tierra-baja`). Las tablas están cerradas; la app solo usa funciones RPC que validan un PIN:
  - PIN de **consulta** (ancianos): solo lectura.
  - PIN de **responsable**: asigna, confirma, plan B, oradores y congregaciones.
  - Los PIN se guardan cifrados en la base y se cambian desde la app (Avisos → Cuenta). **Nunca** los pongas en este repo.
- La llave de Supabase en `app.js` es la *publishable*: es pública por diseño; la seguridad está en las funciones con PIN.
- Vercel publica la carpeta `discursos/` (Root Directory = `discursos`).
