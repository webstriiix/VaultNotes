import {
    InternetIdentityProvider,
    useInternetIdentity,
} from "ic-use-internet-identity";
import {
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import CreateNote from "./pages/Notes/CreateNote";
import Notes from "./pages/Notes/Notes";
import UpdateNote from "./pages/Notes/UpdateNote";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Nft/Marketplace";

function ProtectedRoute({ children }) {
    const { identity } = useInternetIdentity();
    if (!identity) return <Navigate to="/" replace />;
    return children;
}

function App() {
    return (
        <InternetIdentityProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notes"
                        element={
                            <ProtectedRoute>
                                <Notes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-note"
                        element={
                            <ProtectedRoute>
                                <CreateNote />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/update-note/:id"
                        element={
                            <ProtectedRoute>
                                <UpdateNote />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/marketplace"
                        element={
                            <ProtectedRoute>
                                <Marketplace />
                            </ProtectedRoute>
                        } />
                    <Route path="*" element={<NotFound />} />
                </Routes>

                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
            </Router>
        </InternetIdentityProvider>
    );
}

export default App;
