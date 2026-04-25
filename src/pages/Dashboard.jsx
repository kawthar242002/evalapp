import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [newStudent, setNewStudent] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sessions"), (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const createSession = async () => {
    if (!sessionName.trim()) return;
    const ref = await addDoc(collection(db, "sessions"), {
      name: sessionName,
      students: [],
      createdAt: new Date(),
    });
    setSessionName("");
    setActiveSession(ref.id);
  };

  const addStudent = async () => {
    if (!newStudent.trim() || !activeSession) return;
    const session = sessions.find((s) => s.id === activeSession);
    const updated = [...(session.students || []), newStudent.trim()];
    await updateDoc(doc(db, "sessions", activeSession), { students: updated });
    setNewStudent("");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const sessionUrl = (id) => `${window.location.origin}/noter/${id}`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Eval<span style={styles.accent}>Pro</span></h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Déconnexion</button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Créer une session</h2>
        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Nom de la session ex: Groupe A"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
          <button style={styles.btn} onClick={createSession}>Créer</button>
        </div>
      </div>

      {sessions.map((session) => (
        <div key={session.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>{session.name}</h3>
            <span style={styles.badge}>{(session.students || []).length} étudiant(s)</span>
          </div>

          {activeSession === session.id && (
            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Nom de l'étudiant"
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
              />
              <button style={styles.btn} onClick={addStudent}>Ajouter</button>
            </div>
          )}

          <div style={styles.studentList}>
            {(session.students || []).map((s, i) => (
              <span key={i} style={styles.studentTag}>{s}</span>
            ))}
          </div>

          <div style={styles.qrSection}>
            <QRCodeSVG value={sessionUrl(session.id)} size={120} />
            <div style={styles.qrInfo}>
              <p style={styles.qrLabel}>Lien pour les étudiants</p>
              <p style={styles.qrUrl}>{sessionUrl(session.id)}</p>
              <button style={styles.smallBtn} onClick={() => setActiveSession(session.id)}>
                + Ajouter un étudiant
              </button>
            </div>
          </div>

          <div style={styles.notesSection}>
            <h4 style={styles.notesTitle}>Notes reçues</h4>
            {(session.students || []).map((student) => {
              const notes = (session.notes || []).filter((n) => n.etudiant === student);
              const avg = notes.length
                ? (notes.reduce((a, b) => a + b.total, 0) / notes.length).toFixed(1)
                : null;
              return (
                <div key={student} style={styles.noteRow}>
                  <span style={styles.studentName}>{student}</span>
                  <span style={styles.noteVal}>
                    {avg ? `Moyenne : ${avg}/50` : "En attente..."}
                  </span>
                  <span style={styles.noteCount}>
                    {notes.length} vote(s)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "24px", fontWeight: "500" },
  accent: { color: "#534AB7" },
  logoutBtn: { background: "none", border: "0.5px solid #ddd", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  section: { marginBottom: "2rem" },
  sectionTitle: { fontSize: "16px", fontWeight: "500", marginBottom: "12px" },
  row: { display: "flex", gap: "10px" },
  input: { flex: 1, padding: "11px 14px", borderRadius: "8px", border: "0.5px solid #ddd", fontSize: "14px" },
  btn: { padding: "11px 20px", borderRadius: "8px", background: "#534AB7", color: "white", border: "none", cursor: "pointer", fontWeight: "500", whiteSpace: "nowrap" },
  card: { background: "white", borderRadius: "16px", border: "0.5px solid #e8e8e8", padding: "1.5rem", marginBottom: "1.5rem" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  cardTitle: { fontSize: "16px", fontWeight: "500" },
  badge: { background: "#EEEDFE", color: "#3C3489", fontSize: "12px", padding: "4px 12px", borderRadius: "20px" },
  studentList: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "1rem 0" },
  studentTag: { background: "#f5f4fe", color: "#534AB7", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" },
  qrSection: { display: "flex", gap: "1.5rem", alignItems: "center", padding: "1rem", background: "#fafafa", borderRadius: "12px", marginBottom: "1rem" },
  qrInfo: { flex: 1 },
  qrLabel: { fontSize: "13px", color: "#888", margin: "0 0 4px" },
  qrUrl: { fontSize: "12px", color: "#534AB7", wordBreak: "break-all", margin: "0 0 12px" },
  smallBtn: { background: "none", border: "0.5px solid #534AB7", color: "#534AB7", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  notesSection: { borderTop: "0.5px solid #f0f0f0", paddingTop: "1rem" },
  notesTitle: { fontSize: "14px", fontWeight: "500", marginBottom: "10px" },
  noteRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #f5f5f5" },
  studentName: { fontSize: "14px", flex: 1 },
  noteVal: { fontSize: "14px", color: "#534AB7", fontWeight: "500" },
  noteCount: { fontSize: "12px", color: "#aaa", marginLeft: "12px" },
};