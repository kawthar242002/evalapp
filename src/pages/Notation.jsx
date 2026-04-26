import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

const GRILLE = [
  { section: "A — Contenu verbal", criteres: [
    { label: "Respect de la consigne / tâche", max: 2 },
    { label: "Structure de l'exposé", max: 2 },
    { label: "Qualité des arguments", max: 2 },
    { label: "Illustration / pertinence des exemples", max: 1 },
    { label: "Cohérence et cohésion", max: 1 },
    { label: "Adéquation sociolinguistique", max: 4 },
    { label: "Lexique", max: 2 },
    { label: "Morphosyntaxe", max: 2 },
    { label: "Orthographe", max: 2 },
    { label: "Formes verbales", max: 2 },
  ]},
  { section: "B — Langage non verbal", criteres: [
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
  ]},
  { section: "C — Support visuel", criteres: [
    { label: "Charte graphique et cohérence visuelle", max: 2 },
    { label: "Structure formelle et organisation du diaporama", max: 2 },
    { label: "Lisibilité typographique", max: 2 },
    { label: "Gestion de l'espace visuel", max: 2 },
    { label: "Qualité des visuels scientifiques", max: 2 },
  ]},
];

export default function Notation() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [evaluateur, setEvaluateur] = useState("");
  const [etudiantChoisi, setEtudiantChoisi] = useState("");
  const [notes, setNotes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState("identity");

  useEffect(() => {
  getDoc(doc(db, "sessions", sessionId)).then((d) => {
    if (d.exists()) {
      const data = d.data();
      setSession({ 
        id: d.id, 
        ...data,
        students: data.students || [],
        notes: data.notes || []
      });
    }
  }).catch((err) => {
    console.error("Erreur chargement session:", err);
  });
}, [sessionId]);

  const total = Object.values(notes).reduce((a, b) => a + b, 0);

  const setNote = (key, val) => setNotes((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    const entry = {
      evaluateur,
      etudiant: etudiantChoisi,
      notes,
      total,
      date: new Date().toISOString(),
    };
    await updateDoc(doc(db, "sessions", sessionId), {
      notes: arrayUnion(entry),
    });
    setSubmitted(true);
  };

  if (!session) return <div style={styles.center}>Chargement...</div>;
  if (submitted) return (
    <div style={styles.center}>
      <div style={styles.successCard}>
        <div style={styles.checkmark}>✓</div>
        <h2 style={styles.successTitle}>Note envoyée !</h2>
        <p style={styles.successSub}>Total : <strong>{total}/50</strong></p>
        <p style={styles.successSub}>Merci pour ton évaluation.</p>
      </div>
    </div>
  );

  if (step === "identity") return (
    <div style={styles.center}>
      <div style={styles.card}>
        <h1 style={styles.title}>Eval<span style={styles.accent}>Pro</span></h1>
        <p style={styles.sub}>Session : <strong>{session.name}</strong></p>
        <input
          style={styles.input}
          placeholder="Ton prénom"
          value={evaluateur}
          onChange={(e) => setEvaluateur(e.target.value)}
        />
        <p style={{ fontSize: "14px", margin: "1rem 0 8px", fontWeight: "500" }}>Tu notes :</p>
        <div style={styles.studentGrid}>
          {(session.students || []).map((s) => (
            <div
              key={s}
              style={{ ...styles.studentOption, ...(etudiantChoisi === s ? styles.studentSelected : {}) }}
              onClick={() => setEtudiantChoisi(s)}
            >
              {s}
            </div>
          ))}
        </div>
        <button
          style={{ ...styles.btn, opacity: evaluateur && etudiantChoisi ? 1 : 0.5 }}
          onClick={() => evaluateur && etudiantChoisi && setStep("noter")}
        >
          Commencer la notation →
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <span style={styles.title2}>Eval<span style={styles.accent}>Pro</span></span>
        <span style={styles.totalBadge}>{total} / 50</span>
      </div>
      <p style={styles.notingLabel}>Tu notes : <strong>{etudiantChoisi}</strong></p>

      {GRILLE.map((section) => (
        <div key={section.section} style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>{section.section}</h3>
          {section.criteres.map((c) => {
            const key = c.label;
            const val = notes[key] ?? 0;
            return (
              <div key={key} style={styles.critRow}>
                <span style={styles.critLabel}>{c.label}</span>
                <div style={styles.dotsRow}>
                  {Array.from({ length: c.max * 2 + 1 }, (_, i) => i * 0.5).map((v) => (
                    <button
                      key={v}
                      style={{ ...styles.dot, ...(val >= v && v > 0 ? styles.dotActive : {}), ...(v === 0 ? styles.dotZero : {}) }}
                      onClick={() => setNote(key, v)}
                    >
                      {v === val ? "●" : "○"}
                    </button>
                  ))}
                </div>
                <span style={styles.noteDisp}>{val}/{c.max}</span>
              </div>
            );
          })}
        </div>
      ))}

      <div style={styles.submitSection}>
        <div style={styles.totalBar}>
          <span>Note totale</span>
          <span style={styles.totalNum}>{total} <span style={{ fontSize: "16px", color: "#aaa" }}>/ 50</span></span>
        </div>
        <button style={styles.submitBtn} onClick={handleSubmit}>Valider et envoyer ✓</button>
      </div>
    </div>
  );
}

const styles = {
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4fe", padding: "1rem" },
  card: { background: "white", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "420px", border: "0.5px solid #e0dff8", display: "flex", flexDirection: "column", gap: "12px" },
  title: { fontSize: "26px", fontWeight: "500", margin: 0 },
  accent: { color: "#534AB7" },
  sub: { fontSize: "14px", color: "#666", margin: 0 },
  input: { padding: "12px 14px", borderRadius: "8px", border: "0.5px solid #ddd", fontSize: "14px" },
  studentGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  studentOption: { padding: "8px 16px", borderRadius: "20px", border: "0.5px solid #ddd", cursor: "pointer", fontSize: "14px" },
  studentSelected: { background: "#534AB7", color: "white", border: "0.5px solid #534AB7" },
  btn: { padding: "13px", borderRadius: "8px", background: "#534AB7", color: "white", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "15px" },
  page: { maxWidth: "640px", margin: "0 auto", padding: "1rem" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  title2: { fontSize: "20px", fontWeight: "500" },
  totalBadge: { background: "#EEEDFE", color: "#3C3489", padding: "6px 16px", borderRadius: "20px", fontWeight: "500" },
  notingLabel: { fontSize: "14px", color: "#666", marginBottom: "1.5rem" },
  sectionCard: { background: "white", borderRadius: "12px", border: "0.5px solid #e8e8e8", padding: "1.25rem", marginBottom: "1rem" },
  sectionTitle: { fontSize: "15px", fontWeight: "500", marginBottom: "1rem", color: "#534AB7" },
  critRow: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #f5f5f5" },
  critLabel: { flex: 1, fontSize: "13px", color: "#444" },
  dotsRow: { display: "flex", gap: "4px" },
  dot: { width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid #ddd", background: "none", cursor: "pointer", fontSize: "12px", color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
  dotActive: { border: "1.5px solid #534AB7", color: "#534AB7" },
  dotZero: { border: "1.5px solid #ffb3b3", color: "#ffb3b3" },
  noteDisp: { fontSize: "13px", color: "#888", minWidth: "32px", textAlign: "right" },
  submitSection: { marginTop: "1.5rem", marginBottom: "3rem" },
  totalBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "#f5f4fe", borderRadius: "12px", marginBottom: "12px" },
  totalNum: { fontSize: "28px", fontWeight: "500", color: "#534AB7" },
  submitBtn: { width: "100%", padding: "14px", borderRadius: "10px", background: "#534AB7", color: "white", border: "none", fontSize: "16px", fontWeight: "500", cursor: "pointer" },
  successCard: { background: "white", padding: "3rem 2rem", borderRadius: "16px", textAlign: "center", border: "0.5px solid #e0dff8" },
  checkmark: { fontSize: "48px", color: "#1D9E75", marginBottom: "1rem" },
  successTitle: { fontSize: "22px", fontWeight: "500", margin: "0 0 8px" },
  successSub: { color: "#666", fontSize: "15px" },
};