import { useState, useRef, useEffect } from "react";

/* ── Google Fonts ── */
const FontLink = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');`}</style>
);

/* ── Design Tokens ── */
const C = {
  bgPage: "#EDF2E7",
  bgCard: "#FFFFFF",
  bgCardAlt: "#F5F8F1",
  primary: "#1A3A0A",
  primaryMid: "#2E6B16",
  primaryLight: "#4A9926",
  gold: "#C8921A",
  goldLight: "#F5C842",
  goldBg: "#FDF5E0",
  red: "#C0381F",
  redBg: "#FDECEA",
  orange: "#D46B12",
  orangeBg: "#FEF0E1",
  green: "#1A7A2E",
  greenBg: "#E6F4EB",
  blue: "#1558A8",
  blueBg: "#E4EFFE",
  border: "#CDD9BF",
  borderLight: "#E2EDD9",
  text: "#111C08",
  textMid: "#3D5228",
  textMute: "#6B7D5A",
  white: "#FFFFFF",
};

/* ── Language Strings ── */
const LANG = {
  en: {
    appName: "KisanLens", tagline: "AI Crop Doctor",
    home: "Home", scan: "Scan", result: "Result", history: "History", schemes: "Schemes",
    tapScan: "Tap to scan your crop", orUpload: "or choose from gallery",
    analyzing: "Analysing your crop…", scanBtn: "Analyse Crop",
    diagnosis: "Diagnosis", treatment: "Treatment Plan", causes: "Causes",
    prevention: "Prevention", govtSchemes: "Government Schemes",
    severity: "Severity", confidence: "Confidence", urgency: "Next Step",
    recentScans: "Recent scans", noHistory: "No scans yet",
    scanFirst: "Scan your first crop", scanAnother: "Scan another crop",
    healthy: "Healthy", mild: "Mild", moderate: "Moderate", severe: "Severe",
    step: "Step", howToApply: "How to apply", benefit: "Benefit",
    uploadPhoto: "Upload Photo", changePhoto: "Change Photo",
    hi: "हिंदी", en: "English",
    errorMsg: "Could not analyse the image. Please try a clearer photo.",
    greeting: "Good day, Kisan!",
    greetingSub: "How is your crop today?",
    statScans: "Total Scans", statDiseases: "Detected", statHealthy: "Healthy",
    quickTip: "Quick Tip", tipText: "Best time to scan is in morning light for accurate results.",
    viewResult: "View result",
    chemicalWarning: "Use protective gear. Follow pre-harvest safety interval (days shown).",
  },
  hi: {
    appName: "किसानलेंस", tagline: "AI फसल डॉक्टर",
    home: "होम", scan: "स्कैन", result: "परिणाम", history: "इतिहास", schemes: "योजनाएं",
    tapScan: "फसल स्कैन करने के लिए टैप करें", orUpload: "या गैलरी से चुनें",
    analyzing: "फसल का विश्लेषण हो रहा है…", scanBtn: "फसल जांचें",
    diagnosis: "निदान", treatment: "उपचार योजना", causes: "कारण",
    prevention: "बचाव", govtSchemes: "सरकारी योजनाएं",
    severity: "गंभीरता", confidence: "विश्वास", urgency: "अगला कदम",
    recentScans: "हाल के स्कैन", noHistory: "अभी तक कोई स्कैन नहीं",
    scanFirst: "पहली फसल स्कैन करें", scanAnother: "दूसरी फसल स्कैन करें",
    healthy: "स्वस्थ", mild: "हल्का", moderate: "मध्यम", severe: "गंभीर",
    step: "चरण", howToApply: "कैसे लगाएं", benefit: "लाभ",
    uploadPhoto: "फ़ोटो अपलोड करें", changePhoto: "फ़ोटो बदलें",
    hi: "हिंदी", en: "English",
    errorMsg: "छवि का विश्लेषण नहीं हो सका। कृपया स्पष्ट फ़ोटो लें।",
    greeting: "जय किसान!",
    greetingSub: "आज आपकी फसल कैसी है?",
    statScans: "कुल स्कैन", statDiseases: "रोग मिले", statHealthy: "स्वस्थ",
    quickTip: "त्वरित सुझाव", tipText: "सटीक परिणाम के लिए सुबह की रोशनी में स्कैन करें।",
    viewResult: "परिणाम देखें",
    chemicalWarning: "सुरक्षात्मक उपकरण पहनें। कटाई से पहले सुरक्षा अंतराल का पालन करें।",
  }
};

