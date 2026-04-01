import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#008080", fontFamily: "'Tahoma', 'MS Sans Serif', Arial, sans-serif" }}
    >
      {/* Desktop area */}
      <main className="flex-1 flex items-center justify-center p-6">
        {/* Main Window */}
        <div
          className="win-window"
          style={{ width: "100%", maxWidth: 680, minWidth: 320 }}
          role="dialog"
          aria-labelledby="win-title"
        >
          {/* Title Bar */}
          <div className="win-titlebar">
            <div className="flex items-center gap-1">
              {/* Window icon – a tiny blue square mimicking a Win2k app icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="1" width="14" height="14" fill="#1565c0" />
                <rect x="2" y="2" width="6" height="6" fill="#42a5f5" />
                <rect x="9" y="2" width="5" height="5" fill="#ef5350" />
                <rect x="2" y="9" width="5" height="5" fill="#66bb6a" />
                <rect x="9" y="9" width="5" height="5" fill="#ffa726" />
              </svg>
              <span id="win-title" style={{ fontSize: 12, fontWeight: "bold" }}>
                PaaS Paid Product — Home
              </span>
            </div>
            <div className="flex items-center">
              <button className="win-ctrl-btn" aria-label="Minimize" title="Minimize">_</button>
              <button className="win-ctrl-btn" aria-label="Maximize" title="Maximize">□</button>
              <button
                className="win-ctrl-btn"
                aria-label="Close"
                title="Close"
                style={{ fontWeight: "bold", marginLeft: 2 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Menu Bar */}
          <nav className="win-menubar" aria-label="Menu bar">
            <span className="win-menu-item"><u>F</u>ile</span>
            <span className="win-menu-item"><u>E</u>dit</span>
            <span className="win-menu-item"><u>V</u>iew</span>
            <span className="win-menu-item">F<u>a</u>vorites</span>
            <span className="win-menu-item"><u>T</u>ools</span>
            <span className="win-menu-item"><u>H</u>elp</span>
          </nav>

          {/* Toolbar */}
          <div
            className="flex items-center gap-1 px-1 py-1"
            style={{
              background: "#d4d0c8",
              borderBottom: "1px solid #808080",
            }}
          >
            <button className="win-btn" style={{ minWidth: 55, fontSize: 11 }} disabled aria-disabled="true">
              ← Back
            </button>
            <button className="win-btn" style={{ minWidth: 55, fontSize: 11 }} disabled aria-disabled="true">
              Next →
            </button>
            <button className="win-btn" style={{ minWidth: 55, fontSize: 11 }}>
              ↻ Refresh
            </button>
            <button className="win-btn" style={{ minWidth: 40, fontSize: 11 }}>
              🏠 Home
            </button>
            <div
              className="flex-1 flex items-center ml-1"
              style={{ gap: 4 }}
            >
              <label
                htmlFor="address-bar"
                style={{ fontSize: 11, whiteSpace: "nowrap" }}
              >
                Address
              </label>
              <input
                id="address-bar"
                type="text"
                defaultValue="http://paas.local/"
                readOnly
                className="win-sunken flex-1"
                style={{
                  background: "#fff",
                  fontSize: 11,
                  padding: "1px 4px",
                  height: 22,
                  fontFamily: "'Tahoma', Arial, sans-serif",
                  color: "#000",
                }}
              />
            </div>
            <button className="win-btn" style={{ minWidth: 40, fontSize: 11 }}>
              Go
            </button>
          </div>

          {/* Window Body */}
          <div
            style={{
              background: "#d4d0c8",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Inner sunken content panel */}
            <div
              className="win-sunken"
              style={{
                background: "#ffffff",
                padding: "14px 16px",
              }}
            >
              {/* Product header */}
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <p
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#0a246a",
                    fontWeight: "bold",
                  }}
                >
                  PaaS Paid Product
                </p>
                {userId ? (
                  <div style={{ transform: "scale(0.85)", transformOrigin: "right center" }}>
                    <UserButton />
                  </div>
                ) : null}
              </div>

              <div className="win-separator" />

              <h1
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "#000080",
                  lineHeight: 1.3,
                  marginBottom: 8,
                  fontFamily: "'Tahoma', Arial, sans-serif",
                }}
              >
                Turn this roadmap into a paid access product.
              </h1>
              <p style={{ fontSize: 11, color: "#000000", lineHeight: 1.6, marginBottom: 4 }}>
                Migration complete: this app now runs with Clerk auth, Stripe subscriptions,
                a protected roadmap route, and an upgrade paywall.
              </p>
            </div>

            {/* Info box (Win2k "Note" style) */}
            <div
              className="win-raised"
              style={{
                background: "#ffffc0",
                padding: "6px 10px",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}
                aria-hidden="true"
              >
                ℹ️
              </span>
              <p style={{ fontSize: 11, color: "#000" }}>
                <strong>System Note:</strong> You are viewing the PaaS Paid Product homepage.
                Please select an option below to continue.
              </p>
            </div>

            {/* Action buttons row */}
            <div
              className="win-raised"
              style={{
                background: "#d4d0c8",
                padding: "10px 12px",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Link href="/roadmap" style={{ textDecoration: "none" }}>
                <button
                  className="win-btn"
                  style={{
                    background: "#d4d0c8",
                    fontSize: 11,
                    fontWeight: "bold",
                    minWidth: 130,
                  }}
                >
                  📋 Open paid roadmap
                </button>
              </Link>
              <Link href="/projects" style={{ textDecoration: "none" }}>
                <button
                  className="win-btn"
                  style={{
                    background: "#d4d0c8",
                    fontSize: 11,
                    minWidth: 110,
                  }}
                >
                  📁 My projects
                </button>
              </Link>
              <Link href="/upgrade" style={{ textDecoration: "none" }}>
                <button
                  className="win-btn"
                  style={{
                    background: "#d4d0c8",
                    fontSize: 11,
                    minWidth: 110,
                  }}
                >
                  ⭐ Upgrade page
                </button>
              </Link>
              {!userId ? (
                <Link href="/sign-in" style={{ textDecoration: "none" }}>
                  <button
                    className="win-btn"
                    style={{
                      background: "#d4d0c8",
                      fontSize: 11,
                      fontWeight: "bold",
                      minWidth: 80,
                    }}
                  >
                    🔑 Sign in
                  </button>
                </Link>
              ) : null}
            </div>
          </div>

          {/* Status Bar */}
          <div className="win-statusbar" aria-label="Status bar">
            <span style={{ flex: 1 }}>Ready</span>
            <span
              className="win-sunken"
              style={{ padding: "0 6px", fontSize: 10, minWidth: 80, textAlign: "center" }}
            >
              Local intranet
            </span>
            <span
              className="win-sunken"
              style={{ padding: "0 6px", fontSize: 10, minWidth: 80, textAlign: "center" }}
            >
              100%
            </span>
          </div>
        </div>
      </main>

      {/* Taskbar */}
      <footer
        className="win-taskbar"
        aria-label="Windows taskbar"
        style={{ position: "sticky", bottom: 0, zIndex: 50 }}
      >
        {/* Start button */}
        <button
          className="win-start-btn"
          style={{ fontSize: 12, fontWeight: "bold" }}
          aria-label="Start"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="1" width="6" height="6" fill="#ef3b2c" />
            <rect x="9" y="1" width="6" height="6" fill="#4caf50" />
            <rect x="1" y="9" width="6" height="6" fill="#2196f3" />
            <rect x="9" y="9" width="6" height="6" fill="#ffeb3b" />
          </svg>
          <strong>Start</strong>
        </button>

        {/* Divider */}
        <div
          style={{
            width: 2,
            height: 22,
            borderLeft: "1px solid #808080",
            borderRight: "1px solid #fff",
            margin: "0 2px",
          }}
          aria-hidden="true"
        />

        {/* Active window pill */}
        <div
          className="win-raised"
          style={{
            background: "#d4d0c8",
            padding: "2px 8px",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            minWidth: 160,
          }}
          aria-current="true"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="1" width="14" height="14" fill="#1565c0" />
            <rect x="2" y="2" width="6" height="6" fill="#42a5f5" />
          </svg>
          PaaS Paid Product — Home
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* System tray clock */}
        <div
          className="win-sunken"
          style={{
            padding: "1px 8px",
            fontSize: 11,
            minWidth: 60,
            textAlign: "center",
          }}
          aria-label="System time"
        >
          <ClientClock />
        </div>
      </footer>
    </div>
  );
}

// Simple client clock component
function ClientClock() {
  // Static server-rendered time to avoid hydration mismatch
  // In a real app you'd make this a client component with useEffect
  return <span suppressHydrationWarning>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>;
}
