import { useEffect, useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type MapData = {
  situation: string[];
  emotions: string[];
  thoughts: string[];
  goals: string[];
  tips: string[];
  connections: {
    from: string;
    to: string;
  }[];
};

const emptyMap: MapData = {
  situation: [],
  emotions: [],
  thoughts: [],
  goals: [],
  tips: [],
  connections: [],
};

function App() {
  const [started, setStarted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola. Estoy aquí para escucharte. No necesitas saber exactamente cómo expresar lo que sientes. Puedes empezar por donde quieras.",
    },
  ]);

  const [mapData, setMapData] = useState<MapData>(emptyMap);

  useEffect(() => {
    const savedMap = localStorage.getItem("y-si-hablamos-map");

    if (savedMap) {
      try {
        setMapData(JSON.parse(savedMap));
      } catch {
        localStorage.removeItem("y-si-hablamos-map");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "y-si-hablamos-map",
      JSON.stringify(mapData)
    );
  }, [mapData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const text = message.trim();

    if (!text || loading) {
      return;
    }

    const newUserMessage: Message = {
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, newUserMessage];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Error del servidor");
      }

      const data = await response.json();

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message,
        },
      ]);

      if (data.map) {
        setMapData(data.map);
      }
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Lo siento, tuve un problema al conectarme. Intenta nuevamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMap = () => {
    setMapData(emptyMap);
    localStorage.removeItem("y-si-hablamos-map");
  };

  if (!started) {
    return (
      <main className="welcome">
        <div className="welcome-content">
          <div className="welcome-logo">🌱</div>

          <h1>¿Y si hablamos?</h1>

          <h2>Siempre habrá alguien para escucharte.</h2>

          <p className="welcome-description">
            Un espacio para expresarte, desahogarte y hablar de lo que
            llevas dentro, sin miedo a ser juzgado.
          </p>

          <button
            className="start-button"
            onClick={() => setStarted(true)}
          >
            Empezar a hablar
          </button>

          <p className="disclaimer">
            ¿Y si hablamos? es un espacio de acompañamiento y no
            sustituye la atención de un profesional de la salud mental.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div className="logo">🌱</div>

        <div className="header-info">
          <h1>¿Y si hablamos?</h1>
          <p>Siempre habrá alguien para escucharte.</p>
        </div>

        <button
          className={`map-button ${showMap ? "active" : ""}`}
          onClick={() => setShowMap(!showMap)}
        >
          🧠 {showMap ? "Volver al chat" : "Ver mi mapa"}
        </button>
      </header>

      {showMap ? (
        <section className="mind-map">
          <div className="map-header">
            <div>
              <h2>🧠 Mi mapa</h2>
              <p>
                Una representación de lo que hemos ido trabajando.
              </p>
            </div>

            <button className="clear-map" onClick={clearMap}>
              Limpiar
            </button>
          </div>

          <div className="map-canvas">
            <div className="map-center">
              <div className="center-icon">🌱</div>
              <strong>Lo que estoy viviendo</strong>
            </div>

            <div className="map-section situation">
              <div className="section-title">📌 Situaciones</div>

              {mapData.situation.length === 0 ? (
                <span className="empty">
                  Todavía no hemos identificado situaciones.
                </span>
              ) : (
                mapData.situation.map((item, index) => (
                  <div className="map-card" key={index}>
                    {item}
                  </div>
                ))
              )}
            </div>

            <div className="map-section emotions">
              <div className="section-title">😣 Emociones</div>

              {mapData.emotions.length === 0 ? (
                <span className="empty">
                  Aún estamos descubriéndolo.
                </span>
              ) : (
                mapData.emotions.map((item, index) => (
                  <div className="map-card" key={index}>
                    {item}
                  </div>
                ))
              )}
            </div>

            <div className="map-section thoughts">
              <div className="section-title">💭 Pensamientos</div>

              {mapData.thoughts.length === 0 ? (
                <span className="empty">
                  Aquí aparecerán tus pensamientos.
                </span>
              ) : (
                mapData.thoughts.map((item, index) => (
                  <div className="map-card" key={index}>
                    {item}
                  </div>
                ))
              )}
            </div>

            <div className="map-section goals">
              <div className="section-title">🎯 Objetivos</div>

              {mapData.goals.length === 0 ? (
                <span className="empty">
                  Todavía no hemos definido objetivos.
                </span>
              ) : (
                mapData.goals.map((item, index) => (
                  <div className="map-card" key={index}>
                    {item}
                  </div>
                ))
              )}
            </div>

            <div className="map-section tips">
              <div className="section-title">💡 Tips</div>

              {mapData.tips.length === 0 ? (
                <span className="empty">
                  Los tips aparecerán conforme avancemos.
                </span>
              ) : (
                mapData.tips.map((item, index) => (
                  <div className="map-card tip-card" key={index}>
                    <span className="tip-number">
                      {index + 1}
                    </span>

                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="chat">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role}`}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                Estoy pensando...
              </div>
            )}
          </section>

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe lo que tengas en mente..."
              aria-label="Escribe tu mensaje"
              disabled={loading}
            />

            <button
              type="submit"
              aria-label="Enviar"
              disabled={loading}
            >
              →
            </button>
          </form>
        </>
      )}
    </main>
  );
}

export default App;