/* ── Severity Config ── */
const SEV = {
  healthy: { color: C.green, bg: C.greenBg, border: "#A8D5B4", emoji: "✅" },
  mild: { color: C.orange, bg: C.orangeBg, border: "#F5C494", emoji: "⚠️" },
  moderate: { color: "#C07020", bg: "#FEF3E0", border: "#F0C080", emoji: "🔶" },
  severe: { color: C.red, bg: C.redBg, border: "#F0A8A0", emoji: "🚨" },
};

/* ── Pulse Ring CSS ── */
const pulseCSS = `
@keyframes kl-pulse {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes kl-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes kl-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kl-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.kl-pulse-ring {
  position: absolute; inset: -8px; border-radius: 50%;
  border: 2px solid ${C.primaryLight};
  animation: kl-pulse 2s ease-out infinite;
}
.kl-pulse-ring:nth-child(2) { animation-delay: 0.6s; }
.kl-pulse-ring:nth-child(3) { animation-delay: 1.2s; }
.kl-spin { animation: kl-spin 1s linear infinite; }
.kl-fadeUp { animation: kl-fadeUp 0.4s ease both; }
.kl-shimmer {
  background: linear-gradient(90deg, #f0f4eb 25%, #e0ebd4 50%, #f0f4eb 75%);
  background-size: 400px 100%;
  animation: kl-shimmer 1.4s infinite;
}
`;

/* ════════════════════════════════════════════
   ICONS (inline SVG)
════════════════════════════════════════════ */
const Icon = ({ name, size = 20, color = "currentColor", ...p }) => {
  const paths = {
    home: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1V9.5z",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
    history: "M3 3v5h5M3.05 13A9 9 0 106 20.94M12 7v5l4 2",
    leaf: "M17 8C8 10 5.9 16.17 3.82 19.53A1 1 0 005 21C12 21 18 14 17 8z M3.82 19.53C4 16 7 12 12 12",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    check: "M20 6L9 17l-5-5",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    plus: "M12 5v14M5 12h14",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    info: "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 16v-4M12 8h.01",
    spray: "M3 3l4 4M7 3v4H3M14 3h7v7M10 10l-7 11h11l-7-11z M17 17l4 4",
    rupee: "M6 3h12M6 8h12M6 3c0 5.5 4 9 6 10-2 1-6 4.5-6 10M18 3c0 5.5-4 9-6 10",
    globe: "M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20M2 12a10 10 0 1020 0",
    language: "M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6",
    close: "M18 6L6 18M6 6l12 12",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  };
  const d = paths[name] || paths.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      {d.split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={`M${seg}`} />
      ))}
    </svg>
  );
};

/* ════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════ */

function Badge({ severity, label }) {
  const cfg = SEV[severity] || SEV.healthy;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: 12, fontWeight: 600, fontFamily: "Poppins",
    }}>
      {cfg.emoji} {label}
    </span>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, borderRadius: 16,
      border: `1px solid ${C.borderLight}`,
      padding: "1.25rem", marginBottom: "0.85rem",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: C.goldBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={15} color={C.gold} />
      </div>
      <span style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14, color: C.text }}>
        {text}
      </span>
    </div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ background: C.borderLight, borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: 8,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width 1s ease",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════════
   HOME SCREEN
