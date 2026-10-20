# Matriz Legal DSS — Especificación para la migración a PHP 8 + MariaDB

Este documento describe qué hace la app actual (Next.js + Postgres) para que pueda reconstruirse dentro de la página de gestión de DSS. Acompaña a:

- `01_schema_mariadb.sql` — estructura de la base en MariaDB.
- `02_datos_mariadb.sql` — todos los datos actuales (se entrega aparte, no está en el repositorio).

La app original sigue disponible como referencia visual en https://matriz-legal-dss-psi.vercel.app hasta que la versión PHP esté lista. El código fuente completo está en https://github.com/dsssebastianfer/MatrizLegalv2.

---

## 1. Cómo cargar la base

1. Crear una base vacía en MariaDB (10.6 o superior), con `utf8mb4`.
2. Ejecutar `01_schema_mariadb.sql` (crea las 7 tablas; si ya existían, las borra).
3. Ejecutar `02_datos_mariadb.sql` (carga los datos dentro de una transacción).
4. Verificar conteos (ver sección 9).

Notas:
- Las fechas/horas (`created_at`, `updated_at`, `eliminado_en`) están en **UTC**. Para mostrar hora de Chile hay que convertir.
- Los IDs son UUID (`CHAR(36)`). Para registros nuevos se puede usar `UUID()` de MariaDB.
- Los valores de los `ENUM` llevan espacios y acentos (ej. `'No aplica'`, `'Crítica'`): hay que usarlos tal cual.

---

## 2. Qué NO se migra

- **Login por correo y la tabla `usuario`**: la app nueva usa el login de DSS.
- **Página "Usuarios"**: ya no es necesaria.
- **Selector "Registrado por"** en las evaluaciones: debe tomarse automáticamente del usuario con sesión iniciada en DSS.

Donde la app guardaba "quién hizo algo", ahora se guarda el **nombre en texto** del usuario de DSS:
- `evaluacion.registrado_por`
- `historial_cambio.usuario_nombre`

---

## 3. Modelo de datos

### `bloque_tematico`
Agrupa las normas en la Matriz (ej. "Seguridad y Salud en el Trabajo"). Se ordenan por `orden`. Hoy son 14 y no se editan desde la app.

### `requisito` — las normas
| Campo | Etiqueta en pantalla | Notas |
|---|---|---|
| `legacy_id` | ID (se muestra como `#12`) | Número correlativo visible. Único. |
| `codigo_normativo` | Código normativo | Ej. "D.S. N° 594/1999, MINSAL". Obligatorio. |
| `nombre_oficial` | Nombre oficial | Obligatorio. |
| `bloque_tematico_id` | Bloque temático | Obligatorio. |
| `estado` | Estado | `Aplica` · `No aplica` · `Derogada` · `Evaluar aplicabilidad`. |
| `aplicabilidad` | Aplicabilidad (por qué aplica o no) | Texto libre. Se muestra también como tooltip sobre el estado. |
| `rango_juridico` | Rango jurídico | `Ley` · `Decreto/Reglamento` · `Norma administrativa`. |
| `nivel_vigilancia` | Nivel de vigilancia | `Alto` · `Medio` · `Bajo`. |
| `prioridad` | Prioridad | `Crítica` · `Alta` · `Media` · `Baja`. |
| `descripcion` | De qué se trata | |
| `requisito_articulo_clave` | Requisito o artículo clave (orientativo) | |
| `fuente_a_verificar` | Fuente a verificar | Si empieza con `http`, se muestra como **enlace clickeable** (abre en pestaña nueva). |
| `como_demostrar_cumplimiento` | Cómo demostrar cumplimiento (orientativo) | |
| `frecuencia_revision` | Frecuencia de revisión | Texto libre. |
| `organismo_fiscalizador` | Organismo fiscalizador | |
| `norma_madre_id` | Norma madre | Otra norma de la que depende (opcional). |
| `tipo_relacion` | Tipo de relación | `Principal` (por defecto) · `Modifica` · `Reglamenta` · `Complementa` · `Libro` · `Sub-parte` · `Reemplazada por` · `Transición`. |
| `eliminado_en` | — | Borrado suave (ver 5.4). |

