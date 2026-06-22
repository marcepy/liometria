# LIOmetría v2.2

Calculador de lentes intraoculares (LIO) para oftalmólogos de Paraguay. Permite calcular la potencia del LIO con múltiples fórmulas de cuarta y quinta generación, con soporte para ojos especiales (post-LASIK, queratocono, queratotomía radiada).

---

## Características

- **5 módulos de cálculo:** Estándar, Tórico, Post-LASIK/PRK, Queratocono, Queratotomía Radiada (KR)
- **9 fórmulas en modo estándar:** Kane 2020, Barrett Universal II, EVO 2.0, PEARL-DGS, Holladay 1 y 2, Haigis, Hoffer Q, SRK/T
- **Cálculo bilateral** (OD + OI) con biometría independiente por ojo
- **Microscopía especular** con alertas automáticas por densidad celular
- **Historial de pacientes** con base de datos en la nube (Supabase)
- **Seguimiento postoperatorio** con error de predicción por fórmula (compatible PEARL-DGS dataset)
- **Reporte imprimible** configurable, estilo Zeiss IOLMaster
- **Simulación de fórmulas** con biometría sintética y comparativa vs. literatura publicada
- **Dark mode** nativo (respeta `prefers-color-scheme`)
- **Acceso por rol médico** con autenticación segura (Supabase Auth)

---

## Estructura del proyecto

```
liometria/
├── index.html          # Estructura HTML
├── .gitignore
├── css/
│   └── styles.css      # Estilos y temas (light/dark)
└── js/
    ├── env.example.js  # Plantilla de credenciales (va al repo)
    ├── env.js          # Credenciales reales (gitignored — NO commitear)
    ├── config.js       # Supabase + estado global + constantes
    ├── auth.js         # Login, registro, logout, sesión
    ├── ui.js           # Helpers base (gv, gn, showTab, setMod…)
    ├── formulas.js     # Óptica + fórmulas IOL
    ├── calcular.js     # Orquestación calcAll + rendering resultados
    ├── historial.js    # CRUD historial (Supabase)
    ├── perfil.js       # Perfil médico + cambio de contraseña
    ├── reporte.js      # Generador HTML para impresión + clearAll
    ├── iol-selector.js # Selector de LIO (catálogo + filtros)
    ├── especular.js    # Microscopía especular (CD, CV, 6A)
    ├── print-modal.js  # Modal de configuración del reporte
    ├── postop.js       # Seguimiento postoperatorio + error de predicción
    ├── resultados.js   # renderResults + exportación CSV PEARL-DGS
    ├── simulacion.js   # Simulación con población sintética
    └── main.js         # Init: setMod, initIOLSelector, initSession
```

---

## Uso

### Requisitos

- Navegador moderno con JavaScript habilitado (Chrome 90+, Firefox 88+, Safari 14+)
- Conexión a internet (para autenticación y sincronización con Supabase)

### Instalación local

```bash
git clone https://github.com/tu-usuario/liometria.git
cd liometria
```

Abrí `index.html` directamente en el navegador, o servilo con cualquier servidor estático:

```bash
# Con Python
python3 -m http.server 8080

# Con Node.js
npx serve .
```

Ingresá a `http://localhost:8080`.

### Primer uso

1. Creá una cuenta con tu matrícula profesional en la pantalla de login
2. Confirmá el correo electrónico (revisar bandeja de entrada)
3. Ingresá y completá los datos biométricos del paciente
4. Seleccioná el módulo y las fórmulas a calcular
5. Hacé clic en **Calcular LIO**

---

## Módulos de cálculo

| Módulo | Fórmulas disponibles | Indicación |
|--------|---------------------|------------|
| **Estándar** | Kane, Barrett II, EVO 2.0, PEARL-DGS, Holladay 1/2, Haigis, Hoffer Q, SRK/T | Ojos sin cirugía corneal previa |
| **Tórico** | Kane Tórico, Barrett Tórico, EVO Tórico, Holladay 2 Tórico | Astigmatismo corneal > 1.5D |
| **Post-LASIK/PRK** | Barrett True-K, Haigis-L, Shammas, Masket | Cirugía refractiva previa |
| **Queratocono** | Kane KC, Barrett True-K KC, Haigis KC, Hoffer Q KC | Ectasia corneal estadios I–IV (Amsler-Krumeich) |
| **KR** | Barrett True-K KR, Double-K Holladay, Haigis-L KR, ASCRS KR | Queratotomía radiada |

---

## Variables biométricas

