const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(cors());
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/*
==============================
RUTA PRINCIPAL
==============================
*/
app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensaje: "API SVIM funcionando correctamente"
  });
});

/*
==============================
SALUD
==============================
*/
app.get("/health", async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/*
==============================
CONSULTAR IMEI
==============================
*/
app.get("/api/imei/:imei", async (req, res) => {
  try {
    const { imei } = req.params;

    const result = await sql`
      SELECT *
      FROM SVIM_reporte
      WHERE IMEI_1 = ${imei}
    `;

    res.json({
      ok: true,
      imei,
      registros: result
    });

  } catch (error) {
    console.error("ERROR CONSULTA:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/*
==============================
LISTAR REPORTES
==============================
*/
app.get("/api/reportes", async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM SVIM_reporte
      ORDER BY ID DESC
      LIMIT 50
    `;

    res.json({
      ok: true,
      data: result
    });

  } catch (error) {
    console.error("ERROR LISTAR:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/*
==============================
REGISTRO RANDOM
==============================
*/
app.get("/api/random", async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM SVIM_reporte
      ORDER BY random()
      LIMIT 1
    `;

    res.json({
      ok: true,
      data: result[0] || null
    });

  } catch (error) {
    console.error("ERROR RANDOM:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/*
==============================
CREAR REPORTE SVIM DIRECTO
==============================
*/
app.post("/api/reportar", async (req, res) => {
  try {
    const {
      motivo,
      geolocalizacion,
      imei1,
      imei2,
      eimei1,
      eimei2,
      marca,
      modelo,
      sistema,
      serial
    } = req.body;

    await sql`
      INSERT INTO SVIM_reporte
      (
        MOTIVO,
        GEOLOCALIZACION,
        HORA,
        IMEI_1,
        IMEI_2,
        eIMEI_1,
        eIMEI_2,
        MARCA,
        MODELO,
        SISTEMA,
        NUMERO_SERIAL
      )
      VALUES
      (
        ${motivo},
        ${geolocalizacion},
        NOW(),
        ${imei1},
        ${imei2},
        ${eimei1},
        ${eimei2},
        ${marca},
        ${modelo},
        ${sistema},
        ${serial}
      )
    `;

    res.json({
      ok: true,
      mensaje: "Reporte SVIM creado correctamente"
    });

  } catch (error) {
    console.error("ERROR INSERT:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/*
==============================
INTEGRITY SIMULADO + ALERTA
==============================
Regla:
- si integrityAnomaly = true
- y svimAltered = true
=> inserta reporte
==============================
*/
app.post("/api/integrity/report", async (req, res) => {
  try {
    const {
      integrityAnomaly,
      svimAltered,
      motivoSvim,
      geolocalizacion,
      imei_1,
      imei_2,
      eimei_1,
      eimei_2,
      marca,
      modelo,
      sistema,
      numero_serial
    } = req.body;

    let reportInserted = false;
    let reason = "No se envió reporte";

    if (integrityAnomaly === true && svimAltered === true) {
      const motivoFinal = motivoSvim
        ? `movimiento sospechoso - ${motivoSvim}`
        : "movimiento sospechoso";

      await sql`
        INSERT INTO SVIM_reporte
        (
          MOTIVO,
          GEOLOCALIZACION,
          HORA,
          IMEI_1,
          IMEI_2,
          eIMEI_1,
          eIMEI_2,
          MARCA,
          MODELO,
          SISTEMA,
          NUMERO_SERIAL
        )
        VALUES
        (
          ${motivoFinal},
          ${geolocalizacion},
          NOW(),
          ${imei_1},
          ${imei_2},
          ${eimei_1},
          ${eimei_2},
          ${marca},
          ${modelo},
          ${sistema},
          ${numero_serial}
        )
      `;

      reportInserted = true;
      reason = "Se insertó reporte por integrity anomaly + alteración SVIM";
    } else if (integrityAnomaly === true && svimAltered === false) {
      reason = "Hay anomalía de integrity, pero no alteración SVIM";
    } else if (integrityAnomaly === false && svimAltered === true) {
      reason = "Hay alteración SVIM, pero no anomalía de integrity";
    } else {
      reason = "No hay anomalía ni alteración";
    }

    res.json({
      ok: true,
      integrityAnomaly: !!integrityAnomaly,
      svimAltered: !!svimAltered,
      reportInserted,
      reason
    });

  } catch (error) {
    console.error("ERROR INTEGRITY REPORT:", error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("SERVIDOR SVIM INICIADO");
  console.log(`PUERTO: ${PORT}`);
  console.log("=================================");
});