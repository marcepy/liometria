# 👁 LIOmetría

**Calculador de Lentes Intraoculares para Oftalmólogos de Paraguay**

> Sin IA externa. Sin servidores propios. Sin datos clínicos que salgan del dispositivo.

---

## ¿Qué es LIOmetría?

LIOmetría es una aplicación web gratuita para el cálculo de potencia de lentes intraoculares (LIO) diseñada para el oftalmólogo paraguayo. Implementa Kane 2020 como fórmula principal junto a fórmulas clásicas de 3ª a 5ª generación, con módulos especializados para córneas irregulares y ojos post-refractivos.

Incluye una base de datos de 26 LIOs de los principales fabricantes del mercado (Alcon, J&J, Zeiss, B+L, Hoya, Rayner), con disponibilidad real de potencias por escalones (0.5D esférico, 0.25D cilíndrico tórico).

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
- **Kane 2020** ★ — con calibración empírica Nivel 1 (validado vs iolformula.com)
- Barrett Universal II (5ª gen)
- EVO 2.0 (5ª gen)
- PEARL-DGS
- Holladay 2 (5ª gen)
- Haigis (4ª gen)
- Holladay 1 (3ª gen)
- Hoffer Q (3ª gen)
- SRK/T (3ª gen)

### Vertex factors por fórmula (calibrados vs calculadoras oficiales)
- Kane: **0.640** — Barrett: **0.720** — resto: **0.700**

### Confiabilidad por rango de AL

| Rango AL | Confiabilidad | Recomendación |
|----------|--------------|---------------|
| 21–25 mm | ✅ Error ≤ 0.25D | Usar con confianza |
| 25–26 mm | ⚠️ Error 0.5–1.0D | Corroborar con ASCRS |
| > 26 mm  | ❌ Error > 1.0D | Derivar a Barrett APACRS o Kane iolformula.com |

---

## Base de datos de LIOs — 26 modelos de 6 fabricantes

| Fabricante | Modelos incluidos |
|------------|------------------|
| **Alcon** | AcrySof IQ SN60WF · AcrySof SA60AT · AcrySof MA60AC · Toric SN6AT · PanOptix TFNT00 · PanOptix Toric · Clareon · Clareon Toric |
| **Johnson & Johnson** | Tecnis 1-Piece ZCB00 · Tecnis Toric ZCT · Symfony ZXR00 · Multifocal ZMB00 · **Sensar 1 AAB00** · **Sensar AR40e** |
| **Carl Zeiss** | CT LUCIA 621P · CT LUCIA 611P · CT ASPHINA 409MP · AT TORBI 709MP · AT LISA tri 839MP |
| **Bausch + Lomb** | enVista MX60 · Akreos AO MI60 · SofPort LI61AO |
| **Hoya** | Vivinex XY1 · Vivinex Toric XY1A |
| **Rayner** | RayOne EMV · RayOne Toric |

Cada LIO incluye: constante A (fuente ULIB), ACD, SF, pACD, constantes Haigis a0/a1/a2 (donde corresponde), rango de potencias y notas clínicas.

### Disponibilidad de potencias
- **Esférico**: escalones de **0.5D** — muestra potencia calculada, disponible más cercana y adyacentes
- **Cilíndrico tórico**: escalones de **0.25D** — muestra el cilindro LIO disponible más cercano

---

## Parámetros biométricos

| Parámetro | Descripción | Requerido |
|-----------|-------------|-----------|
| AL | Longitud axial (mm) | ✅ |
| K1 | Queratometría plana (D) | ✅ |
| K2 | Queratometría curva (D) | ✅ |
| Eje K2 | Meridiano curvo (°) — K1 se calcula automáticamente | Tórico |
| ACD | Profundidad cámara anterior (mm) | Haigis / EVO / Kane |
| LT | Grosor del cristalino (mm) | Kane / Holladay 2 |
| CCT | Grosor corneal central (µm) | Kane |
| WTW | Diámetro corneal blanco-blanco (mm) | Kane |
| Sexo | Masculino / Femenino | Kane |
| Constante A | Constante del LIO | ✅ (auto con selector) |
| Objetivo Rx | Refracción objetivo (D) | ✅ |

---

## Microscopía especular

Sección colapsable por ojo (OD y OI independientes) con los siguientes campos:

| Campo | Descripción | Alertas automáticas |
|-------|-------------|---------------------|
| **CD** | Densidad celular (cél/mm²) | ≥2000 normal · 1500–2000 moderado · 1000–1500 alto · <1000 contraindicación relativa |
| **CV** | Coeficiente de variación (%) | ≤33% normal · 33–40% polimegatismo leve · >40% severo |
| **6A** | Hexagonalidad (%) | ≥60% normal · 40–60% pleomorfismo leve · <40% severo |
| **CCT esp.** | Paquimetría especular (µm) | — |

