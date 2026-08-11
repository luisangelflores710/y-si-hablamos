 import { useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function App() {
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola. Estoy aquí para escucharte. No necesitas saber exactamente cómo expresar lo que sientes. Puedes empezar por donde quieras.",
    },
  ]);

  const [loading, setLoading] = useState(false);

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

        <div>
          <h1>¿Y si hablamos?</h1>
          <p>Siempre habrá alguien para escucharte.</p>
        </div>
      </header>

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
    </main>
  );
}

export default App;
