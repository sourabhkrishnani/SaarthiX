import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [file, setFile] = useState(null);
  const [shortNotes, setShortNotes] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Constants to match your exact screenshot colors
  const COLORS = {
    bg: "#121926",
    card: "#080c14",
    inputBar: "#1e293b",
    accentBlue: "#60a5fa",
    btnGradient: "linear-gradient(135deg, #4f74f7 0%, #a235f1 100%)",
    textDim: "#64748b",
    textLight: "#aab3c2"
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setShortNotes("");
      setQuiz([]);
      setSelectedAnswers({});

      // Matches your FastAPI endpoint
      const res = await axios.post("http://localhost:8000/upload", formData);

      if (res.data.error) {
        alert(res.data.error);
      } else {
        setShortNotes(res.data.short_notes || "");
        setQuiz(res.data.quiz || []);
      }
    } catch (err) {
      alert("Could not connect to backend. Ensure FastAPI is running at port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (qIdx, option) => {
    if (selectedAnswers[qIdx]) return; // Lock answer
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", padding: "60px 20px", color: COLORS.textLight, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. MAIN CARD (Exact match to your screenshot) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: COLORS.card, width: "100%", maxWidth: "750px", margin: "0 auto", padding: "60px 40px", borderRadius: "24px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill={COLORS.accentBlue}><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "white", margin: 0, letterSpacing: "-1px" }}>
            SaarthX <span style={{ color: COLORS.accentBlue }}>AI</span>
          </h1>
        </div>
        <p style={{ color: COLORS.textDim, fontSize: "1.1rem", marginBottom: "40px" }}>Smart Notes + Interactive Quiz Generator</p>

        <div style={{ backgroundColor: COLORS.inputBar, padding: "12px 12px 12px 24px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #334155" }}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            style={{ color: "#94a3b8", fontSize: "0.9rem", cursor: "pointer" }}
          />
          <button 
            onClick={handleUpload} 
            disabled={loading}
            style={{ background: COLORS.btnGradient, color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", transition: "transform 0.2s" }}
            onMouseOver={(e) => e.target.style.opacity = "0.9"}
            onMouseOut={(e) => e.target.style.opacity = "1"}
          >
            {loading ? "Processing..." : "Generate"}
          </button>
        </div>
      </motion.div>

      {/* 2. DYNAMIC CONTENT SECTION */}
      <div style={{ maxWidth: "750px", margin: "40px auto" }}>
        <AnimatePresence>
          
          {/* SMART NOTES SECTION */}
          {shortNotes && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ backgroundColor: COLORS.card, padding: "40px", borderRadius: "24px", border: "1px solid #1e293b", marginBottom: "30px" }}
            >
              <h2 style={{ color: COLORS.accentBlue, fontSize: "1.5rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                📑 Smart Notes
              </h2>
              <div className="prose prose-invert max-w-none" style={{ color: "#cbd5e1", lineHeight: "1.8" }}>
                <ReactMarkdown>{shortNotes}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* QUIZ SECTION */}
          {quiz.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ backgroundColor: COLORS.card, padding: "40px", borderRadius: "24px", border: "1px solid #1e293b" }}
            >
              <h2 style={{ color: "#c084fc", fontSize: "1.5rem", marginBottom: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
                🧠 Interactive Quiz
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {quiz.map((q, qIdx) => (
                  <div key={qIdx} style={{ padding: "24px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b" }}>
                    <p style={{ fontWeight: "bold", color: "white", marginBottom: "20px", fontSize: "1.1rem" }}>
                      <span style={{ color: COLORS.textDim, marginRight: "10px" }}>{qIdx + 1}.</span> 
                      {q.question}
                    </p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === opt;
                        const isCorrect = opt === q.correct_answer;
                        
                        let bgColor = "rgba(255,255,255,0.05)";
                        let borderColor = "#334155";

                        if (selectedAnswers[qIdx]) {
                          if (isCorrect) {
                            bgColor = "#065f46"; // Success Green
                            borderColor = "#10b981";
                          } else if (isSelected) {
                            bgColor = "#7f1d1d"; // Danger Red
                            borderColor = "#ef4444";
                          }
                        }

                        return (
                          <button 
                            key={oIdx}
                            onClick={() => handleOptionClick(qIdx, opt)}
                            style={{ textAlign: "left", padding: "14px", borderRadius: "10px", border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: "white", cursor: "pointer", transition: "all 0.2s" }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* RATIONALE REVEAL */}
                    {selectedAnswers[qIdx] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        style={{ marginTop: "20px", padding: "16px", backgroundColor: "rgba(96, 165, 250, 0.1)", borderRadius: "8px", borderLeft: `4px solid ${COLORS.accentBlue}` }}
                      >
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                          <strong style={{ color: COLORS.accentBlue }}>Explanation:</strong> {q.rationale}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
