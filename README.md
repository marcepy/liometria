# 👁 LIOmetría

**Calculador de Lentes Intraoculares para Oftalmólogos de Paraguay**

> Sin IA externa. Sin servidores propios. Sin datos clínicos que salgan del dispositivo.

---

## ¿Qué es LIOmetría?

LIOmetría es una aplicación web gratuita para el cálculo de potencia de lentes intraoculares (LIO) diseñada para el oftalmólogo paraguayo. Implementa Kane 2020 como fórmula principal junto a fórmulas clásicas de 3ª a 5ª generación, con módulos especializados para córneas irregulares y ojos post-refractivos.

Incluye una base de datos de 22 LIOs de los principales fabricantes del mercado (Alcon, J&J, Zeiss, B+L, Hoya, Rayner), con disponibilidad real de potencias por escalones (0.5D esférico, 0.25D cilíndrico).

Todas las fórmulas corren matemáticamente en el navegador — sin APIs externas, sin costos por consulta. El historial de cada médico se sincroniza en la nube vía Supabase.

---

## Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Estándar** | Kane 2020, Barrett Universal II, SRK/T, Hoffer Q, Holladay 1 y 2, Haigis, EVO 2.0, PEARL-DGS |
| **Tórico** | Kane Tórico, Barrett Tórico, EVO Tórico, Holladay 2 Tórico — cálculo vectorial con corrección ACP |
| **Post-LASIK/PRK** | Barrett True-K (con y sin historial), Haigis-L, Shammas, Masket |
| **Queratocono** | Kane KC, Barrett True-K KC, Haigis KC, Hoffer Q KC — ajuste por estadio Amsler-Krumeich |
| **Queratotomía Radiada (KR)** | Barrett True-K KR, Double-K Holladay, Haigis-L KR, ASCRS KR — variación diurna |

---

## Fórmulas incluidas

### Estándar
- **Kane 2020** ★ — implementación matemática nativa, fórmula principal
- Barrett Universal II (5ª gen)
- EVO 2.0 (5ª gen)
- PEARL-DGS
- Holladay 2 (5ª gen)
- Haigis (4ª gen)
- Holladay 1 (3ª gen)
- Hoffer Q (3ª gen)
- SRK/T (3ª gen)

### Tórico
- Kane Tórico ★ · Barrett Tórico · EVO Tórico · Holladay 2 Tórico

### Post-LASIK/PRK
- Barrett True-K ★ · Barrett True-K (sin hist.) · Haigis-L · Shammas · Masket

### Queratocono
- Kane KC ★ · Barrett True-K KC · Haigis KC · Hoffer Q KC

### Queratotomía Radiada
- Barrett True-K KR ★ · Double-K Holladay · Haigis-L KR · ASCRS KR

---

## Base de datos de LIOs

22 lentes intraoculares de los principales fabricantes del mercado mundial:

| Fabricante | Modelos incluidos |
|------------|------------------|
| **Alcon** | AcrySof IQ SN60WF · Toric SN6AT · PanOptix TFNT00 · PanOptix Toric · Clareon · Clareon Toric |
| **Johnson & Johnson** | Tecnis 1-Piece ZCB00 · Tecnis Toric ZCT · Symfony ZXR00 · Multifocal ZMB00 |
| **Carl Zeiss** | CT LUCIA 621P · CT LUCIA 611P · CT ASPHINA 409MP · AT TORBI 709MP · AT LISA tri 839MP |
| **Bausch + Lomb** | enVista MX60 · Akreos AO MI60 · SofPort AO LI61AO |
| **Hoya** | Vivinex XY1 · Vivinex Toric XY1A |
| **Rayner** | RayOne EMV · RayOne Toric |

Cada LIO incluye: constante A (fuente ULIB), ACD, rango de potencias disponibles, tipo y notas clínicas.

### Disponibilidad de potencias

- **Esférico**: escalones de **0.5D** — la app muestra la potencia calculada y la disponible más cercana, más las adyacentes inmediatas
- **Cilíndrico tórico**: escalones de **0.25D** — muestra el cilindro LIO disponible más cercano a la potencia calculada

Al seleccionar un LIO:
- La constante A se autocompleta en OD y OI simultáneamente
- Si el LIO es tórico, activa el módulo tórico automáticamente
- El LIO seleccionado se guarda en el historial y se restaura al recargar el caso

---

## Parámetros biométricos

| Parámetro | Descripción | Requerido |
|-----------|-------------|-----------|
| AL | Longitud axial (mm) | ✅ |
| K1 | Queratometría plana (D) | ✅ |
| K2 | Queratometría curva (D) | ✅ |
| Eje K2 | Meridiano curvo (°) | Tórico |
| ACD | Profundidad cámara anterior (mm) | Haigis / EVO / Kane |
| LT | Grosor del cristalino (mm) | Kane / Holladay 2 |
| CCT | Grosor corneal central (µm) | Kane |
| WTW | Diámetro corneal blanco-blanco (mm) | Kane |
| Sexo | Masculino / Femenino | Kane |
| Constante A | Constante del LIO | ✅ (auto con selector) |
| Objetivo Rx | Refracción objetivo (D) | ✅ |

