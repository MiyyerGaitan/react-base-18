import { GoogleAuth } from 'google-auth-library';

const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const credentials = JSON.parse(
  Buffer.from(credentialsBase64, 'base64').toString('utf8')
);
const caracteresPermitidos = /^[a-zA-Z0-9\sáéíóúñÁÉÍÓÚÑ]{0,200}$/;
const respuestasPermitidas = [
    "Ya asistí",
    "Ya solicite la cita",
    "Me he comunicado con la eps y no ha sido posible",
    "No he realizado actividades para la recomendación"
]
const spreadsheetId = process.env.SPREADSHEET_ID;
const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function obtenerToken() {
  const client = await auth.getClient();
  const respuesta = await client.getAccessToken();
  const token = respuesta.token;

  return token;
}

async function guardarInformacion(values, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Data!A1:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [values] // values es un array: ["Dato1", "Dato2"]
    })
  });

  return await response.json();
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
    const values = body.values;

    let fecha = new Date().toLocaleDateString('es-ES');
    let id = values[0] || "";
    let respuesta = values[1];
    let observaciones = values[2] || ""; 
    

    if (!/^\d{1,20}$/.test(id)) {
      return new Response(
        JSON.stringify({ error: 'valor no permitido' }),
        { status: 400 }
      );
    }

    if (!/^[0-3]$/.test(respuesta)) {
      return new Response(
        JSON.stringify({ error: 'respuesta no permitida' }),
        { status: 400 }
      );
    }

    respuesta = respuestasPermitidas[values[1]];

    if (!caracteresPermitidos.test(observaciones)) {
      return new Response(
        JSON.stringify({ error: 'Supero el limite 200 caracteres o contiene caracteres no permitidos' }),
        { status: 400 }
      );
    }

    const accessToken = await obtenerToken();
    const result = await guardarInformacion([fecha, id, respuesta, observaciones], accessToken);
    const recomendacion = result ? result.recomendacion : "Error al guardar información";

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