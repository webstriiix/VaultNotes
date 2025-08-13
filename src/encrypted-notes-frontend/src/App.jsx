import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { InternetIdentityProvider, useInternetIdentity } from "ic-use-internet-identity";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import CreateNotes from "./pages/Notes/CreateNotes";
import Notes from "./pages/Notes/Notes";
import NotFound from "./pages/NotFound";
import Actors from "./components/sections/Actors";

function ProtectedRoute({ children }) {
  const { identity } = useInternetIdentity();
  if (!identity) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <InternetIdentityProvider>
      <Actors>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/create-notes" element={<ProtectedRoute><CreateNotes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </Actors>
    </InternetIdentityProvider>
  );
}

export default App;
