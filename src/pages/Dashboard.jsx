import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

const GRILLE = [
  {
    section: "A — Contenu et langage verbal",
    sousSections: [
      {
        titre: "I / Compétence pragmatique",
        criteres: [
          { label: "Respect de la consigne / tâche : contenu + temps", max: 2 },
          { label: "Structure de l'exposé", max: 2 },
          { label: "Qualité des arguments", max: 2 },
          { label: "Illustration : pertinence des exemples", max: 1 },
          { label: "Cohérence et cohésion", max: 1 },
        ],
      },
      {
        titre: "II / Compétence sociolinguistique",
        criteres: [
          { label: "Adéquation sociolinguistique", max: 4 },
        ],
      },
      {
        titre: "III / Compétence linguistique",
        criteres: [
          { label: "Lexique", max: 2 },
          { label: "Morphosyntaxe", max: 2 },
          { label: "Orthographe", max: 2 },
          { label: "Formes verbales", max: 2 },
        ],
      },
    ],
  },
  {
    section: "B — Langage non verbal",
    sousSections: [
      {
        titre: "I / Langage du corps",
        criteres: [
          { label: "Posture", max: 1 },
          { label: "Occupation de l'espace", max: 1 },
          { label: "Déplacements", max: 1 },
          { label: "Gestes", max: 2 },
          { label: "Regard / contact visuel", max: 2 },
          { label: "Mimique / Expressions du visage", max: 2 },
          { label: "Coiffure", max: 1 },
          { label: "Tenue vestimentaire", max: 1 },
        ],
      },
      {
        titre: "II / Langage paraverbal",
        criteres: [
          { label: "Volume", max: 2 },
          { label: "Débit", max: 2 },
          { label: "Intonation", max: 2 },
          { label: "Ton professionnel", max: 2 },
          { label: "Articulation", max: 1 },
          { label: "Gestion des pauses", max: 1 },
        ],
      },
    ],
  },
  {
    section: "C — Support visuel",
    sousSections: [
      {
        titre: "",
        criteres: [
          { label: "Charte graphique et cohérence visuelle", max: 2 },
          { label: "Structure formelle et organisation du diaporama", max: 2 },
          { label: "Lisibilité typographique", max: 2 },
          { label: "Gestion de l'espace visuel", max: 2 },
          { label: "Qualité des visuels scientifiques et des illustrations", max: 2 },
        ],
      },
    ],
  },
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
      if (d.exists()) setSession({ id: d.id, ...d.data() });
    });
  }, [sessionId]);

  const total = Object.values(notes).reduce((a, b) => a + b, 0);

  const setNote = (key, val) => setNotes((prev) => ({ ...prev, [key]: parseFloat(val) }));

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
        <span style={styles.totalBadge}>{total.toFixed(1)} / 50</span>
      </div>
      <p style={styles.notingLabel}>Tu notes : <strong>{etudiantChoisi}</strong></p>

      {GRILLE.map((part) => (
        <div key={part.section} style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>{part.section}</h2>
          {part.sousSections.map((ss) => (
            <div key={ss.titre} style={styles.sousSection}>
              {ss.titre ? <p style={styles.sousTitre}>{ss.titre}</p> : null}
              {ss.criteres.map((c) => {
                const val = notes[c.label] ?? 0;
                const steps = [];
                for (let v = 0; v <= c.max; v += 0.5) steps.push(parseFloat(v.toFixed(1)));
                return (
                  <div key={c.label} style={styles.critRow}>
                    <div style={styles.critTop}>
                      <span style={styles.critLabel}>{c.label}</span>
                      <span style={styles.critVal}>{val.toFixed(1)} / {c.max}</span>
                    </div>
                    <div style={styles.sliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={c.max}
                        step={0.5}
                        value={val}
                        onChange={(e) => setNote(c.label, e.target.value)}
                        style={styles.slider}
                      />
                      <div style={styles.sliderLabels}>
                        <span>0</span>
                        <span>{c.max}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <div style={styles.submitSection}>
        <div style={styles.totalBar}>
          <span style={{ fontSize: "14px", color: "#666" }}>Note totale</span>
          <span style={styles.totalNum}>{total.toFixed(1)} <span style={{ fontSize: "16px", color: "#aaa" }}>/ 50</span></span>
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
  page: { maxWidth: "640px", margin: "0 auto", padding: "1rem 1rem 2rem" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  title2: { fontSize: "20px", fontWeight: "500" },
  totalBadge: { background: "#EEEDFE", color: "#3C3489", padding: "6px 16px", borderRadius: "20px", fontWeight: "500" },
  notingLabel: { fontSize: "14px", color: "#666", marginBottom: "1.5rem" },
  sectionCard: { background: "white", borderRadius: "12px", border: "0.5px solid #e8e8e8", padding: "1.25rem", marginBottom: "1rem" },
  sectionTitle: { fontSize: "15px", fontWeight: "500", color: "#534AB7", marginBottom: "1rem" },
  sousSection: { marginBottom: "1rem" },
  sousTitre: { fontSize: "12px", fontWeight: "500", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" },
  critRow: { marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "0.5px solid #f5f5f5" },
  critTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  critLabel: { fontSize: "13px", color: "#444", flex: 1, paddingRight: "8px" },
  critVal: { fontSize: "13px", fontWeight: "500", color: "#534AB7", minWidth: "48px", textAlign: "right" },
  sliderWrap: { width: "100%" },
  slider: { width: "100%", accentColor: "#534AB7", height: "4px", cursor: "pointer" },
  sliderLabels: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#bbb", marginTop: "2px" },
  submitSection: { marginTop: "1.5rem", marginBottom: "3rem" },
  totalBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "#f5f4fe", borderRadius: "12px", marginBottom: "12px" },
  totalNum: { fontSize: "28px", fontWeight: "500", color: "#534AB7" },
  submitBtn: { width: "100%", padding: "14px", borderRadius: "10px", background: "#534AB7", color: "white", border: "none", fontSize: "16px", fontWeight: "500", cursor: "pointer" },
  successCard: { background: "white", padding: "3rem 2rem", borderRadius: "16px", textAlign: "center", border: "0.5px solid #e0dff8" },
  checkmark: { fontSize: "48px", color: "#1D9E75", marginBottom: "1rem" },
  successTitle: { fontSize: "22px", fontWeight: "500", margin: "0 0 8px" },
  successSub: { color: "#666", fontSize: "15px" },
};