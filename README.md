# 👁 LIOmetría

**Calculador de Lentes Intraoculares con Inteligencia Artificial para Oftalmólogos**

> Desarrollado en Paraguay, para oftalmólogos de Paraguay.

---

## ¿Qué es LIOmetría?

LIOmetría es una aplicación web gratuita para el cálculo de potencia de lentes intraoculares (LIO) diseñada específicamente para el contexto clínico del oftalmólogo paraguayo. Combina fórmulas clásicas de 3ª a 5ª generación con un módulo de inteligencia artificial (estilo Kane/RBF) para asistir en la toma de decisiones preoperatorias en cirugía de catarata.

La app corre completamente en el navegador — sin instalación, sin servidores propios, sin datos clínicos que salgan del dispositivo del médico.

---

## Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Estándar** | Cálculo para ojos sin cirugía corneal previa. SRK/T, Hoffer Q, Holladay 1 y 2, Haigis, Barrett Universal II, EVO 2.0, PEARL-DGS + IA |
| **Tórico** | Selección de LIO tórico con cálculo vectorial, corrección de astigmatismo corneal posterior (ACP) y eje de implantación |
| **Post-LASIK/PRK** | Ajuste de K efectiva post-cirugía refractiva. Barrett True-K, Haigis-L, Shammas, Masket — con y sin historial previo |
| **Queratocono** | Compensación de sobreestimación en córneas ectásicas. Estadificación Amsler-Krumeich. Kane KC, Barrett True-K KC |
| **Queratotomía Radiada (KR)** | Manejo de K plana y hipermetropización progresiva. Double-K Holladay, ASCRS KR, cálculo de variación diurna |

---

## Fórmulas incluidas

### Estándar
- SRK/T (3ª generación)
- Hoffer Q (3ª generación)
- Holladay 1 (3ª generación)
- Haigis (4ª generación)
- Barrett Universal II (5ª generación)
- EVO 2.0 (5ª generación)
- PEARL-DGS
- Holladay 2
- **IA (Kane/RBF style)** — requiere API Key de Anthropic

### Tórico
- Barrett Tórico (vectorial + ACP)
- EVO Tórico
- Holladay 2 Tórico
- **IA Tórico** — potencia esférica + cilíndrica + eje + astigmatismo residual estimado

### Post-LASIK/PRK
- Barrett True-K (con y sin historial)
- Haigis-L
- Shammas (con y sin historial)
- Masket
- **IA Post-LASIK**

### Queratocono
- Kane KC
- Barrett True-K KC
- Haigis (KC)
- Hoffer Q (KC)
- **IA Queratocono**

### Queratotomía Radiada
- Barrett True-K (KR)
- Double-K Holladay
- Haigis-L (KR)
- ASCRS KR formula
- **IA KR**

---

## Parámetros biométricos

| Parámetro | Descripción | Obligatorio |
|-----------|-------------|-------------|
| AL | Longitud axial (mm) | ✅ |
| K1 | Queratometría plana (D) | ✅ |
| K2 | Queratometría curva (D) | ✅ |
| Eje K2 | Eje del meridiano curvo (°) | Tórico |
| ACD | Profundidad de cámara anterior (mm) | Haigis / EVO |
| LT | Grosor del cristalino (mm) | Barrett / Holladay 2 |
| CCT | Grosor corneal central (µm) | Opcional |
| WTW | Diámetro corneal blanco-blanco (mm) | Opcional |
| Constante A | Constante del LIO a implantar | ✅ |
| Objetivo Rx | Refracción postoperatoria objetivo (D) | ✅ |

---

## Módulo de IA

La función de IA utiliza la API de Anthropic (Claude) para calcular la potencia recomendada combinando óptica teórica, regresión estadística y ajuste por inteligencia artificial — de forma análoga a las fórmulas Kane y Hill-RBF.

