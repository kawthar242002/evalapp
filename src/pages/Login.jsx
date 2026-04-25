import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Email ou mot de passe incorrect");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Eval<span style={styles.accent}>Pro</span></h1>
        <p style={styles.sub}>Espace professeur</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.btn} type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4fe" },
  card: { background: "white", padding: "2.5rem", borderRadius: "16px", width: "100%", maxWidth: "400px", border: "0.5px solid #e0dff8" },
  title: { fontSize: "28px", fontWeight: "500", margin: "0 0 4px" },
  accent: { color: "#534AB7" },
  sub: { color: "#888", fontSize: "14px", margin: "0 0 1.5rem" },
  error: { color: "#E24B4A", fontSize: "13px", marginBottom: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "12px 14px", borderRadius: "8px", border: "0.5px solid #ddd", fontSize: "14px", outline: "none" },
  btn: { padding: "12px", borderRadius: "8px", background: "#534AB7", color: "white", border: "none", fontSize: "15px", fontWeight: "500", cursor: "pointer" }
};