### `requisito_area`
Áreas de cada norma (puede tener varias): `Calidad` · `Ambiente` · `SST`.

### `evaluacion` — Evaluación de Cumplimiento
Histórico de revisiones de una norma. **Solo se agregan filas; nunca se editan ni se borran.**
`estado`: `Cumple` · `Cumple parcialmente` · `No cumple` · `No aplica` · `Por evaluar`. Además: `fecha`, `evidencia`, `responsable`, `registrado_por`.

El **estado actual** de una norma = su evaluación más reciente (mayor `fecha`; si empatan, la de `created_at` más reciente). No se guarda como columna: se calcula.

### `cambio_normativo` — Bitácora de cambios normativos
Circulares, leyes modificatorias, pliegos técnicos, etc. que actualizan una norma. `requisito_base_id` es opcional (algunas no modifican ninguna norma de la Matriz). `impacto`: `Sí` · `No aplica` · `Aplicación condicionada` · `Aplicación indirecta`.

### `fuente_vigilancia` — Vigilancia normativa
Sitios a monitorear (BCN, SUSESO, SEC, etc.) con URL, frecuencia, responsable, fecha de última revisión y notas. Hoy está vacía.

### `historial_cambio` — Historial de cambios
Registro legible de quién hizo qué. **Solo se agregan filas; nunca se editan ni se borran.** Ver sección 6.

---

## 4. Pantallas

Menú superior: **Dashboard · Matriz · Bitácora · Vigilancia normativa · Historial de cambios**.

### 4.1 Dashboard
Considera solo normas con estado `Aplica` (se recomienda excluir también las eliminadas, `eliminado_en IS NULL`; la app actual no lo hace).
- Porcentaje grande: normas cuyo estado actual de evaluación es `Cumple` ÷ total que aplican. Color: verde ≥ 80 %, ámbar ≥ 50 %, rojo < 50 %.
- Barras: cantidad por estado actual de evaluación (incluye "Sin evaluar" para las que no tienen ninguna).
- Barras: cantidad por prioridad.

### 4.2 Matriz
Lista de normas **no eliminadas**, agrupadas por bloque temático (en orden de `bloque_tematico.orden`).

**Filtros** (formulario GET, se combinan):
- Buscar: texto en código, nombre, descripción, aplicabilidad, artículo clave, fuente, cómo demostrar, organismo; si es un número, también busca por `legacy_id`.
- Bloque temático (uno o todos).
- Estado: casillas múltiples; ninguna marcada = todos.
- Área, Prioridad, Vigilancia (uno o todos).
- Enlace "Limpiar filtros" si hay alguno activo.

**Agrupación**: cada bloque es desplegable (clic en su título). **Arrancan todos desplegados.** Botón arriba a la derecha "Contraer todo" / "Desplegar todo".

**Columnas**: ID · Código normativo (enlace a la ficha) · Nombre oficial · Estado (tooltip con la aplicabilidad) · Última revisión (estado actual de evaluación + fecha, o "Sin evaluar") · Prioridad · Vigilancia · Área.

**Jerarquía**: las normas hijas aparecen indentadas bajo su norma madre (con "↳"), dentro del bloque de la madre. Si la madre no está en el resultado (por filtro o porque está en otro bloque), la hija aparece como fila principal con un texto "Modifica de [código madre] (bloque)". Orden dentro de cada nivel: `legacy_id`.

Botón "+ Nueva norma".

### 4.3 Ficha de una norma
Encabezado: `#ID` + código, nombre oficial, insignias (estado con tooltip de aplicabilidad, prioridad, vigilancia, áreas). Botones: ← Volver a la Matriz · ↑ Anterior · ↓ Siguiente (siguen el orden de la Matriz) · Editar · Índice de normas (lista lateral).