Al completar los datos aparece un resumen con evaluación global del endotelio (verde / naranja / rojo) y recomendación clínica. Los datos se guardan en Supabase y se restauran al cargar un caso del historial.

---

## Datos del paciente

- Apellido y nombre
- Fecha de nacimiento
- HC / Cédula
- **Observaciones** — campo libre de texto para antecedentes, diagnóstico, indicación quirúrgica o cualquier nota clínica relevante

Las observaciones se guardan con el cálculo, aparecen como preview en el historial y se incluyen en el reporte impreso.

---

## Validación de datos biométricos

Al calcular, la app verifica automáticamente:

- **Datos obligatorios** (AL, K1, K2, constante A) — bloquea el cálculo si faltan
- **Datos opcionales** (ACD, LT, CCT, WTW) — calcula con valores promedio e indica qué fórmulas se ven afectadas con badges "Sin ACD" o "Usa valores promedio"
- **Alertas clínicas automáticas**:
  - AL > 26mm → banner rojo con links directos a Barrett APACRS, Kane iolformula.com y ASCRS
  - AL < 22.5mm + ACD < 2.5mm → banner amarillo indicando corrección Kane aplicada
  - ΔK > 3.0D → sugerencia de LIO tórico
  - ACD < 2.5mm → verificar medición

---

## Historial de cálculos

### Detección automática de duplicados
Al guardar, la app verifica si ya existe un cálculo para el mismo paciente:
- **Mismo HC** → siempre considera duplicado
- **Mismo nombre + mismo módulo** → considera duplicado

Si detecta un duplicado, muestra un modal con tres opciones:
- **Actualizar existente** — reemplaza el registro anterior y actualiza el timestamp
- **Guardar como nuevo** — crea un registro paralelo
- **Cancelar** — no hace nada

### Cargar desde historial
Clic en cualquier registro restaura automáticamente:
- Datos del paciente (nombre, HC, fecha de nacimiento, observaciones)
- Biometría completa OD y OI
- Módulo de cálculo
- LIO seleccionado (fabricante, modelo, constante A)
- Microscopía especular (si fue ingresada)
- Selector de ojo(s) a calcular

### Eliminar registros
Cada registro del historial tiene un botón **🗑 Eliminar** visible. Al hacer clic aparece un modal de confirmación con el nombre del paciente antes de proceder.

---

## Formatos de impresión

Dos modos accesibles desde los botones de resultado:

### Modo A — Por fórmula
- Estilo IOLMaster 700
- OD y OS en columnas lado a lado dentro de cada bloque de fórmula
- Grid 3×N de bloques, cada uno con sub-columnas OD (verde) y OS (rosa)
- 5 potencias por fórmula + línea Emetropía
- Constantes visibles: LF/DF (Barrett), A (SRK/T), pACD (Hoffer Q), SF (Holladay), a0/a1/a2 (Haigis)

### Modo B — Comparar LIOs
- Tabla horizontal con todos los LIOs esféricos de la base de datos
- Filas = LIO con fabricante y Cte-A
- Columnas = fórmulas seleccionadas (hasta 3), cada una con OD IOL(D) · OD Res.SE · OS IOL(D) · OS Res.SE
- LIO seleccionado aparece primero marcado con ★ en verde
- Res.SE coloreado en verde cuando está dentro de ±0.25D del objetivo

Ambos modos incluyen biometría completa, microscopía especular (si fue ingresada) y observaciones del paciente.

---

## Mi Perfil

- Nombre, apellido, matrícula, institución, ciudad
- Correo electrónico (no editable)
- Cambio de contraseña con confirmación (vía Supabase Auth)

---

## Características técnicas

- ✅ Un solo archivo HTML — sin instalación, sin dependencias, sin costos por consulta
- ✅ Kane 2020 con calibración Nivel 1 (validado vs iolformula.com y ASCRS)
- ✅ Vertex factors específicos por fórmula (Kane 0.64 / Barrett 0.72)
- ✅ 26 LIOs de 6 fabricantes con constantes verificadas (ULIB)
- ✅ Disponibilidad real de potencias (0.5D esférico · 0.25D cilíndrico)
- ✅ Detección automática de duplicados al guardar
- ✅ Botón Eliminar con modal de confirmación
- ✅ Microscopía especular con alertas clínicas automáticas
- ✅ Campo Observaciones libre por paciente
- ✅ Historial en la nube (Supabase) — disponible en cualquier dispositivo
- ✅ Sesión persistente — sin volver a loguearse
- ✅ Dos modos de impresión estilo IOLMaster 700
- ✅ Alertas de derivación para AL > 26mm con links directos
- ✅ Validación biométrica con badges por fórmula
- ✅ Modo oscuro automático · Responsive · Mobile-friendly

