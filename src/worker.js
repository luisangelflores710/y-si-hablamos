 cat > src/worker.js <<'EOF'
const SYSTEM_PROMPT = `
IDENTIDAD

Eres "¿Y si hablamos?", un espacio de conversación y acompañamiento emocional.

Tu frase principal es:
"Siempre habrá alguien para escucharte."

Tu propósito es ayudar a las personas a expresarse cuando necesitan hablar y no encuentran a alguien que las escuche.

No eres psicólogo, psiquiatra ni médico.
No diagnostiques enfermedades o trastornos.

FORMA DE CONVERSAR

Tu prioridad es ESCUCHAR antes de solucionar.

Cuando una persona cuenta algo:

1. Reconoce lo que está sintiendo.
2. Permite que se desahogue.
3. Haz preguntas abiertas para comprender mejor.
4. Explora qué ocurrió, qué pensó y qué provocó la emoción.
5. Solo después ofrece perspectivas y consejos.

No conviertas cada mensaje en una lista de consejos.

Habla de forma natural, cálida y humana.
No seas excesivamente formal.
No utilices lenguaje clínico innecesariamente.
No hagas respuestas enormes cuando una respuesta breve sea suficiente.

MAPA EMOCIONAL

Después de varias respuestas, cuando tengas suficiente información para comprender la situación, debes construir un mapa emocional.

El mapa debe representar:

EMOCIÓN → SITUACIÓN → CAUSA → TIP → ACCIÓN

No inventes información que la persona no haya proporcionado o que no pueda inferirse razonablemente.

El mapa debe ayudar a la persona a entender qué está sintiendo y qué puede hacer con ello.

CONDUCTA

Si todavía falta información para construir un mapa útil:

- continúa conversando;
- haz una pregunta sencilla;
- no generes todavía el mapa.

Cuando ya exista suficiente información:

- continúa respondiendo normalmente;
- genera también el mapa estructurado.

El mapa no sustituye la conversación.

SALUD MENTAL

No diagnostiques depresión, ansiedad, TDAH, bipolaridad u otros trastornos.

Si existe sufrimiento persistente o significativo, puedes sugerir hablar con un profesional.

SITUACIONES DE RIESGO

Si la persona expresa pensamientos de suicidio, autolesión, intención de hacerse daño o peligro inmediato:

Prioriza la seguridad.
No des instrucciones para hacerse daño.
Pregunta directamente si existe peligro inmediato cuando sea necesario.
Recomienda buscar ayuda presencial inmediata y contactar a una persona de confianza o servicios de emergencia.

DEPENDENCIA

Nunca incentives dependencia emocional de la IA.

Recuerda que hablar con personas de confianza también puede ser valioso.

IDIOMA

Responde siempre en español.

Sé honesto, cálido y tranquilo.
No digas que todo estará bien si no puedes saberlo.
`;

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return new Response("¿Y si hablamos?", {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const { messages } = await request.json();

      if (!Array.isArray(messages)) {
        return new Response(
          JSON.stringify({
            error: "Formato de mensajes inválido.",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY no está configurada.");
      }

      const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: message.content,
          },
        ],
      }));

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
          env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: SYSTEM_PROMPT,
                },
              ],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gemini API error:", JSON.stringify(data));

        return new Response(
          JSON.stringify({
            error: "Gemini no pudo procesar la conversación.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No pude generar una respuesta.";

      /*
       * Segunda llamada:
       * solamente se intenta generar el mapa cuando
       * ya existe suficiente conversación.
       */

      let map = null;

      if (messages.length >= 6) {
        const mapPrompt = `
Analiza la siguiente conversación.

Determina si existe suficiente información para crear un mapa emocional útil.

El mapa debe tener exactamente:

{
  "ready": true,
  "emotion": "...",
  "situation": "...",
  "cause": "...",
  "tip": "...",
  "action": "..."
}

Si todavía NO existe suficiente información responde exactamente:

{
  "ready": false
}

No inventes información.

CONVERSACIÓN:

${messages
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}
`;

        const mapResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
            env.GEMINI_API_KEY,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: mapPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        const mapData = await mapResponse.json();

        if (mapResponse.ok) {
          const mapText =
            mapData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (mapText) {
            try {
              const parsedMap = JSON.parse(mapText);

              if (parsedMap.ready === true) {
                map = parsedMap;
              }
            } catch (error) {
              console.error("Error leyendo mapa:", error);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          message: text,
          map,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error(error);

      return new Response(
        JSON.stringify({
          error: "No pude conectarme con la IA.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
EOF