Si la norma está eliminada: aviso rojo arriba "Esta norma fue eliminada el [fecha]…" con botón **Restaurar**.

Secciones:
1. **Datos generales** — Bloque, Rango jurídico, Frecuencia de revisión, Fuente a verificar, Organismo fiscalizador. Lápiz ✏️ arriba a la derecha para editar solo estos campos ahí mismo.
2. **Contenido y aplicabilidad** — De qué se trata, Aplicabilidad, Requisito o artículo clave (orientativo), Cómo demostrar cumplimiento (orientativo). Lápiz ✏️ para editar solo estos campos. Ícono "i" junto al título con el texto "Criterio de aplicabilidad" (sección 7).
3. **Relación normativa** (solo si tiene madre o hijas) — "[Tipo de relación] de [norma madre]" y lista de hijas.
4. **Evaluación de Cumplimiento** — recuadro destacado (color teal):
   - Tabla: Fecha · Estado · Evidencia · Responsable · Registrado por (más reciente primero).
   - "Registrar nueva evaluación" (desplegable): Estado, Fecha (por defecto hoy), Responsable, Evidencia.
   - **Si la norma está "No aplica"**: en lugar de todo lo anterior, recuadro **gris** con el texto *"No es necesaria evaluación de cumplimiento a normativa no aplicable a la organización."* — sin tabla ni formulario. Vuelve a la normalidad si se cambia el estado.
5. **Cambios normativos vinculados** — tabla de la bitácora para esta norma.
6. **Historial de cambios** — eventos de esta norma (ver 6).

### 4.4 Crear / Editar norma
Formulario con todos los campos de `requisito` + áreas (casillas). Código y nombre obligatorios.
- Selector "Norma madre": muestra `#ID — código`, solo normas no eliminadas, sin incluirse a sí misma.
- **Eliminar** (solo en Editar, al final, en un recuadro rojo desplegable "Eliminar esta norma"): exige **justificación obligatoria** y confirmación. Ver 5.4.

### 4.5 Bitácora de cambios normativos
Formulario "Registrar nuevo cambio" (desplegable): Requisito base (selector `#ID — código`, opcional), Fecha, Tipo, Número/código, Nombre, Norma o parte que actualiza, Qué cambió, Impacto, Nota. Tabla de todos los cambios con enlace "Editar". Ícono "i" junto a la descripción con el texto "Criterio de la bitácora" (sección 7).

### 4.6 Vigilancia normativa
Lista de fuentes, cada una con "Editar" (desplegable) y "Eliminar". Formulario "Agregar fuente".

### 4.7 Historial de cambios
Lista de todos los eventos (más reciente primero; la app muestra los últimos 300). Cada uno: insignia de tipo, enlace a la norma, resumen, fecha-hora y usuario. Si es una edición: desplegable "Ver detalle de los cambios" con tabla Campo · Antes · Ahora.

---

## 5. Reglas de negocio

### 5.1 Selectores de norma
En "Norma madre" y "Requisito base" se listan solo normas no eliminadas, ordenadas por `legacy_id`, con el texto `#ID — código`.

### 5.2 Edición rápida (✏️)
Guardar desde un lápiz actualiza **solo** los campos de esa sección y vuelve a la vista de lectura.

### 5.3 Evaluaciones
- No se pueden registrar si la norma está "No aplica".
- Nunca se modifican ni se borran.

### 5.4 Eliminar y restaurar normas (borrado suave)
- Eliminar = poner `eliminado_en = NOW()`. **No se borra la fila** ni sus evaluaciones, cambios o historial.
- Una norma eliminada no aparece en la Matriz, ni en los selectores, ni en Anterior/Siguiente. Sí se puede abrir su ficha (por ejemplo desde el Historial) y restaurarla.
- Si una norma madre se elimina, sus hijas siguen visibles como normas principales.
- Restaurar = `eliminado_en = NULL`.

