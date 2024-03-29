import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import AuthProvider from "./context/AuthContext"
import { QueryProvider } from "./lib/react-query/QueryProvider"
import { ErrorBoundary } from "./components/error"
import { ErrorMessage } from "./components/error"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryProvider>
      <AuthProvider>
        <ErrorBoundary fallback={<ErrorMessage />}>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </QueryProvider>
  </BrowserRouter>
)