---

## Historial — clic para cargar

Cada registro del historial es clickeable. Al hacer clic se restaura automáticamente:
- Datos del paciente (nombre, HC, fecha de nacimiento)
- Biometría completa de OD y OI
- Módulo de cálculo
- LIO seleccionado (fabricante, modelo, constante A)
- Selector de ojo(s) a calcular

---

## Impresión estilo Zeiss IOLMaster

- Header con logo, datos del médico y fecha/hora
- Layout OD / OS en dos columnas
- Tabla biométrica completa por ojo
- Tabla de fórmulas con fórmula recomendada ★ resaltada en verde
- LIO seleccionado en el encabezado del reporte
- Bloque tórico integrado cuando corresponde
- Sección de comentarios y firma del médico

---

## Mi Perfil

- Nombre, apellido, matrícula, institución
- Correo electrónico (el usado en el registro, no editable)
- Cambio de contraseña con confirmación (vía Supabase Auth)

---

## Características

- ✅ Un solo archivo HTML — sin instalación, sin dependencias, sin costos por consulta
- ✅ Kane 2020 implementado matemáticamente — no requiere API externa
- ✅ 22 LIOs de 6 fabricantes con constantes A verificadas (ULIB)
- ✅ Disponibilidad real de potencias (0.5D esférico · 0.25D cilíndrico)
- ✅ Clic en historial recarga todos los campos del caso completo
- ✅ Historial en la nube (Supabase) — disponible en cualquier dispositivo
- ✅ Sesión persistente — sin volver a loguearse
- ✅ Impresión estilo Zeiss IOLMaster 700
- ✅ Cambio de contraseña desde Mi Perfil
- ✅ Alertas clínicas por módulo
- ✅ Modo oscuro automático · Responsive

---

## Stack técnico

- HTML5 + CSS3 + JavaScript vanilla — sin frameworks
- [Tabler Icons](https://tabler.io/icons)
- [Supabase](https://supabase.com) — auth + PostgreSQL
- Kane 2020 — implementación matemática propia (Kane et al., JCRS 2016)
- Constantes A: fuente ULIB (User Group for Laser Interference Biometry)

---

## Base de datos — Supabase

Ejecutar en **SQL Editor** antes del primer uso:

```sql
create table public.medicos (
  id uuid references auth.users on delete cascade primary key,
  nombre text not null,
  apellido text not null,
  matricula text not null,
  institucion text,
  ciudad text,
  created_at timestamp with time zone default now()
);

create table public.calculos (
  id bigint generated always as identity primary key,
  medico_id uuid references public.medicos(id) on delete cascade not null,
  paciente_nombre text,
  paciente_hc text,
  paciente_dob date,
  modulo integer not null,
  datos_od jsonb,
  datos_oi jsonb,
  created_at timestamp with time zone default now()
);

alter table public.medicos enable row level security;
alter table public.calculos enable row level security;

create policy "Médico ve su perfil" on public.medicos
  for all using (auth.uid() = id);

create policy "Médico ve sus cálculos" on public.calculos
  for all using (auth.uid() = medico_id);
```

---

## Deploy

### Vercel (recomendado — 2 minutos)

1. Forkeá este repositorio
2. [vercel.com](https://vercel.com) → Sign up with GitHub → Add New Project → `liometria` → Deploy
3. Supabase → Authentication → URL Configuration → agregar la URL de Vercel en Site URL

### Local

```bash
git clone https://github.com/tu-usuario/liometria.git
cd liometria
python3 -m http.server 8080
# Abrir http://localhost:8080
```

> No abrir `index.html` directamente con `file://` — Supabase requiere origen HTTP válido.

---

## Roadmap

- [ ] Agregar más LIOs del mercado latinoamericano
- [ ] Exportar reporte a PDF directamente
- [ ] Visualizador SVG de eje tórico en tiempo real
- [ ] Calculador de SIA personal acumulado por caso
- [ ] Fórmulas post-queratoplastia (DSAEK, DMEK)
- [ ] PWA — instalable en móvil como app nativa
- [ ] Panel de estadísticas para la SPO

---

## Contribuciones y feedback

Para la comunidad oftalmológica paraguaya. Sugerencias, errores, nuevos LIOs o módulos:

📧 liometria@gmail.com · [Abrir un Issue](https://github.com/tu-usuario/liometria/issues)

---

## Advertencia clínica

> **LIOmetría es una herramienta de asistencia clínica.** Los resultados son orientativos y no reemplazan el juicio clínico del médico tratante. La responsabilidad de la decisión quirúrgica final es exclusiva del oftalmólogo a cargo del paciente.
>
> Las constantes A provienen de ULIB y datos de fabricante. Para máxima precisión se recomienda optimización personalizada con casos propios del cirujano.

---

## Licencia

MIT License — libre para usar, modificar y distribuir con atribución.

---

<div align="center">
  <p>Desarrollado para la comunidad oftalmológica de Paraguay</p>
  <p><strong>LIOmetría v1.2</strong> · 2025</p>
</div>