---

## 6. Historial de cambios — qué se registra

Cada evento guarda: `tipo`, `requisito_id`, `codigo_normativo` (copia del momento), `usuario_nombre`, `resumen` y, en ediciones, `cambios`.

| Evento | `tipo` | Resumen |
|---|---|---|
| Crear norma | `Creación de norma` | `Creó la norma «CÓDIGO» (NOMBRE OFICIAL).` |
| Editar norma (formulario completo o ✏️) | `Edición de norma` | `Editó «Campo 1», «Campo 2» de la norma «CÓDIGO».` |
| Registrar evaluación | `Registro de evaluación` | `Registró una revisión de la norma «CÓDIGO»: ESTADO.` |
| Eliminar norma | `Eliminación de norma` | `Eliminó la norma «CÓDIGO» (NOMBRE OFICIAL). Justificación: TEXTO` |
| Restaurar norma | `Restauración de norma` | `Restauró la norma «CÓDIGO» (previamente eliminada).` |

**Ediciones**:
- Se compara el valor anterior con el nuevo, campo por campo. Solo se registran los que cambiaron. **Si no cambió nada, no se registra evento.**
- `cambios` es un JSON: `[{"campo": "prioridad", "etiqueta": "Prioridad", "antes": "Media", "despues": "Alta"}, ...]`.
- Los valores se guardan **legibles**: etiquetas de los enums, nombre del bloque temático (no su ID), código de la norma madre (no su ID). Vacío = `(vacío)`.
- Áreas: se muestran como lista separada por comas, ej. `Calidad, SST`.

Etiquetas de campo usadas en `cambios`:
Código normativo · Nombre oficial · Bloque temático · Estado · Aplicabilidad · Rango jurídico · Nivel de vigilancia · De qué se trata · Requisito o artículo clave · Fuente a verificar · Cómo demostrar cumplimiento · Frecuencia de revisión · Organismo fiscalizador · Prioridad · Norma madre · Tipo de relación · Áreas.

Los cambios en Bitácora y Vigilancia **no** se registran en el historial.

---

## 7. Textos de ayuda (tooltips) — copiar literal

**Prioridad**: Indica qué tan grave sería incumplir la norma, combinando el riesgo legal, la probabilidad de fiscalización y las consecuencias para las personas o el medioambiente. Opciones: Crítica · Alta · Media · Baja.

**Vigilancia**: Indica con qué frecuencia hay que revisar si la norma cambió. Mide el ritmo al que se modifica. Las normas de vigilancia alta cambian seguido, por lo que exigen monitoreo activo en el sitio del organismo que las dicta. Opciones: Alto · Medio · Bajo.

**Rango jurídico**: Indica la fuerza legal de la norma, según quién la dicta. Opciones: Ley (dictada por el Congreso) · Decreto/Reglamento (dictado por el Poder Ejecutivo) · Norma administrativa (dictada por un organismo fiscalizador: circulares, resoluciones, normas técnicas, ordenanzas, pliegos).

**Frecuencia de revisión**: Indica cada cuánto tiempo se debe volver a evaluar el cumplimiento de esta norma en la organización. Opciones sugeridas: Mensual · Trimestral · Semestral · Anual · Por evento.

**Relación normativa / Tipo de relación**: Indica cómo se vincula una norma con otra. Permite agrupar una norma con su norma madre en lugar de tratarla como un requisito suelto. Opciones: Principal (norma base, no depende de otra) · Modifica (cambia el texto de otra norma) · Reglamenta (desarrolla una ley) · Complementa (apoya a otra sin modificarla) · Libro / Sub-parte (es una parte interna de una norma mayor) · Reemplazada por (fue sustituida por una norma posterior) · Transición (convive con una norma nueva mientras esta entra plenamente en vigencia).

