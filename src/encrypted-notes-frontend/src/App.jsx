<<<<<<< HEAD
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { InternetIdentityProvider, useInternetIdentity } from "ic-use-internet-identity";
import Dashboard from "./pages/Dashboard";
=======
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
>>>>>>> 651b38e6d85e2cc2a27cdff82a149c49867e9763
import Home from "./pages/Home";
import CreateNotes from "./pages/Notes/CreateNotes";
import Notes from "./pages/Notes/Notes";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }) {
  const { identity } = useInternetIdentity();
  if (!identity) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
<<<<<<< HEAD
    <InternetIdentityProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/create-notes" element={<ProtectedRoute><CreateNotes /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </InternetIdentityProvider>
=======
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/create-notes" element={<CreateNotes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
>>>>>>> 651b38e6d85e2cc2a27cdff82a149c49867e9763
  );
}

export default App;
