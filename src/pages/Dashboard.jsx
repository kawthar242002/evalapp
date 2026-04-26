import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const CRITERES = [
  { label: "Respect de la consigne / tâche : contenu + temps", max: 2 },
  { label: "Structure de l'exposé", max: 2 },
  { label: "Qualité des arguments", max: 2 },
  { label: "Illustration : pertinence des exemples", max: 1 },
  { label: "Cohérence et cohésion", max: 1 },
  { label: "Adéquation sociolinguistique", max: 4 },
  { label: "Lexique", max: 2 },
  { label: "Morphosyntaxe", max: 2 },
  { label: "Orthographe", max: 2 },
  { label: "Formes verbales", max: 2 },
  { label: "Posture", max: 1 },
  { label: "Occupation de l'espace", max: 1 },
  { label: "Déplacements", max: 1 },
  { label: "Gestes", max: 2 },
  { label: "Regard / contact visuel", max: 2 },
  { label: "Mimique / Expressions du visage", max: 2 },
  { label: "Coiffure", max: 1 },
  { label: "Tenue vestimentaire", max: 1 },
  { label: "Volume", max: 2 },
  { label: "Débit", max: 2 },
  { label: "Intonation", max: 2 },
  { label: "Ton professionnel", max: 2 },
  { label: "Articulation", max: 1 },
  { label: "Gestion des pauses", max: 1 },
  { label: "Charte graphique et cohérence visuelle", max: 2 },
  { label: "Structure formelle et organisation du diaporama", max: 2 },
  { label: "Lisibilité typographique", max: 2 },
  { label: "Gestion de l'espace visuel", max: 2 },
  { label: "Qualité des visuels scientifiques et des illustrations", max: 2 },
];

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [newStudent, setNewStudent] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sessions"), (snap) => {
      const data = snap.docs.map((d) => {
        const d2 = d.data();
        return {
          id: d.id,
          name: d2.name || "",
          students: d2.students || [],
          notes: d2.notes || [],
        };
      });
      setSessions(data);
    });
    return unsub;
  }, []);

  const createSession = async () => {
    if (!sessionName.trim()) return;
    const ref = await addDoc(collection(db, "sessions"), {
      name: sessionName,
      students: [],
      notes: [],
      createdAt: new Date().toISOString(),
    });
    setSessionName("");
    setActiveSession(ref.id);
  };

  const deleteSession = async (id) => {
    if (!confirm("Supprimer cette session ?")) return;
    await deleteDoc(doc(db, "sessions", id));
  };

  const addStudent = async () => {
    if (!newStudent.trim() || !activeSession) return;
    const session = sessions.find((s) => s.id === activeSession);
    const updated = [...(session.students || []), newStudent.trim()];
    await updateDoc(doc(db, "sessions", activeSession), { students: updated });
    setNewStudent("");
  };

  const removeStudent = async (sessionId, studentName) => {
    if (!confirm(`Supprimer ${studentName} ?`)) return;
    const session = sessions.find((s) => s.id === sessionId);
    const updated = (session.students || []).filter((s) => s !== studentName);
    const updatedNotes = (session.notes || []).filter((n) => n.etudiant !== studentName);
    await updateDoc(doc(db, "sessions", sessionId), { students: updated, notes: updatedNotes });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const sessionUrl = (id) => `https://evalapp-iota.vercel.app/noter/${id}`;

  const getStudentStats = (session, student) => {
    const votes = (session.notes || []).filter((n) => n.etudiant === student);
    if (!votes.length) return null;
    const critStats = CRITERES.map((c) => {
      const vals = votes.map((v) => (v.notes && v.notes[c.label] != null ? Number(v.notes[c.label]) : 0));
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { ...c, avg: avg.toFixed(1) };
    });
    const totalAvg = (votes.reduce((a, b) => a + Number(b.total || 0), 0) / votes.length).toFixed(1);
    return { votes, critStats, totalAvg };
  };

  if (selectedStudent) {
    const { sessionId, sessionName: sName, student } = selectedStudent;
    const session = sessions.find((s) => s.id === sessionId);
    const stats = session ? getStudentStats(session, student) : null;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setSelectedStudent(null)} style={styles.backBtn}>← Retour</button>
          <h1 style={styles.title}>Eval<span style={styles.accent}>Pro</span></h1>
        </div>

        <div style={styles.studentHeader}>
          <h2 style={styles.studentName}>{student}</h2>
          <span style={styles.sessionBadge}>{sName}</span>
        </div>

        {!stats ? (
          <div style={styles.emptyBox}>Aucun vote reçu pour cet étudiant.</div>
        ) : (
          <>
            <div style={styles.totalCard}>
              <span style={styles.totalLabel}>Moyenne générale</span>
              <span style={styles.totalNum}>{stats.totalAvg}<span style={styles.totalSub}>/50</span></span>
              <span style={styles.voteCount}>{stats.votes.length} vote(s)</span>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Votes reçus</h3>
              {stats.votes.map((v, i) => (
                <div key={i} style={styles.voteRow}>
                  <span style={styles.evaluateurName}>{v.evaluateur}</span>
                  <span style={styles.voteTotal}>{Number(v.total || 0).toFixed(1)}/50</span>
                  <span style={styles.voteDate}>{new Date(v.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Moyenne par critère</h3>
              {[
                { label: "A — Contenu verbal", range: [0, 10] },
                { label: "B — Langage non verbal", range: [10, 24] },
                { label: "C — Support visuel", range: [24, 29] },
              ].map((sec) => (
                <div key={sec.label} style={{ marginBottom: "1.5rem" }}>
                  <p style={styles.sectionLabel}>{sec.label}</p>
                  {stats.critStats.slice(sec.range[0], sec.range[1]).map((c) => (
                    <div key={c.label} style={styles.critRow}>
                      <span style={styles.critLabel}>{c.label}</span>
                      <div style={styles.barWrap}>
                        <div style={{ ...styles.bar, width: `${(c.avg / c.max) * 100}%` }} />
                      </div>
                      <span style={styles.critVal}>{c.avg}/{c.max}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

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
            onKeyDown={(e) => e.key === "Enter" && createSession()}
          />
          <button style={styles.btn} onClick={createSession}>Créer</button>
        </div>
      </div>

      {sessions.map((session) => (
        <div key={session.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>{session.name}</h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={styles.badge}>{(session.students || []).length} étudiant(s)</span>
              <button onClick={() => deleteSession(session.id)} style={styles.deleteBtn}>Supprimer</button>
            </div>
          </div>

          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Nom de l'étudiant"
              value={activeSession === session.id ? newStudent : ""}
              onChange={(e) => { setActiveSession(session.id); setNewStudent(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && addStudent()}
            />
            <button style={styles.btn} onClick={() => { setActiveSession(session.id); addStudent(); }}>Ajouter</button>
          </div>

          <div style={styles.studentList}>
            {(session.students || []).map((s, i) => (
              <div key={i} style={styles.studentChip}>
                <span style={styles.studentClickable} onClick={() => setSelectedStudent({ sessionId: session.id, sessionName: session.name, student: s })}>
                  {s}
                </span>
                <button onClick={() => removeStudent(session.id, s)} style={styles.removeBtn}>×</button>
              </div>
            ))}
          </div>

          <div style={styles.qrSection}>
            <QRCodeSVG value={sessionUrl(session.id)} size={120} />
            <div style={styles.qrInfo}>
              <p style={styles.qrLabel}>Lien pour les étudiants</p>
              <p style={styles.qrUrl}>{sessionUrl(session.id)}</p>
            </div>
          </div>

          <div style={styles.notesSection}>
            <h4 style={styles.notesTitle}>Notes reçues</h4>
            {(session.students || []).map((student) => {
              const notes = (session.notes || []).filter((n) => n.etudiant === student);
              const avg = notes.length
                ? (notes.reduce((a, b) => a + Number(b.total || 0), 0) / notes.length).toFixed(1)
                : null;
              return (
                <div key={student} style={{ ...styles.noteRow, cursor: "pointer" }}
                  onClick={() => setSelectedStudent({ sessionId: session.id, sessionName: session.name, student })}>
                  <span style={styles.studentNameNote}>{student}</span>
                  <span style={styles.noteVal}>{avg ? `Moyenne : ${avg}/50` : "En attente..."}</span>
                  <span style={styles.noteCount}>{notes.length} vote(s)</span>
                  <span style={styles.arrow}>→</span>
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
  backBtn: { background: "none", border: "0.5px solid #ddd", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  section: { marginBottom: "2rem" },
  sectionTitle: { fontSize: "15px", fontWeight: "500", marginBottom: "1rem", color: "#534AB7" },
  sectionLabel: { fontSize: "13px", fontWeight: "500", color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  row: { display: "flex", gap: "10px", marginBottom: "1rem" },
  input: { flex: 1, padding: "11px 14px", borderRadius: "8px", border: "0.5px solid #ddd", fontSize: "14px" },
  btn: { padding: "11px 20px", borderRadius: "8px", background: "#534AB7", color: "white", border: "none", cursor: "pointer", fontWeight: "500", whiteSpace: "nowrap" },
  deleteBtn: { background: "none", border: "0.5px solid #E24B4A", color: "#E24B4A", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
  card: { background: "white", borderRadius: "16px", border: "0.5px solid #e8e8e8", padding: "1.5rem", marginBottom: "1.5rem" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  cardTitle: { fontSize: "16px", fontWeight: "500" },
  badge: { background: "#EEEDFE", color: "#3C3489", fontSize: "12px", padding: "4px 12px", borderRadius: "20px" },
  studentList: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "1rem 0" },
  studentChip: { display: "flex", alignItems: "center", background: "#f5f4fe", borderRadius: "20px", overflow: "hidden" },
  studentClickable: { color: "#534AB7", padding: "4px 10px", fontSize: "13px", cursor: "pointer" },
  removeBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "4px 8px", fontSize: "14px" },
  qrSection: { display: "flex", gap: "1.5rem", alignItems: "center", padding: "1rem", background: "#fafafa", borderRadius: "12px", marginBottom: "1rem" },
  qrInfo: { flex: 1 },
  qrLabel: { fontSize: "13px", color: "#888", margin: "0 0 4px" },
  qrUrl: { fontSize: "12px", color: "#534AB7", wordBreak: "break-all", margin: 0 },
  notesSection: { borderTop: "0.5px solid #f0f0f0", paddingTop: "1rem" },
  notesTitle: { fontSize: "14px", fontWeight: "500", marginBottom: "10px" },
  noteRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #f5f5f5" },
  studentNameNote: { fontSize: "14px", flex: 1 },
  noteVal: { fontSize: "14px", color: "#534AB7", fontWeight: "500" },
  noteCount: { fontSize: "12px", color: "#aaa", marginLeft: "12px" },
  arrow: { color: "#534AB7", marginLeft: "8px" },
  studentHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" },
  studentName: { fontSize: "22px", fontWeight: "500" },
  sessionBadge: { background: "#EEEDFE", color: "#3C3489", fontSize: "12px", padding: "4px 12px", borderRadius: "20px" },
  totalCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#534AB7", color: "white", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" },
  totalLabel: { fontSize: "14px", opacity: 0.8 },
  totalNum: { fontSize: "36px", fontWeight: "500" },
  totalSub: { fontSize: "16px", opacity: 0.7 },
  voteCount: { fontSize: "13px", opacity: 0.8 },
  voteRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #f5f5f5" },
  evaluateurName: { flex: 1, fontSize: "14px" },
  voteTotal: { fontSize: "14px", fontWeight: "500", color: "#534AB7" },
  voteDate: { fontSize: "12px", color: "#aaa", marginLeft: "12px" },
  critRow: { display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" },
  critLabel: { flex: 1, fontSize: "12px", color: "#555" },
  barWrap: { width: "120px", height: "6px", background: "#EEEDFE", borderRadius: "999px", overflow: "hidden" },
  bar: { height: "100%", background: "#534AB7", borderRadius: "999px", transition: "width 0.3s" },
  critVal: { fontSize: "12px", color: "#534AB7", minWidth: "36px", textAlign: "right" },
  emptyBox: { background: "white", borderRadius: "16px", padding: "2rem", textAlign: "center", color: "#aaa", border: "0.5px solid #e8e8e8" },
};