**Cambios normativos vinculados**: Registro de las actualizaciones que recibe la norma base a lo largo del tiempo: circulares, leyes modificatorias, pliegos técnicos u otras.

**Criterio de la bitácora** (ícono "i" en Bitácora): Un cambio queda aquí (y no como norma propia en la Matriz) cuando modifica una norma que ya está en la Matriz pero no crea una obligación que necesite evidencia o seguimiento propio — por ejemplo, un ajuste puntual a un artículo, absorbido al evaluar la norma base. Si en cambio trae un régimen de cumplimiento nuevo (su propio procedimiento, evidencia o revisión periódica), pasa a tener su propia fila en la Matriz, enlazada a su norma madre.

**Requisito o artículo clave (orientativo)**: Es un puntero orientativo para ubicar rápido la parte más relevante de la norma — no un resumen completo de sus obligaciones. La norma puede tener otros artículos aplicables además del señalado acá, así que esto no reemplaza revisar el texto oficial completo.

**Cómo demostrar cumplimiento (orientativo)**: Es una sugerencia de qué evidencia suele pedirse, no una lista taxativa ni un reemplazo de la norma. Puede haber otros medios de verificación válidos, y la fiscalización puede exigir más de lo descrito acá — siempre hay que revisar el texto oficial vigente para confirmar qué exige exactamente.

**Criterio de aplicabilidad** (ícono "i" en "Contenido y aplicabilidad"; respetar saltos de línea):

> Criterio para la identificación de artículos aplicables
>
> La evaluación de cada norma se concentra en los artículos o componentes que establecen obligaciones concretas para la organización. Las disposiciones que no generan requisitos exigibles se consideran únicamente como antecedentes o contexto normativo.
>
> Se consideran clave aquellas disposiciones relacionadas directa o indirectamente con:
> • las actividades desarrolladas por la organización;
> • las instalaciones, equipos o bienes utilizados;
> • las características de la organización, tales como dotación, rubro y ubicación;
> • las relaciones mantenidas con trabajadores, mandantes, contratistas, autoridades y demás partes interesadas.
> • Los Riesgos identificados en la Matriz de Riesgos
> • Aspectos Ambientales identificados en Matriz de Aspectos Ambientales
>
> La identificación de artículos y componentes clave de una norma constituye una orientación para la evaluación del cumplimiento y no reemplaza la revisión del texto oficial vigente de la norma.

---

## 8. Colores (referencia)

| Valor | Color |
|---|---|
| Estado norma: Aplica / No aplica / Derogada / Evaluar aplicabilidad | verde / gris / gris oscuro / celeste |
| Evaluación: Cumple / Cumple parcialmente / No cumple / No aplica / Por evaluar | verde / ámbar / rojo / gris / celeste |
| Prioridad: Crítica / Alta / Media / Baja | rojo / naranjo / ámbar / gris |
| Impacto: Sí / No aplica / Aplicación condicionada / Aplicación indirecta | verde / gris / ámbar / celeste |
| Historial: Creada / Editada / Revisión / Eliminada / Restaurada | verde / celeste / ámbar / rojo / verde |

---

## 9. Conteos esperados tras cargar los datos

Al momento de la exportación (ver fecha en el encabezado de `02_datos_mariadb.sql`):

| Tabla | Filas |
|---|---|
| `bloque_tematico` | 14 |
| `requisito` | 106 (50 con norma madre) |
| `requisito_area` | 139 |
| `evaluacion` | 9 |
| `cambio_normativo` | 21 |
| `fuente_vigilancia` | 0 |
| `historial_cambio` | 29 |

Si la app original sigue en uso después de esa fecha, hay que **volver a generar** `02_datos_mariadb.sql` justo antes del traspaso definitivo (`npx tsx scripts/exportar-mariadb.ts`, con la variable `EXPORT_DATABASE_URL`).
