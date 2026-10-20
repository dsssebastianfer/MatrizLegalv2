-- =============================================================================
-- Matriz Legal DSS — estructura de base de datos para MariaDB (10.6+)
-- =============================================================================
-- Traducción de prisma/schema.prisma (Postgres) a MariaDB.
--
-- Diferencias con la app original:
--   * No se incluye la tabla `usuario`: la app nueva usará el login de DSS.
--   * `evaluacion.usuario_id` se reemplazó por `registrado_por` (nombre en
--     texto), igual que `historial_cambio.usuario_nombre`.
--   * Los IDs son UUID en CHAR(36). Los existentes se conservan; para filas
--     nuevas la app PHP puede usar UUID() de MariaDB.
--   * Los ENUM usan exactamente los valores que guardaba la base original
--     (con espacios y acentos).
--
-- Orden de ejecución: este archivo primero, luego 02_datos_mariadb.sql.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historial_cambio;
DROP TABLE IF EXISTS fuente_vigilancia;
DROP TABLE IF EXISTS cambio_normativo;
DROP TABLE IF EXISTS evaluacion;
DROP TABLE IF EXISTS requisito_area;
DROP TABLE IF EXISTS requisito;
DROP TABLE IF EXISTS bloque_tematico;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Bloques temáticos (agrupan las normas en la Matriz)
-- -----------------------------------------------------------------------------
CREATE TABLE bloque_tematico (
  id      CHAR(36)     NOT NULL,
  nombre  VARCHAR(255) NOT NULL,
  orden   INT          NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bloque_tematico_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Requisitos legales (las normas de la Matriz)
-- -----------------------------------------------------------------------------
CREATE TABLE requisito (
  id                          CHAR(36)     NOT NULL,
  legacy_id                   INT          NULL,
  codigo_normativo            VARCHAR(500) NOT NULL,
  nombre_oficial              TEXT         NOT NULL,
  bloque_tematico_id          CHAR(36)     NOT NULL,
  estado                      ENUM('Aplica', 'No aplica', 'Derogada', 'Evaluar aplicabilidad') NOT NULL,
  aplicabilidad               TEXT         NULL,
  rango_juridico              ENUM('Ley', 'Decreto/Reglamento', 'Norma administrativa') NOT NULL,
  nivel_vigilancia            ENUM('Alto', 'Medio', 'Bajo') NOT NULL,
  descripcion                 TEXT         NULL,
  requisito_articulo_clave    TEXT         NULL,
  fuente_a_verificar          TEXT         NULL,
  como_demostrar_cumplimiento TEXT         NULL,
  frecuencia_revision         VARCHAR(255) NULL,
  organismo_fiscalizador      VARCHAR(500) NULL,
  prioridad                   ENUM('Baja', 'Media', 'Alta', 'Crítica') NOT NULL,
  norma_madre_id              CHAR(36)     NULL,
  tipo_relacion               ENUM('Principal', 'Modifica', 'Reglamenta', 'Complementa', 'Libro', 'Sub-parte', 'Reemplazada por', 'Transición') NOT NULL DEFAULT 'Principal',
  -- Borrado suave: con fecha = norma eliminada (oculta en Matriz y selectores).
  eliminado_en                DATETIME(3)  NULL,
  created_at                  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at                  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_requisito_legacy_id (legacy_id),
  KEY ix_requisito_bloque (bloque_tematico_id),
  KEY ix_requisito_norma_madre (norma_madre_id),
  KEY ix_requisito_estado (estado),
  KEY ix_requisito_prioridad (prioridad),
  KEY ix_requisito_vigilancia (nivel_vigilancia),
  CONSTRAINT fk_requisito_bloque FOREIGN KEY (bloque_tematico_id) REFERENCES bloque_tematico (id),
  CONSTRAINT fk_requisito_norma_madre FOREIGN KEY (norma_madre_id) REFERENCES requisito (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Áreas de cada requisito (una norma puede ser de varias áreas)
-- -----------------------------------------------------------------------------
CREATE TABLE requisito_area (
  requisito_id CHAR(36) NOT NULL,
  area         ENUM('Calidad', 'Ambiente', 'SST') NOT NULL,
  PRIMARY KEY (requisito_id, area),
  CONSTRAINT fk_requisito_area_requisito FOREIGN KEY (requisito_id) REFERENCES requisito (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Evaluaciones de cumplimiento (histórico: solo INSERT, nunca UPDATE/DELETE)
-- -----------------------------------------------------------------------------
CREATE TABLE evaluacion (
  id             CHAR(36)     NOT NULL,
  requisito_id   CHAR(36)     NOT NULL,
  estado         ENUM('Cumple', 'Cumple parcialmente', 'No cumple', 'No aplica', 'Por evaluar') NOT NULL,
  evidencia      TEXT         NULL,
  responsable    VARCHAR(255) NULL,
  fecha          DATE         NOT NULL,
  -- Nombre de quien registró la evaluación (antes era FK a la tabla usuario).
  registrado_por VARCHAR(255) NOT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_evaluacion_requisito_fecha (requisito_id, fecha),
  CONSTRAINT fk_evaluacion_requisito FOREIGN KEY (requisito_id) REFERENCES requisito (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Bitácora de cambios normativos (circulares, leyes modificatorias, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE cambio_normativo (
  id                          CHAR(36)     NOT NULL,
  fecha                       DATE         NULL,
  tipo                        VARCHAR(255) NULL,
  numero_codigo               VARCHAR(255) NULL,
  nombre                      TEXT         NULL,
  norma_o_parte_que_actualiza TEXT         NULL,
  -- Opcional: algunas circulares no modifican ninguna norma de la Matriz.
  requisito_base_id           CHAR(36)     NULL,
  que_cambio                  TEXT         NULL,
  impacto                     ENUM('Sí', 'No aplica', 'Aplicación condicionada', 'Aplicación indirecta') NOT NULL,
  nota                        TEXT         NULL,
  created_at                  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at                  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_cambio_normativo_requisito (requisito_base_id),
  CONSTRAINT fk_cambio_normativo_requisito FOREIGN KEY (requisito_base_id) REFERENCES requisito (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Fuentes de vigilancia normativa (sitios a monitorear)
-- -----------------------------------------------------------------------------
CREATE TABLE fuente_vigilancia (
  id              CHAR(36)     NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  url             TEXT         NULL,
  frecuencia      VARCHAR(255) NULL,
  responsable     VARCHAR(255) NULL,
  ultima_revision DATE         NULL,
  notas           TEXT         NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Historial de cambios (auditoría legible: quién hizo qué; solo INSERT)
-- -----------------------------------------------------------------------------
CREATE TABLE historial_cambio (
  id               CHAR(36)     NOT NULL,
  tipo             ENUM('Creación de norma', 'Edición de norma', 'Registro de evaluación', 'Eliminación de norma', 'Restauración de norma') NOT NULL,
  requisito_id     CHAR(36)     NULL,
  -- Copia del código al momento del evento (legible aunque la norma cambie).
  codigo_normativo VARCHAR(500) NULL,
  usuario_nombre   VARCHAR(255) NOT NULL,
  resumen          TEXT         NOT NULL,
  -- Solo para ediciones: [{ "campo", "etiqueta", "antes", "despues" }, ...]
  cambios          JSON         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_historial_requisito (requisito_id),
  KEY ix_historial_created_at (created_at),
  CONSTRAINT fk_historial_requisito FOREIGN KEY (requisito_id) REFERENCES requisito (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
