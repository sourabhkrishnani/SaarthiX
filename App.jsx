import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {
  const [file, setFile] = useState(null);
  const [shortNotes, setShortNotes] = useState("");

  // Quiz is an array of objects
  const [quiz, setQuiz] = useState([]);

  // User answers: { 0: "Option A", 1: "Option C", ... }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setShortNotes("");
      setQuiz([]);
      setSelectedAnswers({});

      const res = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("QUIZ RESPONSE:", res.data.quiz);

      setShortNotes(res.data.short_notes || "");
      setQuiz(res.data.quiz || []);
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (qIndex, option) => {
    if (selectedAnswers[qIndex]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const getOptionClass = (qIndex, option, correctAnswer) => {
    const userSelected = selectedAnswers[qIndex];

    if (!userSelected)
      return "bg-gray-100 hover:bg-gray-200 text-gray-700";

    if (option === correctAnswer)
      return "bg-green-100 border-2 border-green-500 text-green-700 font-medium";

    if (userSelected === option && option !== correctAnswer)
      return "bg-red-100 border-2 border-red-500 text-red-700";

    return "bg-gray-50 text-gray-400 cursor-not-allowed";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            🚀 SaarthX
            <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
              Student Buddy
            </span>
          </h1>
          <p className="mt-2 text-blue-100 opacity-90">
            Upload your PDF and get instant smart notes & interactive quizzes.
          </p>
        </div>

        {/* Upload */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-4 items-center">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 
              file:mr-4 file:py-2.5 file:px-6 file:rounded-full 
              file:border-0 file:text-sm file:font-bold 
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
              cursor-pointer transition-all"
            />

            <button
              onClick={handleUpload}
              disabled={loading}
              className={`px-8 py-2.5 rounded-full font-bold transition-all transform active:scale-95 ${
                loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
              }`}
            >
              {loading ? "Analyzing..." : "Generate Notes"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-12">

          {/* Smart Notes */}
          {shortNotes && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                📑 Smart Notes
              </h2>

              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => (
                    <h1 className="text-3xl font-extrabold text-blue-800 border-b-2 pb-2 mb-4" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-2xl font-bold text-indigo-700 mt-6 mb-3" {...props} />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4" {...props} />
                  )
                }}
              >
                {shortNotes}
              </ReactMarkdown>
            </div>
          )}

          {/* Quiz Section */}
          {quiz.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-purple-800 mb-6 border-b pb-2">
                🧠 Interactive Quiz
              </h2>

              <div className="grid gap-6">
                {quiz.map((q, index) => (
                  <div key={index} className="bg-white border rounded-xl p-6 shadow-sm">

                    {/* Handle missing quiz fields */}
                    {!q?.options || !Array.isArray(q.options) ? (
                      <div className="text-red-600 font-medium">
                        ⚠️ Invalid quiz item: options missing for question {index + 1}
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex gap-3">
                          <span className="bg-purple-100 text-purple-600 w-8 h-8 flex items-center justify-center rounded-full">
                            {index + 1}
                          </span>
                          {q.question}
                        </h3>

                        <div className="grid gap-3 ml-11">
                          {q.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => handleOptionClick(index, option)}
                              className={`w-full text-left px-5 py-3 rounded-lg border transition-all duration-200 ${getOptionClass(
                                index,
                                option,
                                q.correct_answer
                              )}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        {selectedAnswers[index] && (
                          <div
                            className={`ml-11 mt-4 p-4 rounded-lg text-sm ${
                              selectedAnswers[index] === q.correct_answer
                                ? "bg-green-50 text-green-800 border border-green-100"
                                : "bg-red-50 text-red-800 border border-red-100"
                            }`}
                          >
                            <strong>
                              {selectedAnswers[index] === q.correct_answer
                                ? "🎉 Correct!"
                                : "❌ Incorrect."}
                            </strong>
                            <span className="block mt-1">{q.rationale}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