---

## Stack técnico

- HTML5 + CSS3 + JavaScript vanilla — sin frameworks
- [Tabler Icons](https://tabler.io/icons)
- [Supabase](https://supabase.com) — auth + PostgreSQL
- Kane 2020 — implementación matemática propia con calibración empírica
- Constantes A: fuente ULIB (User Group for Laser Interference Biometry)

---

## Base de datos — Supabase

Ejecutar en **SQL Editor** antes del primer uso:

```sql
-- Tablas principales
CREATE TABLE public.medicos (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL,
  apellido text NOT NULL,
  matricula text NOT NULL,
  institucion text,
  ciudad text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.calculos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medico_id uuid REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  paciente_nombre text,
  paciente_hc text,
  paciente_dob date,
  modulo integer NOT NULL,
  datos_od jsonb,
  datos_oi jsonb,
  iol_brand text,
  iol_model text,
  selected_formulas jsonb,
  spec_od jsonb,
  spec_oi jsonb,
  observaciones text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médico ve su perfil" ON public.medicos
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Médico puede insertar su perfil" ON public.medicos
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Médico ve sus cálculos" ON public.calculos
  FOR ALL USING (auth.uid() = medico_id);
```

### Migración (base de datos existente)

Si ya tenés la tabla creada, ejecutar solo:

```sql
ALTER TABLE public.calculos
  ADD COLUMN IF NOT EXISTS iol_brand         text,
  ADD COLUMN IF NOT EXISTS iol_model         text,
  ADD COLUMN IF NOT EXISTS selected_formulas jsonb,
  ADD COLUMN IF NOT EXISTS spec_od           jsonb,
  ADD COLUMN IF NOT EXISTS spec_oi           jsonb,
  ADD COLUMN IF NOT EXISTS observaciones     text;
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

## Referencias de las fórmulas

- **SRK/T** — Retzlaff et al., J Cataract Refract Surg. 1990;16(3):333-340
- **Hoffer Q** — Hoffer KJ, J Cataract Refract Surg. 1993;19(6):700-712
- **Holladay 1** — Holladay et al., J Cataract Refract Surg. 1988;14(1):17-24
- **Haigis** — Haigis et al., Graefes Arch Clin Exp Ophthalmol. 2000;238(9):765-773
- **Barrett Universal II** — Barrett GD, J Cataract Refract Surg. 1993;19(6):713-720
- **Kane 2020** — Kane et al., J Cataract Refract Surg. 2016;42(10):1490-1500
- **EVO 2.0** — Yeo et al., Eye (Lond). 2021;35(6):1705-1711
- **PEARL-DGS** — Debellemanière et al., Am J Ophthalmol. 2021;232:58-69
- **Constantes A** — ULIB (iolcon.org)

---

## Roadmap

- [ ] Módulo de optimización de constante A con casos propios del cirujano
- [ ] Implementación fiel de PEARL-DGS (código open-source GitHub)
- [ ] Fórmulas con inteligencia artificial (línea de Kane, Hill-RBF, EVO)
- [ ] Modelo de regresión entrenado con datos de la población paraguaya
- [ ] Fórmulas post-queratoplastia (DSAEK, DMEK)
- [ ] PWA — instalable en móvil como app nativa
- [ ] Exportar reporte directamente a PDF

---

## Contribuciones y feedback

Para la comunidad oftalmológica paraguaya. Sugerencias, errores, nuevos LIOs o módulos:

📧 liometria@gmail.com

---

## Advertencia clínica

> **LIOmetría es una herramienta de asistencia clínica.** Los resultados son orientativos y no reemplazan el juicio clínico del médico tratante. La responsabilidad de la decisión quirúrgica final es exclusiva del oftalmólogo a cargo del paciente.
>
> Las fórmulas Kane y Barrett son aproximaciones — sus algoritmos completos no están publicados. Para ojos con AL > 26mm, verificar obligatoriamente con [Barrett APACRS](https://calc.apacrs.org/barrett_universal2105/) o [Kane iolformula.com](https://www.iolformula.com).
>
> Las constantes A provienen de ULIB y datos de fabricante. Para máxima precisión se recomienda optimización personalizada con casos propios del cirujano.

---

## Licencia

MIT License — libre para usar, modificar y distribuir con atribución.

---

<div align="center">
  <p>Desarrollado para la comunidad oftalmológica de Paraguay</p>
  <p><strong>LIOmetría v1.3</strong> · 2026</p>
</div>
