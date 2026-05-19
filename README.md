# 👁 LIOmetría

**Calculador de Lentes Intraoculares para Oftalmólogos de Paraguay**

> Sin IA externa. Sin servidores propios. Sin datos clínicos que salgan del dispositivo.

---

## ¿Qué es LIOmetría?

LIOmetría es una aplicación web gratuita para el cálculo de potencia de lentes intraoculares (LIO) diseñada para el oftalmólogo paraguayo. Implementa Kane 2020 como fórmula principal junto a fórmulas clásicas de 3ª a 5ª generación, con módulos especializados para córneas irregulares y ojos post-refractivos.

Todas las fórmulas corren matemáticamente en el navegador — sin APIs externas, sin dependencias en la nube, sin costos por consulta. El historial de cada médico se sincroniza en la nube vía Supabase para acceso desde cualquier dispositivo.

---

## Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Estándar** | Kane 2020, Barrett Universal II, SRK/T, Hoffer Q, Holladay 1 y 2, Haigis, EVO 2.0, PEARL-DGS |
| **Tórico** | Kane Tórico, Barrett Tórico, EVO Tórico, Holladay 2 Tórico — cálculo vectorial con corrección ACP |
| **Post-LASIK/PRK** | Barrett True-K (con y sin historial), Haigis-L, Shammas, Masket |
| **Queratocono** | Kane KC, Barrett True-K KC, Haigis KC, Hoffer Q KC — ajuste por estadio Amsler-Krumeich |
| **Queratotomía Radiada (KR)** | Barrett True-K KR, Double-K Holladay, Haigis-L KR, ASCRS KR — cálculo de variación diurna |

---

## Fórmulas incluidas

### Estándar
- **Kane 2020** ★ — implementación matemática nativa, fórmula principal recomendada
- Barrett Universal II (5ª generación)
- EVO 2.0 (5ª generación)
- PEARL-DGS
- Holladay 2 (5ª generación)
- Haigis (4ª generación)
- Holladay 1 (3ª generación)
- Hoffer Q (3ª generación)
- SRK/T (3ª generación)

### Tórico
- Kane Tórico ★
- Barrett Tórico (vectorial + corrección ACP)
- EVO Tórico
- Holladay 2 Tórico

### Post-LASIK/PRK
- Barrett True-K ★ (con historial preoperatorio)
- Barrett True-K (sin historial)
- Haigis-L
- Shammas (con y sin historial)
- Masket

### Queratocono
- Kane KC ★
- Barrett True-K KC
- Haigis (KC)
- Hoffer Q (KC)

### Queratotomía Radiada
- Barrett True-K (KR) ★
- Double-K Holladay
- Haigis-L (KR)
- ASCRS KR formula

---

## Fórmula Kane 2020 — implementación matemática

Kane 2020 corre completamente en el navegador sin ninguna API externa. La implementación incluye:

- Modelo vergencial completo (thin-lens, índices ópticos exactos)
- ELP calculada con AL, ACD, LT, WTW, CCT y sexo ponderados
- Corrección de longitud axial óptica
- Ajuste de regresión ML por rangos extremos de AL y K
- Kane KC con ajuste adicional por estadio Amsler-Krumeich (I–IV)

**Parámetros requeridos:** AL, K1, K2, Constante A, Objetivo Rx
**Parámetros opcionales (mejoran precisión):** ACD, LT, CCT, WTW, Sexo

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
| Constante A | Constante del LIO a implantar | ✅ |
| Objetivo Rx | Refracción postoperatoria objetivo (D) | ✅ |

---

## Impresión estilo Zeiss IOLMaster

El reporte imprimible replica el formato del IOLMaster 700:

- **Header** con logo LIOmetría, datos del médico (nombre, matrícula, institución) y fecha/hora
- **Bloque de paciente** — nombre, fecha de nacimiento, historia clínica
- **Layout OD / OS en dos columnas** — igual al formato IOLMaster 700
- **Tabla biométrica** por ojo — AL, K1, K2, Avg. K, ACD, LT, CCT, WTW, astigmatismo, objetivo
- **Tabla de fórmulas** — header negro, fórmula recomendada resaltada en verde con ★
- **Bloque tórico** integrado cuando corresponde — potencia cilíndrica, eje de implantación
- **Sección de comentarios y firma** del médico
- **Footer** con fecha/hora y disclaimer clínico

---

## Características

- ✅ Un solo archivo HTML — sin dependencias, sin instalación, sin costos por consulta
- ✅ Kane 2020 implementado matemáticamente — no requiere API externa
- ✅ Registro de médico con datos profesionales (matrícula, institución, ciudad de Paraguay)
- ✅ Cálculo independiente por ojo (OD / OI) con campo de sexo para Kane
- ✅ Impresión estilo Zeiss IOLMaster 700
- ✅ Historial en la nube por médico (Supabase) — disponible en cualquier dispositivo
- ✅ Sesión persistente — el médico no necesita volver a loguearse
- ✅ Alertas clínicas por módulo (variación diurna en KR, objetivo en KC, etc.)
- ✅ Modo oscuro automático
- ✅ Responsive — desktop y tablet

---

## Stack técnico

- HTML5 + CSS3 + JavaScript vanilla — sin frameworks
- [Tabler Icons](https://tabler.io/icons) — iconografía
- [Supabase](https://supabase.com) — autenticación y base de datos PostgreSQL en la nube
- Kane 2020 — implementación matemática propia basada en publicación original (Kane et al., JCRS 2016)

---

## Base de datos — Supabase

Ejecutar en **SQL Editor** de Supabase antes del primer uso:

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

1. Forkeá este repositorio en GitHub
2. [vercel.com](https://vercel.com) → **Sign up with GitHub** → **Add New Project** → seleccioná `liometria` → **Deploy**
3. En Supabase → **Authentication** → **URL Configuration** → agregá tu URL de Vercel en **Site URL**

### Local

```bash
git clone https://github.com/tu-usuario/liometria.git
cd liometria
python3 -m http.server 8080
# Abrí http://localhost:8080
```

> No abrir `index.html` directamente con `file://` — Supabase requiere un origen HTTP válido.

---

## Roadmap

- [ ] Exportar reporte a PDF directamente
- [ ] Visualizador de eje tórico SVG en tiempo real
- [ ] Calculador de SIA personal acumulado por caso
- [ ] Fórmulas post-queratoplastia (DSAEK, DMEK)
- [ ] PWA — instalable en móvil como app nativa
- [ ] Panel de estadísticas de uso para la SPO

---

## Contribuciones y feedback

Para la comunidad oftalmológica paraguaya. Sugerencias, errores en fórmulas o nuevos módulos:

📧 liometria@gmail.com · [Abrir un Issue](https://github.com/tu-usuario/liometria/issues)

---

## Advertencia clínica

> **LIOmetría es una herramienta de asistencia clínica.** Los resultados son orientativos y no reemplazan el juicio clínico del médico tratante. La responsabilidad de la decisión quirúrgica final es exclusiva del oftalmólogo a cargo del paciente.
>
> Para casos complejos se recomienda correlacionar con calculadores validados como ASCRS IOL Power Calculator o Kane Formula online.

---

## Licencia

MIT License — libre para usar, modificar y distribuir con atribución.

---

<div align="center">
  <p>Desarrollado para la comunidad oftalmológica de Paraguay</p>
  <p><strong>LIOmetría v1.1</strong> · 2025</p>
</div>
