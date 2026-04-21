import { useState, useMemo } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

// --- Collapsible Note Section Component ---
const CollapsibleSection = ({ title, children, level, colors }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: level === 1 ? "15px" : "10px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          textAlign: "left",
          background: level === 1 ? "rgba(255,255,255,0.03)" : "transparent",
          border: level === 1 ? "1px solid #1e293b" : "none",
          padding: level === 1 ? "16px 20px" : "10px 0",
          borderRadius: "12px",
          color: level === 1 ? "white" : colors.accentBlue,
          fontWeight: level === 1 ? "800" : "700",
          fontSize: level === 1 ? "1.2rem" : "1.05rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background 0.2s"
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{isOpen ? "▲" : "▼"}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
                overflow: "hidden", 
                paddingLeft: level === 1 ? "20px" : "15px", 
                marginTop: "10px",
                borderLeft: level === 1 ? "1px solid #1e293b" : "none"
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  const [file, setFile] = useState(null);
  const [shortNotes, setShortNotes] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const COLORS = {
    bg: "#121926",
    card: "#080c14",
    inputBar: "#1e293b",
    accentBlue: "#60a5fa",
    accentPurple: "#a235f1",
    btnGradient: "linear-gradient(135deg, #4f74f7 0%, #a235f1 100%)",
    textDim: "#64748b",
    textLight: "#aab3c2",
    codeBg: "#0f172a"
  };

  // --- Logic to parse flat markdown into a hierarchical structure ---
  const structuredNotes = useMemo(() => {
    if (!shortNotes) return [];
    
    const lines = shortNotes.split("\n");
    const tree = [];
    let currentH1 = null;
    let currentH2 = null;

    lines.forEach(line => {
      if (line.startsWith("# ")) {
        currentH1 = { title: line.replace("# ", ""), children: [], content: "" };
        tree.push(currentH1);
        currentH2 = null;
      } else if (line.startsWith("## ")) {
        if (!currentH1) {
            currentH1 = { title: "Introduction", children: [], content: "" };
            tree.push(currentH1);
        }
        currentH2 = { title: line.replace("## ", ""), content: "" };
        currentH1.children.push(currentH2);
      } else {
        if (currentH2) {
          currentH2.content += line + "\n";
        } else if (currentH1) {
          currentH1.content += line + "\n";
        } else {
          // Content before any header
          const intro = { title: "General Info", children: [], content: line + "\n" };
          tree.push(intro);
          currentH1 = intro;
        }
      }
    });
    return tree;
  }, [shortNotes]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setShortNotes("");
      setQuiz([]);
      setSelectedAnswers({});
      setIsNotesExpanded(false);

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
    if (selectedAnswers[qIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = shortNotes;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert("Notes copied to clipboard!");
  };

  const resetSession = () => {
    setFile(null);
    setShortNotes("");
    setQuiz([]);
    setSelectedAnswers({});
    setIsNotesExpanded(false);
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", padding: "60px 20px", color: COLORS.textLight, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. MAIN GENERATOR CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: COLORS.card, width: "100%", maxWidth: "800px", margin: "0 auto", padding: "60px 40px", borderRadius: "24px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid #1e293b" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill={COLORS.accentBlue}>
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "white", margin: 0, letterSpacing: "-1px" }}>
            SaarthX <span style={{ color: COLORS.accentBlue }}>AI</span>
          </h1>
        </div>
        <p style={{ color: COLORS.textDim, fontSize: "1.1rem", marginBottom: "40px" }}>Smart Notes + Interactive Quiz Generator</p>

        <div style={{ backgroundColor: COLORS.inputBar, padding: "12px 12px 12px 24px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #334155" }}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            style={{ color: "#94a3b8", fontSize: "0.9rem", cursor: "pointer", width: "60%" }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            {shortNotes && (
              <button 
                onClick={resetSession}
                style={{ background: "transparent", color: COLORS.textDim, border: "1px solid #334155", padding: "10px 20px", borderRadius: "12px", cursor: "pointer" }}
              >
                Reset
              </button>
            )}
            <button 
              onClick={handleUpload} 
              disabled={loading}
              style={{ 
                  background: COLORS.btnGradient, 
                  color: "white", 
                  border: "none", 
                  padding: "14px 32px", 
                  borderRadius: "12px", 
                  fontWeight: "bold", 
                  fontSize: "1rem", 
                  cursor: loading ? "not-allowed" : "pointer", 
                  transition: "all 0.2s",
                  opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Processing..." : "Generate"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. DYNAMIC CONTENT SECTION */}
      <div style={{ maxWidth: "800px", margin: "40px auto" }}>
        <AnimatePresence>
          
          {/* SMART NOTES SECTION */}
          {shortNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ backgroundColor: COLORS.card, padding: "40px", borderRadius: "24px", border: "1px solid #1e293b", marginBottom: "30px", position: "relative", overflow: "hidden" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h2 style={{ color: COLORS.accentBlue, fontSize: "1.6rem", margin: 0, display: "flex", alignItems: "center", gap: "12px", fontWeight: "800" }}>
                  📑 Smart Notes
                </h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={copyToClipboard}
                    style={{ background: "#1e293b", color: COLORS.accentBlue, border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}
                  >
                    Copy Text
                  </button>
                </div>
              </div>

              {/* COLLAPSIBLE WRAPPER (Accordion + Read More) */}
              <div 
                style={{ 
                  color: "#cbd5e1", 
                  lineHeight: "1.8", 
                  fontSize: "1.05rem", 
                  maxHeight: isNotesExpanded ? "none" : "350px", 
                  overflow: "hidden", 
                  position: "relative",
                  transition: "max-height 0.5s ease-in-out" 
                }}
              >
                {structuredNotes.map((h1, idx) => (
                  <CollapsibleSection key={idx} title={h1.title} level={1} colors={COLORS}>
                    {h1.content && (
                         <div style={{ marginBottom: "15px", opacity: 0.9 }}>
                            <ReactMarkdown
                                components={{
                                    strong: ({node, ...props}) => <strong style={{ color: COLORS.accentBlue, fontWeight: "700" }} {...props} />,
                                    code: ({node, inline, ...props}) => (
                                        inline 
                                            ? <code style={{ background: COLORS.codeBg, padding: "2px 6px", borderRadius: "4px", color: COLORS.accentBlue }} {...props} />
                                            : <pre style={{ background: COLORS.codeBg, padding: "20px", borderRadius: "12px", overflowX: "auto", border: "1px solid #1e293b", color: "#60a5fa" }}><code {...props} /></pre>
                                    ),
                                }}
                            >
                                {h1.content}
                            </ReactMarkdown>
                         </div>
                    )}
                    {h1.children.map((h2, subIdx) => (
                      <CollapsibleSection key={subIdx} title={h2.title} level={2} colors={COLORS}>
                        <div style={{ opacity: 0.85 }}>
                            <ReactMarkdown
                                components={{
                                    strong: ({node, ...props}) => <strong style={{ color: COLORS.accentBlue, fontWeight: "700" }} {...props} />,
                                    code: ({node, inline, ...props}) => (
                                        inline 
                                            ? <code style={{ background: COLORS.codeBg, padding: "2px 6px", borderRadius: "4px", color: COLORS.accentBlue }} {...props} />
                                            : <pre style={{ background: COLORS.codeBg, padding: "20px", borderRadius: "12px", overflowX: "auto", border: "1px solid #1e293b", color: "#60a5fa" }}><code {...props} /></pre>
                                    ),
                                }}
                            >
                                {h2.content}
                            </ReactMarkdown>
                        </div>
                      </CollapsibleSection>
                    ))}
                  </CollapsibleSection>
                ))}

                {/* GRADIENT FADE FOR COLLAPSED STATE */}
                {!isNotesExpanded && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "100px",
                    background: `linear-gradient(transparent, ${COLORS.card})`,
                    pointerEvents: "none"
                  }} />
                )}
              </div>

              {/* TOGGLE BUTTON */}
              <button
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "12px",
                  background: "#1e293b",
                  border: "none",
                  borderRadius: "12px",
                  color: COLORS.accentBlue,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.3s"
                }}
                onMouseOver={(e) => e.target.style.background = "#334155"}
                onMouseOut={(e) => e.target.style.background = "#1e293b"}
              >
                {isNotesExpanded ? "↑ Show Less" : "↓ Read Full Notes"}
              </button>
            </motion.div>
          )}

          {/* QUIZ SECTION */}
          {quiz.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ backgroundColor: COLORS.card, padding: "40px", borderRadius: "24px", border: "1px solid #1e293b" }}
            >
              <h2 style={{ color: "#c084fc", fontSize: "1.6rem", marginBottom: "30px", display: "flex", alignItems: "center", gap: "12px", fontWeight: "800" }}>
                🧠 Interactive Quiz
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {quiz.map((q, qIdx) => (
                  <div key={qIdx} style={{ padding: "24px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b" }}>
                    <p style={{ fontWeight: "bold", color: "white", marginBottom: "20px", fontSize: "1.15rem" }}>
                      <span style={{ color: COLORS.textDim, marginRight: "12px" }}>{qIdx + 1}.</span> 
                      {q.question}
                    </p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === opt;
                        const isCorrect = opt === q.correct_answer;
                        
                        let bgColor = "rgba(255,255,255,0.03)";
                        let borderColor = "#1e293b";
                        let textColor = "white";

                        if (selectedAnswers[qIdx]) {
                          if (isCorrect) {
                            bgColor = "#065f46";
                            borderColor = "#10b981";
                          } else if (isSelected) {
                            bgColor = "#7f1d1d";
                            borderColor = "#ef4444";
                          }
                        }

                        return (
                          <button 
                            key={oIdx}
                            onClick={() => handleOptionClick(qIdx, opt)}
                            style={{ 
                                textAlign: "left", 
                                padding: "16px", 
                                borderRadius: "12px", 
                                border: `1px solid ${borderColor}`, 
                                backgroundColor: bgColor, 
                                color: textColor, 
                                cursor: "pointer", 
                                transition: "all 0.2s",
                                fontSize: "1rem"
                            }}
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
                        style={{ marginTop: "24px", padding: "18px", backgroundColor: "rgba(96, 165, 250, 0.08)", borderRadius: "12px", borderLeft: `4px solid ${COLORS.accentBlue}` }}
                      >
                        <p style={{ margin: 0, fontSize: "0.95rem", color: "#cbd5e1" }}>
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