**Cada médico configura su propia API Key** desde [console.anthropic.com](https://console.anthropic.com). La clave se guarda únicamente en el navegador local del usuario (localStorage) y nunca es transmitida a ningún servidor propio de LIOmetría.

Las fórmulas clásicas funcionan completamente sin API Key.

---

## Características

- ✅ Un solo archivo HTML — sin dependencias, sin instalación
- ✅ Registro de médico con datos profesionales (matrícula, institución, ciudad)
- ✅ Cálculo independiente por ojo (OD / OI)
- ✅ Resultado imprimible por ojo con tabla comparativa de fórmulas
- ✅ Historial de cálculos por médico (almacenado en el navegador)
- ✅ Recomendación automática de fórmula según longitud axial
- ✅ Alertas clínicas por módulo (variación diurna en KR, objetivo en KC, etc.)
- ✅ Modo oscuro automático (según preferencia del sistema)
- ✅ Responsive — funciona en desktop y tablet
- ✅ Sin servidores propios — los datos clínicos nunca salen del dispositivo

---

## Deploy

### Opción rápida — Vercel (recomendado)

1. Forkeá este repositorio
2. Entrá a [vercel.com](https://vercel.com) → **Sign up with GitHub**
3. **Add New Project** → seleccioná `liometria`
4. Click **Deploy** — listo en ~30 segundos

### Opción manual — cualquier hosting estático

Subí el archivo `index.html` a cualquier servicio de hosting estático:
- Vercel, Netlify, GitHub Pages, Cloudflare Pages
- No requiere backend ni base de datos

---

## Uso local

```bash
git clone https://github.com/tu-usuario/liometria.git
cd liometria
# Abrí index.html directamente en el navegador
open index.html
```

No requiere `npm install`, servidor local, ni ninguna dependencia adicional.

---

## Configuración de la API Key (IA)

1. Creá una cuenta en [console.anthropic.com](https://console.anthropic.com)
2. Generá una API Key (`sk-ant-...`)
3. En LIOmetría → **Mi Perfil** → sección **API Key de Anthropic**
4. Pegá la clave y hacé click en **Guardar**
5. Usá **Probar conexión** para verificar que funciona

El costo aproximado por cálculo con IA es menor a USD 0.01.

---

## Advertencia clínica

> **LIOmetría es una herramienta de asistencia clínica.** Los resultados son orientativos y no reemplazan el juicio clínico del médico tratante. La responsabilidad de la decisión quirúrgica final es exclusiva del oftalmólogo a cargo del paciente.
>
> Las fórmulas implementadas son aproximaciones basadas en los algoritmos publicados en la literatura. Para casos complejos se recomienda correlacionar con calculadores validados como ASCRS IOL Power Calculator, Barrett Toric Calculator o Kane Formula.

---

## Stack técnico

- HTML5 + CSS3 + JavaScript vanilla — sin frameworks
- [Tabler Icons](https://tabler.io/icons) — iconografía
- [Anthropic API](https://docs.anthropic.com) — módulo de IA (claude-sonnet-4)
- localStorage — persistencia de datos en el navegador

---

## Roadmap

- [ ] LIO tórico con visualizador de eje en tiempo real (SVG)
- [ ] Exportar resultado a PDF con membrete del médico
- [ ] Calculador de SIA personal (historial de casos)
- [ ] Fórmulas post-DSAEK / post-queratoplastia
- [ ] Sincronización en la nube (opcional, opt-in)
- [ ] App móvil (PWA)

---

## Contribuciones y feedback

Este proyecto nació para la comunidad oftalmológica paraguaya. Si sos oftalmólogo y encontrás errores, tenés sugerencias clínicas, o querés proponer nuevas fórmulas o módulos, abrí un [Issue](https://github.com/tu-usuario/liometria/issues) o escribí a:

📧 liometria@gmail.com

---

## Licencia

MIT License — libre para usar, modificar y distribuir con atribución.

---

<div align="center">
  <p>Desarrollado con fines académicos y clínicos para la comunidad oftalmológica de Paraguay</p>
  <p><strong>LIOmetría v1.0</strong> · 2025</p>
</div>
