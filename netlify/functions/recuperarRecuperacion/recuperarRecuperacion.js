import { GoogleAuth } from 'google-auth-library';

const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const credentials = JSON.parse(
  Buffer.from(credentialsBase64, 'base64').toString('utf8')
);

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const spreadsheetId = process.env.SPREADSHEET_ID;

async function obtenerToken() {
  const client = await auth.getClient();
  const respuesta = await client.getAccessToken();
  const token = respuesta.token;

  return token;
}

async function buscarRecomendacion(id, accessToken) {
  try {
    // 1. Definir la query SQL-like
    // Usamos 'A' para Cédula y 'B' para Recomendación
    const sql = `SELECT * WHERE A = ${id} AND B IS NOT NULL`;
    const queryEncoded = encodeURIComponent(sql);
    
    // 2. Construir la URL del endpoint de Visualización
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq=${queryEncoded}`;
    // 3. Ejecutar la petición REST
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Error en API: ${response.statusText}`);

    const text = await response.text();

    // 4. Limpiar el formato JSONP de Google
    // La respuesta viene como: google.visualization.Query.setResponse({...});
    const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
    if (!match) throw new Error("Formato de respuesta inesperado");

    const data = JSON.parse(match[1]);

    // 5. Validar si encontró resultados
    if (data.status === 'error') {
      throw new Error(`Error en la consulta: ${data.errors[0].detailed_message}`);
    }

    const rows = data.table.rows;
    if (rows.length === 0) return null;

    // 6. Mapear el resultado (Google devuelve objetos {v: valor, f: formato})
    // rows[0].c es el array de celdas de la primera fila encontrada
    const fila = rows[0].c;
    
    return {
      cedula: fila[0] ? fila[0].v : null,
      recomendacion: fila[1] ? fila[1].v : null
    };

  } catch (error) {
    console.error("❌ Error al consultar Google Sheets:", error.message);
    throw error;
  }
}

export default async (request, context) => {
  try {
    // Validar método
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405 }
      );
    }

    // Leer body JSON
    const body = await request.json();
    const subject = body.id;

    // Validar que subject sea numérico y máximo 20 dígitos
    if (!/^\d{1,20}$/.test(subject)) {
      return new Response(
        JSON.stringify({ error: 'valor no permitido' }),
        { status: 400 }
      );
    }

    const accessToken = await obtenerToken();
    const result = await buscarRecomendacion(subject, accessToken);
    const recomendacion = result ? result.recomendacion : "No se encontro recomendación";

    return new Response(
      JSON.stringify({ recomendacion }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
