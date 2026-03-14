const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(cors());
app.use(express.json());

/*
==============================
CONEXION BASE SVIM (NEON)
==============================
*/

const sqlSVIM = neon(
"postgresql://neondb_owner:npg_Dhx3Cw6YvjqH@ep-rough-bread-a4fglhyd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
);

/*
==============================
RUTA PRINCIPAL
==============================
*/

app.get("/", (req, res) => {
  res.send("🚀 API SVIM funcionando correctamente");
});

/*
==============================
CONSULTAR IMEI
==============================
*/

app.get("/api/imei/:imei", async (req, res) => {

  try {

    const { imei } = req.params;

    const result = await sqlSVIM`

      SELECT *
      FROM SVIM_reporte
      WHERE IMEI_1 = ${imei}

    `;

    res.json({
      ok: true,
      imei: imei,
      registros: result
    });

  } catch (error) {

    console.error("ERROR CONSULTA:", error);

    res.status(500).json({
      ok:false,
      error:error.message
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

    const result = await sqlSVIM`

      SELECT *
      FROM SVIM_reporte
      ORDER BY ID DESC
      LIMIT 50

    `;

    res.json({
      ok:true,
      data: result
    });

  } catch (error) {

    console.error("ERROR LISTAR:", error);

    res.status(500).json({
      ok:false,
      error:error.message
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

    const result = await sqlSVIM`

      SELECT *
      FROM SVIM_reporte
      ORDER BY random()
      LIMIT 1

    `;

    res.json({
      ok:true,
      data: result[0]
    });

  } catch (error) {

    console.error("ERROR RANDOM:", error);

    res.status(500).json({
      ok:false,
      error:error.message
    });

  }

});

/*
==============================
CREAR REPORTE SVIM
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

    await sqlSVIM`

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
      ok:true,
      mensaje:"Reporte SVIM creado correctamente"
    });

  } catch (error) {

    console.error("ERROR INSERT:", error);

    res.status(500).json({
      ok:false,
      error:error.message
    });

  }

});

/*
==============================
SERVER
==============================
*/

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {

  console.log("=================================");
  console.log("🚀 SERVIDOR SVIM INICIADO");
  console.log(`http://localhost:${PORT}`);
  console.log("=================================");

});