════════════════════════════════════════════ */
function HomeScreen({ t, history, onScanPress, onViewResult }) {
  const totalScans = history.length;
  const diseaseCount = history.filter(h => h.result?.severity !== "healthy").length;
  const healthyCount = history.filter(h => h.result?.severity === "healthy").length;

  return (
    <div style={{ padding: "0 1rem 6rem" }}>
      {/* Greeting */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: C.text, margin: 0 }}>
          {t.greeting}
        </p>
        <p style={{ fontFamily: "Inter", fontSize: 14, color: C.textMute, margin: "2px 0 0" }}>
          {t.greetingSub}
        </p>
      </div>

      {/* Hero Scan CTA */}
      <div onClick={onScanPress} style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryMid} 60%, ${C.primaryLight} 100%)`,
        borderRadius: 24, padding: "2rem 1.5rem", marginBottom: "1rem",
        cursor: "pointer", position: "relative", overflow: "hidden", userSelect: "none",
      }}>
        {/* decorative circles */}
        <div style={{
          position: "absolute", right: -40, top: -40, width: 160, height: 160,
          borderRadius: "50%", border: `1px solid rgba(255,255,255,0.08)`
        }} />
        <div style={{
          position: "absolute", right: -10, top: -10, width: 100, height: 100,
          borderRadius: "50%", border: `1px solid rgba(255,255,255,0.1)`
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 16, position: "relative", width: 72, height: 72 }}>
            <div className="kl-pulse-ring" />
            <div className="kl-pulse-ring" />
            <div className="kl-pulse-ring" />
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 1,
            }}>
              <Icon name="camera" size={32} color="#fff" />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "#fff", margin: "0 0 4px" }}>
            {t.tapScan}
          </p>
          <p style={{ fontFamily: "Inter", fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>
            {t.orUpload}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1rem" }}>
        {[
          { label: t.statScans, value: totalScans, color: C.primary },
          { label: t.statDiseases, value: diseaseCount, color: C.red },
          { label: t.statHealthy, value: healthyCount, color: C.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: C.bgCard, borderRadius: 12, padding: "12px 10px",
            border: `1px solid ${C.borderLight}`, textAlign: "center",
          }}>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color, margin: 0 }}>
              {value}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 11, color: C.textMute, margin: "2px 0 0" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick tip */}
      <Card style={{ background: C.goldBg, border: `1px solid #E8C870`, padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Icon name="star" size={18} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: C.primary, margin: "0 0 3px" }}>
              {t.quickTip}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              {t.tipText}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent scans */}
      {history.length > 0 && (
        <>
          <p style={{
            fontFamily: "Poppins", fontWeight: 600, fontSize: 14, color: C.text,
            margin: "0.5rem 0 0.75rem"
          }}>{t.recentScans}</p>
          {history.slice(0, 3).map((item) => (
            <Card key={item.id} onClick={() => onViewResult(item.result, item.image)}
              style={{ padding: "0.85rem 1rem", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={item.image} alt="scan"
                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "Poppins", fontWeight: 600, fontSize: 13,
                    color: C.text, margin: "0 0 3px", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {item.result.disease}
                  </p>
                  <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: "0 0 5px" }}>
                    {item.result.cropName} · {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                  <Badge severity={item.result.severity}
                    label={item.result.severity.charAt(0).toUpperCase() + item.result.severity.slice(1)} />
                </div>
                <Icon name="arrow" size={16} color={C.textMute} />
              </div>
            </Card>
          ))}
        </>
      )}

      {history.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <Icon name="leaf" size={40} color={C.borderLight} />
          <p style={{ fontFamily: "Inter", fontSize: 14, color: C.textMute, marginTop: 10 }}>
            {t.noHistory}
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCAN SCREEN
════════════════════════════════════════════ */
function ScanScreen({ t, preview, onFileSelect, onAnalyze, loading, loadingStatus, error, fileRef }) {
  return (
    <div style={{ padding: "1.5rem 1rem 6rem" }}>
      <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 1.25rem" }}>
        {t.scan}
      </p>

      {/* Upload zone */}
      <div onClick={() => fileRef.current?.click()} style={{
        border: `2px dashed ${preview ? C.primaryLight : C.border}`,
        borderRadius: 20, overflow: "hidden", cursor: "pointer",
        background: preview ? "#000" : C.bgCardAlt, marginBottom: "1rem",
        minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {preview ? (
          <img src={preview} alt="crop preview"
            style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
              background: C.bgPage, border: `2px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="camera" size={34} color={C.primaryMid} />
            </div>
            <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15, color: C.text, margin: "0 0 6px" }}>
              {t.tapScan}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMute, margin: 0 }}>
              {t.orUpload}
            </p>
          </div>
        )}
        {preview && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "5px 12px",
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}>
            <Icon name="camera" size={13} color="#fff" />
            <span style={{ fontFamily: "Inter", fontSize: 12, color: "#fff" }}>{t.changePhoto}</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={onFileSelect} />

      {/* Analyse button */}
      <button onClick={onAnalyze} disabled={!preview || loading} style={{
        width: "100%", padding: "1rem", borderRadius: 16, border: "none",
        background: preview && !loading
          ? `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`
          : C.borderLight,
        color: preview && !loading ? C.primary : C.textMute,
        fontFamily: "Poppins", fontWeight: 700, fontSize: 16, cursor: preview && !loading ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "all 0.2s",
      }}>
        {loading ? (
          <>
            <div className="kl-spin" style={{
              width: 20, height: 20, borderRadius: "50%",
              border: `2px solid ${C.primary}40`, borderTopColor: C.primary,
            }} />
            {t.analyzing}
          </>
        ) : (
          <>
            <Icon name="leaf" size={20} color={preview ? C.primary : C.textMute} />
            {t.scanBtn}
          </>
        )}
      </button>

      {/* Live status card — shows queue/reasoning progress */}
      {loading && loadingStatus && (
        <div style={{
          marginTop: 12, padding: "14px 16px", borderRadius: 14,
          background: "linear-gradient(135deg, #EAF4FF 0%, #F0FFF4 100%)",
          border: `1px solid ${C.primaryLight}`,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <div className="kl-spin" style={{
            width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
            border: `2px solid ${C.primary}30`, borderTopColor: C.primary,
          }} />
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: C.primary, margin: "0 0 2px" }}>
              {loadingStatus.startsWith("⏳") ? "Waiting in Queue" :
               loadingStatus.startsWith("🔍") ? "Visual Analysis — Pass 1/2" :
               loadingStatus.startsWith("🧠") ? "Diagnosis — Pass 2/2" :
               "Submitting…"}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              {loadingStatus}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 12, padding: "12px 14px", borderRadius: 12,
          background: C.redBg, border: `1px solid #F0A0A0`,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Icon name="alert" size={16} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: "Inter", fontSize: 13, color: C.red, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Tips */}
      <Card style={{ marginTop: "1.25rem", background: C.bgCardAlt }}>
        <SectionLabel icon="info" text="Tips for best results" />
        {[
          "Hold camera 20–30 cm from the affected leaf",
          "Ensure good lighting — avoid shadows",
          "Focus on the most visibly affected area",
          "Include both healthy and affected leaves for comparison",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: C.greenBg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
            }}>
              <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 10, color: C.green }}>
                {i + 1}
              </span>
            </div>
            <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              {tip}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════
   RESULT SCREEN
════════════════════════════════════════════ */
function ResultScreen({ t, result, image, onScanAnother }) {
  if (!result) return null;
  const sev = SEV[result.severity] || SEV.healthy;

  return (
    <div style={{ padding: "0 1rem 6rem" }} className="kl-fadeUp">

      {/* Crop image strip */}
      <div style={{ margin: "0 -1rem 1rem", position: "relative" }}>
        <img src={image} alt="analysed crop"
          style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))",
        }} />
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "#fff", margin: "0 0 4px" }}>
            {result.disease}
          </p>
          <p style={{ fontFamily: "Inter", fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {result.cropName}
          </p>
        </div>
      </div>

      {/* Severity + Confidence */}
      <Card style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: "0 0 4px" }}>{t.severity}</p>
            <Badge severity={result.severity}
              label={result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} />
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: "0 0 4px" }}>{t.confidence}</p>
            <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: sev.color, margin: 0 }}>
              {result.confidence}%
            </p>
          </div>
        </div>
        <ProgressBar value={result.confidence} color={sev.color} />
      </Card>

      {/* Description */}
      <Card>
        <SectionLabel icon="info" text={t.diagnosis} />
        <p style={{ fontFamily: "Inter", fontSize: 14, color: C.textMid, margin: "0 0 12px", lineHeight: 1.6 }}>
          {result.description}
        </p>

        {/* Urgency banner */}
        <div style={{
          background: sev.bg, border: `1px solid ${sev.border}`,
          borderRadius: 10, padding: "10px 12px",
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Icon name="alert" size={15} color={sev.color} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12, color: sev.color, margin: "0 0 2px" }}>
              {t.urgency}
            </p>
            <p style={{ fontFamily: "Inter", fontSize: 13, color: sev.color, margin: 0, lineHeight: 1.5 }}>
              {result.urgency}
            </p>
          </div>
        </div>
      </Card>

      {/* Causes */}
      {result.causes?.length > 0 && (
        <Card>
          <SectionLabel icon="alert" text={t.causes} />
          {result.causes.map((cause, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: C.orange,
                flexShrink: 0, marginTop: 6
              }} />
              <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                {cause}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* Treatment Plan */}
      {result.treatment?.length > 0 && (
        <Card>
          <SectionLabel icon="spray" text={t.treatment} />
          {result.treatment.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, marginBottom: i < result.treatment.length - 1 ? 16 : 0,
              position: "relative",
            }}>
              {/* Step number + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: C.goldBg, border: `2px solid ${C.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: C.gold }}>
                    {step.step}
                  </span>
                </div>
                {i < result.treatment.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: C.borderLight, marginTop: 4 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: C.text, margin: "4px 0 3px" }}>
                  {step.action}
                </p>
                <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Chemical Treatment */}
      {result.chemicalTreatment?.length > 0 && (
        <Card>
          <SectionLabel icon="warning" text="⚗️ Chemical Treatment" />
          <p style={{ fontFamily: "Inter", fontSize: 11, color: C.orange, margin: "0 0 12px",
            background: C.orangeBg, padding: "6px 10px", borderRadius: 8, lineHeight: 1.4 }}>
            ⚠️ {t.chemicalWarning ?? "Use protective gear. Follow pre-harvest safety interval."}
          </p>
          {result.chemicalTreatment.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 12,
              marginBottom: i < result.chemicalTreatment.length - 1 ? 16 : 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: C.orangeBg, border: `2px solid ${C.orange}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: C.orange }}>
                    {step.step}
                  </span>
                </div>
                {i < result.chemicalTreatment.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: C.borderLight, marginTop: 4 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: C.text, margin: "4px 0 3px" }}>
                  {step.action}
                </p>
                <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.6 }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Prevention */}
      {result.prevention?.length > 0 && (
        <Card>
          <SectionLabel icon="shield" text={t.prevention} />
          {result.prevention.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <Icon name="check" size={15} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                {tip}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* Govt Schemes */}
      {result.govtSchemes?.length > 0 && (
        <Card style={{ background: C.blueBg, border: `1px solid #B8D0F0` }}>
          <SectionLabel icon="rupee" text={t.govtSchemes} />
          {result.govtSchemes.map((scheme, i) => (
            <div key={i} style={{
              background: C.bgCard, borderRadius: 12, padding: "12px 14px",
              marginBottom: i < result.govtSchemes.length - 1 ? 10 : 0,
              border: `1px solid ${C.borderLight}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Icon name="star" size={13} color={C.blue} />
                <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13, color: C.blue, margin: 0 }}>
                  {scheme.name}
                </p>
              </div>
              <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: "0 0 5px", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: C.text }}>Benefit: </span>{scheme.benefit}
              </p>
              <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: 0, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>How: </span>{scheme.how}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* Scan another */}
      <button onClick={onScanAnother} style={{
        width: "100%", padding: "1rem", borderRadius: 16, border: `1.5px solid ${C.primary}`,
        background: "transparent", color: C.primary,
        fontFamily: "Poppins", fontWeight: 600, fontSize: 15, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Icon name="camera" size={18} color={C.primary} />
        {t.scanAnother}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════
   HISTORY SCREEN
════════════════════════════════════════════ */
function HistoryScreen({ t, history, onViewResult }) {
  if (history.length === 0) {
    return (
      <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <Icon name="history" size={48} color={C.borderLight} />
        <p style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 16, color: C.textMute, margin: "12px 0 4px" }}>
          {t.noHistory}
        </p>
        <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMute, margin: 0 }}>
          {t.scanFirst}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem 1rem 6rem" }}>
      <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 1rem" }}>
        {t.history}
      </p>
      {history.map((item) => (
        <Card key={item.id} onClick={() => onViewResult(item.result, item.image)}
          style={{ padding: "0.9rem", cursor: "pointer" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img src={item.image} alt="scan"
              style={{ width: 58, height: 58, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "Poppins", fontWeight: 600, fontSize: 14, color: C.text,
                margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.result.disease}
              </p>
              <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: "0 0 6px" }}>
                {item.result.cropName} · {new Date(item.timestamp).toLocaleString()}
              </p>
              <Badge severity={item.result.severity}
                label={item.result.severity.charAt(0).toUpperCase() + item.result.severity.slice(1)} />
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{
                fontFamily: "Poppins", fontWeight: 700, fontSize: 18,
                color: SEV[item.result.severity]?.color || C.green, margin: "0 0 2px"
              }}>
                {item.result.confidence}%
              </p>
              <p style={{ fontFamily: "Inter", fontSize: 11, color: C.textMute, margin: 0 }}>
                {t.confidence}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCHEMES SCREEN
════════════════════════════════════════════ */
const SCHEMES_DATA = [
  {
    name: "PM-KISAN",
    category: "Income Support",
    benefit: "₹6,000/year direct transfer to farmer bank accounts in 3 instalments",
    eligibility: "All small and marginal farmers with cultivable land",
    how: "Register at pmkisan.gov.in or nearest Common Service Centre",
    icon: "rupee", color: C.green, bg: C.greenBg,
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "Crop Insurance",
    benefit: "Insurance coverage for crop loss due to natural calamities, pests, and diseases",
    eligibility: "All farmers growing notified crops in notified areas",
    how: "Apply through banks, CSCs, or PMFBY portal before the cut-off date",
    icon: "shield", color: C.blue, bg: C.blueBg,
  },
  {
    name: "PM Kisan Samman Nidhi",
    category: "Financial Aid",
    benefit: "Direct benefit transfer of ₹2,000 per instalment for agricultural input costs",
    eligibility: "Landholding farmers with valid Aadhaar and bank account",
    how: "Visit nearest PM-KISAN Mitra or call helpline 155261",
    icon: "star", color: C.gold, bg: C.goldBg,
  },
  {
    name: "Kisan Credit Card",
    category: "Credit Access",
    benefit: "Short-term crop loans at 7% interest (4% with prompt repayment)",
    eligibility: "Farmers, fishermen, self-help groups with land records",
    how: "Apply at any nationalised bank branch with land documents and Aadhaar",
    icon: "download", color: C.orange, bg: C.orangeBg,
  },
  {
    name: "Soil Health Card Scheme",
    category: "Soil Management",
    benefit: "Free soil testing and health card with crop-wise fertiliser recommendations",
    eligibility: "All farmers — every 2 years for the same plot",
    how: "Visit nearest Krishi Vigyan Kendra or call 1800-180-1551",
    icon: "leaf", color: C.primaryMid, bg: C.bgCardAlt,
  },
];

function SchemesScreen() {
  return (
    <div style={{ padding: "1.25rem 1rem 6rem" }}>
      <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 4px" }}>
        Government Schemes
      </p>
      <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMute, margin: "0 0 1.25rem" }}>
        Schemes you may be eligible for
      </p>
      {SCHEMES_DATA.map((scheme, i) => (
        <Card key={i} style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: scheme.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={scheme.icon} size={18} color={scheme.color} />
            </div>
            <div>
              <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: C.text, margin: 0 }}>
                {scheme.name}
              </p>
              <span style={{
                background: scheme.bg, color: scheme.color,
                fontSize: 11, fontFamily: "Inter", fontWeight: 600,
                padding: "2px 8px", borderRadius: 10,
              }}>{scheme.category}</span>
            </div>
          </div>
          <p style={{ fontFamily: "Inter", fontSize: 13, color: C.textMid, margin: "0 0 8px", lineHeight: 1.55 }}>
            <span style={{ fontWeight: 600, color: C.text }}>Benefit: </span>{scheme.benefit}
          </p>
          <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: "0 0 4px", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Eligibility: </span>{scheme.eligibility}
          </p>
          <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>How to apply: </span>{scheme.how}
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   BOTTOM TAB BAR
════════════════════════════════════════════ */
function TabBar({ tab, setTab, t }) {
  const tabs = [
    { key: "home", icon: "home", label: t.home },
    { key: "scan", icon: "camera", label: t.scan },
    { key: "history", icon: "history", label: t.history },
    { key: "schemes", icon: "shield", label: t.schemes },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: C.bgCard, borderTop: `1px solid ${C.borderLight}`,
      display: "flex", zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(({ key, icon, label }) => {
        const active = tab === key || (tab === "result" && key === "scan");
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: active ? C.greenBg : "transparent",
              transition: "background 0.15s",
            }}>
              <Icon name={icon} size={20} color={active ? C.primaryMid : C.textMute} />
            </div>
            <span style={{
              fontFamily: "Inter", fontSize: 11, fontWeight: active ? 600 : 400,
              color: active ? C.primaryMid : C.textMute,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════ */

/**
 * Backend URL resolution — priority order:
 * 1. localStorage["kisanlens_backend"] — user-configured (e.g. dev tunnel URL)
 * 2. /api — Vite proxy (works locally only)
 */
function getBackendUrl() {
  try {
    const saved = localStorage.getItem("kisanlens_backend");
    if (saved && saved.startsWith("http")) return saved.replace(/\/$/, "");
  } catch (_) {}
  return "/api";
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [language, setLanguage] = useState("en");
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");  // live queue status text
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(getBackendUrl);
  const [showBackendConfig, setShowBackendConfig] = useState(false);
  const fileRef = useRef();
  const t = LANG[language];

  /* persist backend URL whenever it changes */
  useEffect(() => {
    try { localStorage.setItem("kisanlens_backend", backendUrl); } catch (_) {}
  }, [backendUrl]);


  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setResult(null);
      setError(null);
      setTab("scan");
    };
    reader.readAsDataURL(file);
  };

  /* ────────────────────────────────────────────────────────────────
     analyse() — v4.2  SSE Streaming (devtunnel-safe)
     Backend sends heartbeat pings every 5s → devtunnel stays alive.
     Events:  status (progress) | result (full JSON) | error (message)
  ──────────────────────────────────────────────────────────────── */
  const analyse = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    setLoadingStatus("🌱 Uploading image…");

    // Helper: parse the backend JSON result into our UI model
    const parseResult = (data) => {
      const sevMap = { Mild: "mild", Moderate: "moderate", Severe: "severe", None: "healthy" };
      const severity   = sevMap[data.severity] ?? "healthy";
      const rawScore   = data.confidence_score;
      const confidence = rawScore != null ? Math.round(rawScore * 100)
          : data.confidence === "High" ? 88
          : data.confidence === "Medium" ? 65 : 42;

      const buildTreatment = () => {
        const organics = Array.isArray(data.organic_treatments) ? data.organic_treatments : [];
        if (organics.length > 0) {
          return organics.slice(0, 3).map((item, i) => ({
            step:   item.rank ?? i + 1,
            action: item.name ?? "Apply treatment",
            detail: [
              item.dosage             ? `Dosage: ${item.dosage}`             : "",
              item.application_method ? `Method: ${item.application_method}` : "",
              item.how_to_prepare ?? "",
            ].filter(Boolean).join(". ") || "",
          }));
        }
        return (Array.isArray(data.immediate_actions) ? data.immediate_actions : [])
          .slice(0, 3).map((a, i) => ({ step: i + 1, action: a, detail: "" }));
      };

      const buildChemicalTreatment = () =>
        (Array.isArray(data.chemical_treatments) ? data.chemical_treatments : [])
          .slice(0, 3).map((item, i) => ({
            step:   item.rank ?? i + 1,
            action: item.name ?? "Apply chemical",
            detail: [
              item.active_ingredient    ? `Active: ${item.active_ingredient}`                        : "",
              item.dosage               ? `Dosage: ${item.dosage}`                                   : "",
              item.safety_interval_days ? `Wait ${item.safety_interval_days} days before harvest`   : "",
              item.application_method   ? `Method: ${item.application_method}`                       : "",
            ].filter(Boolean).join(" | "),
          }));

      const buildPrevention = () =>
        (Array.isArray(data.prevention_strategies) ? data.prevention_strategies : [])
          .slice(0, 4)
          .map(s => typeof s === "string" ? s : `${s.strategy}: ${s.description}`);

      const buildCauses = () => {
        const list = [];
        if (data.root_cause) list.push(data.root_cause);
        (data.differential_diagnoses ?? []).slice(0, 2)
          .forEach(d => list.push(`Possible alternate: ${d}`));
        return list.slice(0, 3);
      };

      const buildSchemes = () =>
        (Array.isArray(data.government_schemes) ? data.government_schemes : [])
          .slice(0, 3).map(sc => ({
            name:    sc.scheme_name    ?? sc.name    ?? "Government Scheme",
            benefit: sc.benefit_amount ?? sc.benefit ?? "",
            how:     sc.how_to_apply   ?? sc.how     ?? "",
          }));

      return {
        cropName:          data.crop_type    ?? "Unknown Crop",
        disease:           data.disease_name ?? (severity === "healthy" ? "Healthy Crop" : "Unknown Disease"),
        severity,
        confidence,
        description:       data.description  ?? data.notes ?? "",
        causes:            buildCauses(),
        treatment:         buildTreatment(),
        chemicalTreatment: buildChemicalTreatment(),
        prevention:        buildPrevention(),
        govtSchemes:       buildSchemes(),
        urgency:           data.urgency ?? "",
      };
    };

    try {
      // Convert data URL → Blob
      let blob;
      if (preview.startsWith("data:")) {
        const [header, b64] = preview.split(",");
        const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        blob = new Blob([bytes], { type: mime });
      } else {
        blob = await fetch(preview).then(r => r.blob());
      }

      const form = new FormData();
      form.append("file", blob, "crop.jpg");

      // ── POST and open SSE stream ───────────────────────────────────────────
      // Backend sends heartbeat pings every 5s so devtunnel never idles out.
      const res = await fetch(`${backendUrl}/analyze-crop`, {
        method: "POST",
        body:   form,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        let errMsg = `Server error (HTTP ${res.status})`;
        try { errMsg = JSON.parse(errText).detail || errMsg; } catch (_) {}
        throw new Error(errMsg);
      }

      // ── Read the SSE stream ────────────────────────────────────────────────
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   done    = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete last chunk in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch (_) { continue; }

          if (event.type === "status") {
            // Heartbeat — update loading message, keep connection alive
            setLoadingStatus(event.message || "Processing…");

          } else if (event.type === "result") {
            // Final result received
            const parsed = parseResult(event.data);
            const entry  = { id: Date.now(), image: preview, result: parsed, timestamp: new Date() };
            setResult(parsed);
            setHistory(h => [entry, ...h].slice(0, 30));
            setTab("result");
            done = true; // stop reading

          } else if (event.type === "error") {
            throw new Error(event.message || "Analysis failed on server.");
          }
        }
      }

    } catch (err) {
      console.error("KisanLens analysis error:", err);
      setError(
        err.message && err.message !== "Failed to fetch"
          ? err.message
          : t.errorMsg
      );
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const viewResult = (r, img) => {
    setResult(r);
    setPreview(img);
    setTab("result");
  };

  const scanAnother = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setTab("scan");
  };

  return (
    <>
      <FontLink />
      <style>{pulseCSS}</style>
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: C.bgPage, fontFamily: "Inter, sans-serif",
        position: "relative", overflowX: "hidden",
      }}>
        <div style={{
          background: C.bgCard, borderBottom: `1px solid ${C.borderLight}`,
          padding: "14px 1rem 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="leaf" size={17} color="#fff" />
            </div>
            <div>
              <p style={{
                fontFamily: "Poppins", fontWeight: 800, fontSize: 16,
                color: C.primary, margin: 0, lineHeight: 1
              }}>{t.appName}</p>
              <p style={{ fontFamily: "Inter", fontSize: 11, color: C.textMute, margin: 0 }}>{t.tagline}</p>
            </div>
          </div>

          {/* Language toggle */}
          <button onClick={() => setLanguage(l => l === "en" ? "hi" : "en")} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.bgCardAlt, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "5px 12px", cursor: "pointer",
          }}>
            <Icon name="globe" size={13} color={C.textMid} />
            <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 12, color: C.textMid }}>
              {language === "en" ? "हिंदी" : "English"}
            </span>
          </button>
        </div>

        {/* ── Screens ── */}
        <div>
          {tab === "home" && (
            <HomeScreen t={t} history={history}
              onScanPress={() => { fileRef.current?.click(); }}
              onViewResult={viewResult} />
          )}
          {tab === "scan" && (
            <ScanScreen t={t} preview={preview}
              onFileSelect={handleFileSelect} onAnalyze={analyse}
              loading={loading} loadingStatus={loadingStatus}
              error={error} fileRef={fileRef} />
          )}
          {tab === "result" && result && (
            <ResultScreen t={t} result={result} image={preview} onScanAnother={scanAnother} />
          )}
          {tab === "history" && (
            <HistoryScreen t={t} history={history} onViewResult={viewResult} />
          )}
          {tab === "schemes" && <SchemesScreen />}
        </div>

        {/* ── Hidden file input ── */}
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: "none" }} onChange={handleFileSelect} />

        {/* ── Tab Bar ── */}
        <TabBar tab={tab} setTab={setTab} t={t} />

        {/* ── Backend Config Button (⚙) ── */}
        <button
          onClick={() => setShowBackendConfig(true)}
          title="Configure Backend URL"
          style={{
            position: "fixed", bottom: 80, right: 16, zIndex: 200,
            width: 36, height: 36, borderRadius: "50%",
            background: backendUrl === "/api" ? "rgba(0,0,0,0.15)" : C.primaryMid,
            border: "none", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
          ⚙️
        </button>

        {/* ── Backend Config Modal ── */}
        {showBackendConfig && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.55)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 24,
          }}
            onClick={() => setShowBackendConfig(false)}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24,
              width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
              onClick={e => e.stopPropagation()}>
              <p style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16, color: C.primary, marginBottom: 8 }}>
                🔧 Backend Server URL
              </p>
              <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textMute, marginBottom: 16, lineHeight: 1.5 }}>
                Local: leave as <code style={{ background: "#f1f5f0", padding: "1px 4px", borderRadius: 4 }}>/api</code><br />
                Dev Tunnel: paste your backend tunnel URL<br />
                <span style={{ color: C.primaryMid }}>e.g. https://xyz-8000.devtunnels.ms</span>
              </p>
              <input
                type="text"
                defaultValue={backendUrl}
                id="backend-url-input"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: `1.5px solid ${C.border}`, fontFamily: "Inter",
                  fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
                placeholder="https://your-tunnel-8000.devtunnels.ms"
              />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => {
                    const val = document.getElementById("backend-url-input").value.trim();
                    setBackendUrl(val || "/api");
                    setShowBackendConfig(false);
                  }}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: C.primaryMid, color: "#fff", fontFamily: "Inter",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>Save</button>
                <button
                  onClick={() => { setBackendUrl("/api"); setShowBackendConfig(false); }}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${C.border}`,
                    background: "transparent", color: C.textMid, fontFamily: "Inter",
                    fontWeight: 500, fontSize: 14, cursor: "pointer",
                  }}>Reset to Local</button>
              </div>
              <p style={{ fontFamily: "Inter", fontSize: 11, color: C.textMute, marginTop: 12, textAlign: "center" }}>
                Current: <code style={{ color: C.primaryMid }}>{backendUrl}</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
