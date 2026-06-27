import { Link } from "react-router-dom";

interface SystemOption {
  label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  logo: string;
  logoAlt: string;
  href: string;
  theme: "ftcc" | "rgmed";
  points: string[];
}

const systems: SystemOption[] = [
  {
    label: "Enter FTCC System",
    eyebrow: "PhilHealth Accredited Clinic",
    title: "YAKAP Caravan",
    subtitle: "Posting System",
    description: "Generate outreach captions, manage community health mission photos, and publish caravan updates.",
    logo: "/ftcc-logo-full.png",
    logoAlt: "FTCC Filipino Trusted Care Center logo",
    href: "/system",
    theme: "ftcc",
    points: ["YAKAP Caravan builder", "Auto overlay generator", "AI caption automation"],
  },
  {
    label: "Enter RG-Med System",
    eyebrow: "PhilHealth Accredited Pharmacy",
    title: "RG-MED",
    subtitle: "Pharmacy Posting",
    description: "Generate GAMOT Program posts, manage community health mission photos, and publish GAMOT caravan updates.",
    logo: "/rg-med-logo.png",
    logoAlt: "RG-Med Pharmacy logo",
    href: "/rg-med",
    theme: "rgmed",
    points: ["GAMOT Caravan Post", "PhilHealth GAMOT bulletins", "AI caption automation"],
  },
];

export function LandingPage() {
  return (
    <main className="landing-shell" aria-label="Choose posting system">
      <div className="landing-options">
        {systems.map((system) => (
          <Link className={`landing-panel landing-panel-${system.theme}`} to={system.href} aria-label={system.label} key={system.title}>
            <div className="landing-content">
              <div className="landing-logo-frame">
                <img className="landing-logo" src={system.logo} alt={system.logoAlt} />
              </div>
              <p className="landing-eyebrow">{system.eyebrow}</p>
              <h1>{system.title}</h1>
              <h2>{system.subtitle}</h2>
              <p className="landing-description">{system.description}</p>
              <ul className="landing-points" aria-label={`${system.title} features`}>
                {system.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <span className="landing-action" aria-hidden="true">
                <span>{system.label}</span>
                <span>-&gt;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
      <span className="landing-divider">OR</span>
    </main>
  );
}

export function RgMedPage() {
  return (
    <main className="rgmed-placeholder">
      <img src="/rg-med-logo.png" alt="RG-Med Pharmacy logo" />
      <p>PhilHealth GAMOT Partner</p>
      <h1>RG-MED Pharmacy Posting</h1>
      <h2>The RG-Med posting module is ready for connection.</h2>
      <Link to="/" className="landing-action landing-action-dark">
        <span>Back to systems</span>
        <span aria-hidden="true">-&gt;</span>
      </Link>
    </main>
  );
}
