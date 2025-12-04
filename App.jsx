import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {
  const [file, setFile] = useState(null);
  const [shortNotes, setShortNotes] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      // Ensure your backend URL is correct (http://127.0.0.1:8000/upload)
      const res = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setShortNotes(res.data.short_notes || "");
      setQuiz(res.data.quiz || []);
    } catch (err) {
      console.error(err);
      alert("Error uploading file. Make sure the backend is running!");
    } finally {
      setLoading(false);
    }
  };

  // Helper to clean quiz questions more aggressively
  const cleanQuizQuestion = (question) => {
    if (!question) return "";
    // Removes: "1.", "1What", "Q1:", "Question 1:", "**1**", bullet points
    return question
      .replace(/^[\d\.\)\-]+\s*/, "") // Remove leading numbers, dots, dashes
      .replace(/^(Question\s*\d+|Q\d+|[-•*])\s*/gi, "") // Remove question labels and bullets
      .replace(/^\d+/, "") // Additional digit cleanup
      .trim();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            🚀 SaarthX <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded">Student Buddy</span>
          </h1>
          <p className="mt-2 text-blue-100">Upload your PDF and get instant smart notes.</p>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4 items-center">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
              }`}
            >
              {loading ? "Analyzing..." : "Generate Notes"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-8">
          
          {/* Section: Short Notes */}
          {shortNotes && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📑 Smart Notes
              </h2>
              
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-blue-700 prose-h2:text-indigo-600 prose-h3:text-purple-600 prose-strong:text-blue-800 prose-li:marker:text-blue-500">
                {/*  */}
                <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-blue-800 border-b-2 border-blue-100 pb-2 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-indigo-700 mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-purple-600 mt-4 mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 text-gray-700 mb-4" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded-r italic text-gray-700 shadow-sm" {...props} />
                    ),
                    strong: ({node, ...props}) => <strong className="font-bold text-blue-900 bg-blue-50 px-1 rounded" {...props} />,
                    
                    // Note: Tables will render as plain text without GFM, but we keep styling in case standard markdown tables are used.
                    table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm"><table className="min-w-full divide-y divide-gray-200" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                    th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
                    td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" {...props} />,
                  }}
                >
                  {shortNotes}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Section: Quiz */}
          {quiz.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 animate-fade-in-up delay-100">
              <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                🧠 Quick Quiz
              </h2>
              <ul className="space-y-3">
                {quiz.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 font-medium self-center">{cleanQuizQuestion(q)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;