| Campo | Unidad | Rango válido | Notas |
|-------|--------|-------------|-------|
| AL (longitud axial) | mm | 14 – 36 | Obligatorio |
| K1 plana / K2 curva | D | 35 – 55 | Obligatorio |
| Eje K2 | ° | 1 – 180 | Requerido para módulo tórico |
| ACD (profundidad CA) | mm | 1.5 – 5 | Requerido para Haigis, EVO, PEARL-DGS |
| LT (grosor del cristalino) | mm | 2 – 7 | Mejora precisión en Kane, Barrett, EVO |
| CCT (paquimetría central) | µm | 400 – 700 | Requerido para Kane |
| WTW (blanco a blanco) | mm | 9 – 14 | Requerido para Kane |
| Constante A | — | 115 – 125 | Específica del modelo de LIO |
| Objetivo Rx | D | -3 – +0.5 | Default 0.00 (emetropía) |

---

## Configuración (Supabase)

Las credenciales **no están hardcodeadas** en el código. Se cargan desde `js/env.js`, que está en `.gitignore` y **nunca se sube al repositorio**.

### Setup inicial

```bash
cp js/env.example.js js/env.js
```

Editá `js/env.js` con tus propias credenciales de Supabase (Settings → API en el dashboard):

```js
window.ENV = {
  SUPABASE_URL: 'https://tu-proyecto.supabase.co',
  SUPABASE_KEY: 'tu-clave-anon-aqui'
};
```

> ⚠️ La clave `anon` es pública por diseño en Supabase, pero asegurate de tener **Row Level Security (RLS) habilitado** en todas las tablas antes de ir a producción.

### Tablas requeridas en Supabase

**`medicos`**
```sql
id          uuid primary key references auth.users
nombre      text not null
apellido    text not null
matricula   text not null
institucion text
ciudad      text
```

**`calculos`**
```sql
id              bigserial primary key
medico_id       uuid references medicos(id)
paciente_nombre text
paciente_hc     text
paciente_dob    date
observaciones   text
modulo          int
datos_od        jsonb
datos_oi        jsonb
formulas        text[]
resultados_od   jsonb
resultados_oi   jsonb
postop_od       jsonb
postop_oi       jsonb
created_at      timestamptz default now()
```

### Políticas RLS mínimas

```sql
-- medicos: cada médico solo ve y edita su propio perfil
create policy "medico_own" on medicos
  using (auth.uid() = id);

-- calculos: cada médico solo accede a sus cálculos
create policy "calculos_own" on calculos
  using (auth.uid() = medico_id);
```

---

## Fórmulas — notas de implementación

Las fórmulas implementadas usan la **ecuación vergencial fundamental** con longitud axial efectiva:

```
P = (n_vit / (AL - ELP)) - (n_vit / ((n_corneal / K) - ELP))
```

donde `ELP` (posición efectiva del lente) se predice de forma distinta por cada fórmula.

- **Kane 2020:** 5ª generación, incorpora CCT, sexo y WTW. Corrección no lineal para ojos extremos (AL < 20mm, AL > 26mm).
- **PEARL-DGS:** Implementación de lente gruesa (Debellemanière et al. AJO 2021). Motor de bisección numérica para potencia exacta.
- **Hoffer Q:** Única fórmula validada para AL < 20mm. Incluye corrección para nanoftalmos (AL < 16mm) basada en expansión real de la cámara anterior.
- **SRK/T:** Solo válida para AL ≥ 20mm. Fórmula de referencia histórica de calibración.

> Los coeficientes son aproximaciones calibradas sobre óptica real. Para casos clínicos con AL > 26mm, verificar siempre con la calculadora oficial de Barrett (calc.apacrs.org) o Kane (iolformula.com).

---

## Seguridad

- Autenticación via Supabase Auth (email + contraseña)
- RLS en Supabase: cada médico accede únicamente a sus datos
- Validación de email con regex RFC 5322
- Sanitización de inputs en `innerHTML` mediante `escapeHTML()`
- Perfil pendiente guardado en `sessionStorage` (no persiste entre sesiones)
- Sin almacenamiento de datos de pacientes en el cliente

---

## Limitaciones conocidas

- Las implementaciones de las fórmulas son aproximaciones calibradas sobre óptica real — no son los algoritmos propietarios originales
- Para AL > 26mm, la app muestra una advertencia y recomienda verificar externamente
- La extracción de datos de autorrefractómetro vía foto (módulo postop) depende de disponibilidad del modelo de IA conectado
- Sin soporte offline (requiere conexión para auth y datos)

---

## Feedback y contacto

**liometria@gmail.com**

Para uso exclusivo de oftalmólogos. Los resultados son orientativos — la responsabilidad clínica es del médico tratante.

---

*LIOmetría v2.2 · Paraguay*
