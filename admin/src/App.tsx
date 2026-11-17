"use client";

import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import SiteContentPage from "./site-content";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileChartColumn,
  FileText,
  Filter,
  FolderKanban,
  Gauge,
  Globe2,
  Home,
  KeyRound,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type Page =
  | "dashboard"
  | "properties"
  | "requests"
  | "plans"
  | "estimates"
  | "users"
  | "reports"
  | "settings"
  | "site";

const navGroups: {
  label: string;
  items: { id: Page; label: string; icon: Icon; badge?: string }[];
}[] = [
  { label: "Pilotage", items: [{ id: "dashboard", label: "Vue générale", icon: LayoutDashboard }] },
  {
    label: "Activités",
    items: [
      { id: "properties", label: "Immobilier", icon: Building2 },
      { id: "requests", label: "Réservations & demandes", icon: MessageSquareText },
      { id: "plans", label: "Plans architecturaux", icon: FolderKanban },
      { id: "site", label: "Services & médias", icon: Globe2 },
      { id: "estimates", label: "Devis de construction", icon: FileText },
    ],
  },
  {
    label: "Gestion",
    items: [
      { id: "users", label: "Utilisateurs", icon: Users },
      { id: "reports", label: "Rapports & analyses", icon: FileChartColumn },
      { id: "settings", label: "Paramètres", icon: Settings },
    ],
  },
];

const pageTitles: Record<Page, { title: string; crumb: string }> = {
  dashboard: { title: "Tableau de bord", crumb: "Vue générale" },
  properties: { title: "Gestion immobilière", crumb: "Toutes les propriétés" },
  requests: { title: "Réservations & demandes", crumb: "Suivi client" },
  plans: { title: "Plans architecturaux", crumb: "Bibliothèque" },
  estimates: { title: "Devis de construction", crumb: "Tous les devis" },
  users: { title: "Utilisateurs", crumb: "Gestion des comptes" },
  reports: { title: "Rapports & analyses", crumb: "Performance" },
  settings: { title: "Paramètres généraux", crumb: "Configuration" },
  site: { title: "Services & médias", crumb: "Contenu public" },
};

type PropertyRecord = {
  id: string;
  ref: string;
  title: string;
  shortDescription?: string;
  description?: string;
  kind: string;
  location: string;
  city?: string;
  municipality?: string;
  neighborhood?: string;
  address?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  livingArea?: number | null;
  landArea?: number | null;
  price: string;
  isNegotiable?: boolean;
  status: string;
  tone: "success" | "warning" | "neutral" | "danger";
  color: string;
  image?: string;
  imagePath?: string;
};

type PropertyDraft = {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  operation: string;
  city: string;
  municipality: string;
  neighborhood: string;
  address: string;
  price: string;
  isNegotiable: boolean;
  currency: string;
  bedrooms: string;
  bathrooms: string;
  livingArea: string;
  landArea: string;
  image: File | null;
  removeImage: boolean;
};

const kinshasaCommunes = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vubu",
  "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso", "Lemba", "Limete",
  "Lingwala", "Makala", "Maluku", "Masina", "Matete", "Mont-Ngafula",
  "N'djili", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "N'sele", "Selembao",
];

type PlanRecord = {
  id: string;
  ref: string;
  title: string;
  category: string;
  details: string;
  description: string;
  status: string;
  tone: "success" | "warning" | "neutral";
  image?: string;
  storagePath?: string;
};

type PlanDraft = {
  title: string;
  description: string;
  category: string;
  area: string;
  bedrooms: string;
  floors: string;
  preview: File | null;
};

type InquiryRecord = {
  id: string;
  reference: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  type: string;
  date: string;
  status: "new" | "in_progress" | "waiting" | "resolved" | "archived";
};

type CompanySettings = {
  company_name: string;
  legal_name: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  about_title: string;
  about_content: string;
  faq_content: string;
  legal_content: string;
  home_title: string;
  home_intro: string;
};

const properties: PropertyRecord[] = [];

function Button({
  children,
  variant = "primary",
  icon: IconComponent,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  title,
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger";
  icon?: Icon;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {IconComponent && <IconComponent size={17} strokeWidth={2} />}
      {children}
    </button>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon: IconComponent,
  tone,
  down,
  caption,
}: {
  title: string;
  value: string;
  trend?: string;
  icon: Icon;
  tone: string;
  down?: boolean;
  caption?: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon stat-icon-${tone}`}>
          <IconComponent size={20} />
        </div>
        <Button variant="icon" icon={MoreHorizontal} />
      </div>
      <p className="stat-label">{title}</p>
      <div className="stat-value-row">
        <strong>{value}</strong>
        {trend && (
          <span className={down ? "trend-down" : "trend-up"}>
            {down ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {trend}
          </span>
        )}
      </div>
      <p className="stat-caption">{caption ?? "Aucune donnée enregistrée"}</p>
    </article>
  );
}

function Sidebar({
  page,
  setPage,
  open,
  close,
  signOut,
}: {
  page: Page;
  setPage: (p: Page) => void;
  open: boolean;
  close: () => void;
  signOut: () => void;
}) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={close} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={22} />
          </div>
          <div>
            <strong>DAFS</strong>
            <span>SERVICES</span>
          </div>
          <Button variant="icon" icon={X} className="sidebar-close" onClick={close} />
        </div>
        <div className="workspace-label">
          <span>Administration</span>
          <ShieldCheck size={15} />
        </div>
        <nav className="nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const NavIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? "nav-item-active" : ""}`}
                    onClick={() => {
                      setPage(item.id);
                      close();
                    }}
                  >
                    <NavIcon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <em>{item.badge}</em>}
                    {page === item.id && <span className="active-line" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-help">
          <div className="help-icon">
            <Sparkles size={18} />
          </div>
          <strong>Besoin d’aide ?</strong>
          <span>Consultez le centre d’assistance.</span>
          <button disabled>
            Ouvrir le support <ArrowRight size={13} />
          </button>
        </div>
        <div className="user-block">
          <div className="avatar">AD</div>
          <div>
            <strong>Administrateur</strong>
            <span>Compte à configurer</span>
          </div>
          <button className="sign-out-button" onClick={signOut} aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  page,
  openMenu,
  openNotifications,
}: {
  page: Page;
  openMenu: () => void;
  openNotifications: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <Button variant="icon" icon={Menu} className="mobile-menu" onClick={openMenu} />
        <div>
          <span>
            Administration <ChevronRight size={12} /> {pageTitles[page].crumb}
          </span>
          <strong>{pageTitles[page].title}</strong>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input placeholder="Rechercher partout…" />
          <kbd>⌘ K</kbd>
        </label>
        <Button
          variant="secondary"
          icon={Globe2}
          className="public-site"
          disabled={!process.env.NEXT_PUBLIC_PUBLIC_SITE_URL}
          onClick={() => {
            const url = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL;
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          Voir le site
        </Button>
        <button className="notification-button" onClick={openNotifications}>
          <Bell size={19} />
        </button>
        <div className="top-avatar">AD</div>
      </div>
    </header>
  );
}

function MiniBars() {
  const values = [32, 45, 38, 58, 48, 70, 62, 86, 68, 78, 92, 81, 95, 88];
  return (
    <div className="mini-bars">
      {values.map((v, i) => (
        <span key={i} className={i > 9 ? "highlight-bar" : ""} style={{ height: `${v}%` }} />
      ))}
    </div>
  );
}

function Dashboard({
  properties,
  inquiryCount,
  onAdd,
  navigate,
}: {
  properties: PropertyRecord[];
  inquiryCount: number;
  onAdd: () => void;
  navigate: (page: Page) => void;
}) {
  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ESPACE D’ADMINISTRATION</p>
          <h1>Tableau de bord</h1>
          <span>Ajoutez les premiers contenus de DAFS Services.</span>
        </div>
        <div className="welcome-actions">
          <Button icon={Plus} onClick={onAdd}>Ajouter une propriété</Button>
        </div>
      </section>
      <section className="stats-grid">
        <StatCard title="Propriétés" value={String(properties.length)} icon={Building2} tone="blue" caption="Dans l’espace d’administration" />
        <StatCard title="Réservations" value="0" icon={CalendarDays} tone="gold" />
        <StatCard title="Demandes clients" value={String(inquiryCount)} icon={MessageSquareText} tone="purple" />
        <StatCard title="Devis" value="0" icon={FileText} tone="green" />
      </section>
      <section className="bottom-grid">
        <article className="panel recent-panel empty-dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Votre espace est prêt</h2>
              <p>Les contenus apparaîtront ici après leur ajout dans l’administration.</p>
            </div>
          </div>
          <div className="dashboard-empty-state">
            <Building2 size={28} />
            <strong>Aucune annonce pour le moment</strong>
            <span>Commencez par ajouter un bien immobilier.</span>
            <Button onClick={onAdd}>Ajouter une propriété</Button>
          </div>
        </article>
        <article className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Modules</h2>
              <p>Ajoutez les informations quand elles seront disponibles.</p>
            </div>
          </div>
          <div className="quick-list">
            <button onClick={onAdd}>
              <span className="quick-gold"><Building2 size={18} /></span>
              <div><strong>Immobilier</strong><small>Créer une annonce</small></div>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate("plans")}>
              <span className="quick-blue"><Layers3 size={18} /></span>
              <div><strong>Plans architecturaux</strong><small>Ajouter un plan et ses médias</small></div>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate("estimates")}>
              <span className="quick-green"><CircleDollarSign size={18} /></span>
              <div><strong>Devis de construction</strong><small>Configurer les barèmes</small></div>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate("settings")}>
              <span className="quick-purple"><Settings size={18} /></span>
              <div><strong>Informations du site</strong><small>Renseigner les coordonnées</small></div>
              <ChevronRight size={16} />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function ListHeader({
  eyebrow,
  title,
  description,
  action,
  icon = Plus,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  icon?: Icon;
  onAction?: () => void;
}) {
  return (
    <section className="list-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      <Button icon={icon} onClick={onAction} disabled={!onAction}>
        {action}
      </Button>
    </section>
  );
}

function PropertyPage({
  properties,
  onAdd,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  properties: PropertyRecord[];
  onAdd: () => void;
  onEdit: (property: PropertyRecord) => void;
  onTogglePublish: (property: PropertyRecord) => void;
  onDelete: (property: PropertyRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const filteredProperties = useMemo(
    () =>
      properties.filter((property) => {
        const matchesQuery = `${property.title} ${property.ref} ${property.kind} ${property.location}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        const matchesStatus = statusFilter === "Tous les statuts" || property.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [properties, query, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const pageProperties = filteredProperties.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("Tous les statuts");
    setCurrentPage(1);
  };
  const downloadCsv = () => {
    const rows = [
      ["Référence", "Propriété", "Catégorie", "Localisation", "Prix", "Statut"],
      ...filteredProperties.map((property) => [
        property.ref,
        property.title,
        property.kind,
        property.location,
        property.price,
        property.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const safeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
            return `"${safeCell.replace(/"/g, '""')}"`;
          })
          .join(";"),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "dafs-proprietes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">
      <ListHeader
        eyebrow="PORTEFEUILLE IMMOBILIER"
        title="Toutes les propriétés"
        description="Gérez les logements, maisons et parcelles de DAFS Services."
        action="Ajouter une propriété"
        onAction={onAdd}
      />
      <div className="inline-stats">
        {[
          [String(properties.length), "Total"],
          [String(properties.filter((property) => property.status === "Publiée").length), "Publiées"],
          [String(properties.filter((property) => property.status === "Brouillon").length), "Brouillons"],
          [String(properties.filter((property) => property.status === "À compléter").length), "À compléter"],
          [String(properties.filter((property) => property.status === "Indisponible").length), "Indisponibles"],
        ].map(([value, label], i) => (
          <div key={label} className={i === 0 ? "inline-stat-active" : ""}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <article className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom ou référence…"
              aria-label="Rechercher une propriété"
            />
          </label>
          <div>
            <label className="property-filter-label">
              <Filter size={16} />
              <select
                className="property-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrer par statut"
              >
                {["Tous les statuts", "Publiée", "Brouillon", "À compléter", "Indisponible"].map(
                  (status) => <option key={status}>{status}</option>,
                )}
              </select>
            </label>
            <Button variant="secondary" icon={Download} onClick={downloadCsv}>
              Exporter
            </Button>
          </div>
        </div>
        {(query || statusFilter !== "Tous les statuts") && (
          <div className="active-filters">
            <span>{statusFilter}</span>
            {query && <span>Recherche : {query}</span>}
            <button onClick={clearFilters}>Effacer les filtres</button>
          </div>
        )}
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Propriété</th>
                <th>Catégorie</th>
                <th>Localisation</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageProperties.map((property) => (
                <tr key={property.ref}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="property-cell">
                      <div className={`property-thumb ${property.color}`}>
                        {property.image ? <img src={property.image} alt="" /> : <Home size={18} />}
                      </div>
                      <div>
                        <strong>{property.title}</strong>
                        <span>{property.ref}</span>
                      </div>
                    </div>
                  </td>
                  <td>{property.kind}</td>
                  <td>
                    <span className="location-cell">
                      <MapPin size={14} />
                      {property.location}
                    </span>
                  </td>
                  <td>
                    <strong className="price">{property.price}</strong>
                  </td>
                  <td>
                    <Badge tone={property.tone}>{property.status}</Badge>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button
                        variant="icon"
                        icon={Pencil}
                        onClick={() => onEdit(property)}
                        title={`Modifier ${property.title}`}
                      />
                      <Button
                        variant="icon"
                        icon={Globe2}
                        onClick={() => onTogglePublish(property)}
                        title={property.status === "Publiée" ? "Retirer du site public" : "Publier sur le site"}
                      />
                      <Button variant="icon" icon={Trash2} onClick={() => onDelete(property)} title={`Supprimer ${property.title}`} />
                    </div>
                  </td>
                </tr>
              ))}
              {pageProperties.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    Aucune propriété ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            {filteredProperties.length === 0
              ? "Aucun résultat"
              : `Affichage de ${(currentPage - 1) * pageSize + 1} à ${Math.min(currentPage * pageSize, filteredProperties.length)} sur ${filteredProperties.length}`}
          </span>
          <div>
            <Button
              variant="secondary"
              icon={ChevronLeft}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
            />
            <button className="page-active" disabled>
              {currentPage}
            </button>
            <span> / {pageCount}</span>
            <Button
              variant="secondary"
              icon={ChevronRight}
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((current) => Math.min(pageCount, current + 1))}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

function PlansPage({
  plans,
  onAdd,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  plans: PlanRecord[];
  onAdd: () => void;
  onEdit: (plan: PlanRecord) => void;
  onTogglePublish: (plan: PlanRecord) => void;
  onDelete: (plan: PlanRecord) => void;
}) {
  return (
    <div className="page-content">
      <ListHeader
        eyebrow="ARCHITECTURE"
        title="Plans architecturaux"
        description="Ajoutez les plans et aperçus que DAFS Services souhaite présenter."
        action="Ajouter un plan"
        onAction={onAdd}
      />
      <div className="inline-stats">
        <div className="inline-stat-active"><strong>{plans.length}</strong><span>Total</span></div>
        <div><strong>{plans.filter((plan) => plan.status === "Publié").length}</strong><span>Publiés</span></div>
        <div><strong>{plans.filter((plan) => plan.status === "Brouillon").length}</strong><span>Brouillons</span></div>
      </div>
      <article className="panel table-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Plan</th><th>Référence</th><th>Catégorie</th><th>Détails</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td><div className="property-cell"><div className="property-thumb">{plan.image ? <img src={plan.image} alt="" /> : <Layers3 size={18} />}</div><strong>{plan.title}</strong></div></td>
                  <td>{plan.ref}</td>
                  <td>{plan.category || "Non renseignée"}</td>
                  <td>{plan.details || "Détails à renseigner"}</td>
                  <td><Badge tone={plan.tone}>{plan.status}</Badge></td>
                  <td><div className="row-actions">
                    <Button variant="icon" icon={Pencil} onClick={() => onEdit(plan)} title={`Modifier ${plan.title}`} />
                    <Button variant="icon" icon={Globe2} onClick={() => onTogglePublish(plan)} title={plan.status === "Publié" ? "Retirer du site public" : "Publier sur le site"} />
                    <Button variant="icon" icon={Trash2} onClick={() => onDelete(plan)} title={`Supprimer ${plan.title}`} />
                  </div></td>
                </tr>
              ))}
              {!plans.length && <tr><td colSpan={6} className="empty-table-cell">Aucun plan enregistré pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function InquiriesPage({
  inquiries,
  onStatusChange,
}: {
  inquiries: InquiryRecord[];
  onStatusChange: (inquiry: InquiryRecord, status: InquiryRecord["status"]) => void;
}) {
  const labels: Record<InquiryRecord["status"], string> = {
    new: "Nouvelle",
    in_progress: "En cours",
    waiting: "En attente",
    resolved: "Résolue",
    archived: "Archivée",
  };
  return (
    <div className="page-content">
      <ListHeader
        eyebrow="RELATION CLIENT"
        title="Réservations & demandes"
        description="Consultez les demandes envoyées depuis le site public et mettez à jour leur suivi."
        action={`${inquiries.length} demande${inquiries.length === 1 ? "" : "s"}`}
        icon={MessageSquareText}
      />
      <div className="inline-stats">
        <div className="inline-stat-active"><strong>{inquiries.length}</strong><span>Reçues</span></div>
        <div><strong>{inquiries.filter((item) => item.status === "new").length}</strong><span>Nouvelles</span></div>
        <div><strong>{inquiries.filter((item) => item.status === "in_progress" || item.status === "waiting").length}</strong><span>À traiter</span></div>
        <div><strong>{inquiries.filter((item) => item.status === "resolved").length}</strong><span>Résolues</span></div>
      </div>
      <article className="panel table-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Référence</th><th>Client</th><th>Demande</th><th>Type</th><th>Date</th><th>Suivi</th></tr></thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td><strong>{inquiry.reference}</strong></td>
                  <td><div><strong>{inquiry.name}</strong><br /><small>{inquiry.contact}</small></div></td>
                  <td><details><summary>{inquiry.subject}</summary><p>{inquiry.message}</p></details></td>
                  <td>{inquiry.type}</td>
                  <td>{inquiry.date}</td>
                  <td><select aria-label={`Statut de ${inquiry.reference}`} value={inquiry.status} onChange={(event) => onStatusChange(inquiry, event.target.value as InquiryRecord["status"])}>
                    {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select></td>
                </tr>
              ))}
              {!inquiries.length && <tr><td colSpan={6} className="empty-table-cell">Aucune demande reçue pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function PlanModal({
  plan,
  close,
  onSave,
}: {
  plan: PlanRecord | null;
  close: () => void;
  onSave: (draft: PlanDraft, planId?: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<PlanDraft>(() => {
    const area = plan?.details.match(/[\d.,]+(?=\s*m²)/)?.[0] ?? "";
    const bedrooms = plan?.details.match(/(\d+)\s+chambres?/)?.[1] ?? "";
    const floors = plan?.details.includes("Plain-pied")
      ? "1"
      : plan?.details.match(/R\+(\d+)/)?.[1]
        ? String(Number(plan.details.match(/R\+(\d+)/)?.[1]) + 1)
        : "";
    return { title: plan?.title ?? "", description: plan?.description ?? "", category: plan?.category ?? "", area, bedrooms, floors, preview: null };
  });
  const update = <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  if (saved) {
    return <div className="modal-backdrop"><section className="success-modal"><div className="success-check"><Check size={30} /></div><h2>Plan enregistré</h2><p>Le plan a été enregistré dans Supabase.</p><Button onClick={close}>Retour aux plans</Button></section></div>;
  }
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
          await onSave(draft, plan?.id);
          setSaved(true);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "L’enregistrement a échoué.");
        } finally {
          setSaving(false);
        }
      }}>
        <div className="modal-header"><div><p className="eyebrow">{plan ? "MODIFIER LE PLAN" : "NOUVEAU PLAN"}</p><h2>{plan ? "Modifier le plan" : "Ajouter un plan architectural"}</h2><span>Le plan sera enregistré comme brouillon.</span></div><Button variant="icon" icon={X} onClick={close} /></div>
        <div className="modal-body form-grid">
          <label className="full-field"><span>Nom du plan *</span><input required maxLength={200} value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
          <label className="full-field"><span>Description publique</span><textarea rows={4} maxLength={10000} value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="Présentez le modèle et ses caractéristiques." /></label>
          <label><span>Catégorie</span><input maxLength={120} value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Villa, maison…" /></label>
          <label><span>Surface bâtie (m²)</span><input type="number" min="1" step="0.01" value={draft.area} onChange={(event) => update("area", event.target.value)} /></label>
          <label><span>Chambres</span><input type="number" min="0" step="1" value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} /></label>
          <label><span>Niveaux</span><input type="number" min="0" step="1" value={draft.floors} onChange={(event) => update("floors", event.target.value)} /></label>
          <label className="full-field"><span>Aperçu du plan (JPG, PNG ou WebP)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => update("preview", event.target.files?.[0] ?? null)} />{draft.preview && <small>{draft.preview.name}</small>}</label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-footer"><Button variant="ghost" onClick={close}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer comme brouillon"}</Button></div>
      </form>
    </div>
  );
}

const sectionData: Record<
  Exclude<Page, "dashboard" | "properties" | "settings" | "site">,
  {
    eyebrow: string;
    description: string;
    action: string;
    cards: { label: string; value: string; note: string }[];
    columns: string[];
    rows: string[][];
  }
> = {
  requests: {
    eyebrow: "RELATION CLIENT",
    description: "Les réservations, visites et demandes clients apparaîtront ici.",
    action: "Ajouter une demande",
    cards: [
      { label: "Demandes reçues", value: "0", note: "Aucune donnée" },
      { label: "Visites", value: "0", note: "Aucune donnée" },
      { label: "Réservations", value: "0", note: "Aucune donnée" },
      { label: "Demandes à traiter", value: "0", note: "Aucune donnée" },
    ],
    columns: ["Client", "Objet", "Type", "Responsable", "Date", "Statut"],
    rows: [],
  },
  plans: {
    eyebrow: "ARCHITECTURE",
    description: "Ajoutez les plans et fichiers que DAFS Services souhaite publier.",
    action: "Ajouter un plan",
    cards: [
      { label: "Plans publiés", value: "0", note: "Aucune donnée" },
      { label: "Brouillons", value: "0", note: "Aucune donnée" },
      { label: "Accès autorisés", value: "0", note: "Aucune donnée" },
      { label: "Téléchargements", value: "0", note: "Aucune donnée" },
    ],
    columns: ["Plan", "Référence", "Catégorie", "Surface", "Niveaux", "Prix", "Statut"],
    rows: [],
  },
  estimates: {
    eyebrow: "CONSTRUCTION",
    description: "Configurez les barèmes avant de proposer un simulateur public.",
    action: "Créer un devis",
    cards: [
      { label: "Devis générés", value: "0", note: "Aucune donnée" },
      { label: "En discussion", value: "0", note: "Aucune donnée" },
      { label: "Acceptés", value: "0", note: "Aucune donnée" },
      { label: "Barèmes actifs", value: "0", note: "Aucune donnée" },
    ],
    columns: ["Référence", "Client", "Construction", "Surface", "Finition", "Budget estimé", "Statut"],
    rows: [],
  },
  users: {
    eyebrow: "ACCÈS & PERMISSIONS",
    description: "Les comptes et permissions seront affichés après la configuration de l’accès administrateur.",
    action: "Inviter un utilisateur",
    cards: [
      { label: "Utilisateurs actifs", value: "0", note: "Aucune donnée" },
      { label: "Invitations", value: "0", note: "Aucune donnée" },
      { label: "Sessions actives", value: "0", note: "Aucune donnée" },
      { label: "Alertes sécurité", value: "0", note: "Aucune donnée" },
    ],
    columns: ["Utilisateur", "E-mail", "Rôle", "Téléphone", "Dernière connexion", "Statut"],
    rows: [],
  },
  reports: {
    eyebrow: "PERFORMANCE",
    description: "Les rapports seront disponibles après la collecte de données réelles.",
    action: "Exporter le rapport",
    cards: [
      { label: "Vues des annonces", value: "0", note: "Aucune donnée" },
      { label: "Demandes reçues", value: "0", note: "Aucune donnée" },
      { label: "Taux de conversion", value: "0", note: "Aucune donnée" },
      { label: "Valeur des devis", value: "0", note: "Aucune donnée" },
    ],
    columns: ["Indicateur", "Module", "Période actuelle", "Période précédente", "Variation", "Tendance"],
    rows: [],
  },
};

function ModulePage({ page }: { page: Exclude<Page, "dashboard" | "properties" | "settings" | "site"> }) {
  const data = sectionData[page];
  const rows: string[][] = [];
  return (
    <div className="page-content">
      <ListHeader
        eyebrow={data.eyebrow}
        title={pageTitles[page].title}
        description={data.description}
        action={data.action}
        icon={page === "reports" ? Download : Plus}
      />
      <div className="module-stats">
        {data.cards.map((card, i) => (
          <article key={card.label}>
            <span className={`module-icon module-icon-${i}`}>
              <TrendingUp size={17} />
            </span>
            <div>
              <p>{card.label}</p>
              <strong>0</strong>
              <small>Aucune donnée enregistrée</small>
            </div>
          </article>
        ))}
      </div>
      <article className="panel table-panel module-table">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input placeholder="Aucune donnée disponible" disabled />
          </label>
          <div>
            <Button variant="secondary" icon={SlidersHorizontal} disabled>
              Filtrer
            </Button>
            <Button variant="secondary" icon={Download} disabled>
              Exporter
            </Button>
          </div>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                {data.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      {j === row.length - 1 ? (
                        <Badge
                          tone={
                            cell === "Actif" ||
                            cell === "Publié" ||
                            cell === "Accepté" ||
                            cell === "Résolu" ||
                            cell === "Hausse"
                              ? "success"
                              : cell === "Nouveau" || cell === "Envoyé"
                                ? "info"
                                : cell === "En cours" ||
                                    cell === "En discussion" ||
                                    cell === "À traiter"
                                  ? "warning"
                                  : "neutral"
                          }
                        >
                          {cell}
                        </Badge>
                      ) : j === 0 ? (
                        <strong>{cell}</strong>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  <td>
                    <Button variant="icon" icon={MoreHorizontal} />
                  </td>
                </tr>
              )) : (
                <tr><td className="empty-table-cell" colSpan={data.columns.length + 1}>Aucune donnée enregistrée pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Aucun enregistrement</span>
        </div>
      </article>
    </div>
  );
}

function SettingsPage({
  settings,
  onSave,
}: {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const update = (field: keyof CompanySettings, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Les paramètres n’ont pas pu être enregistrés.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="page-content">
      <ListHeader
        eyebrow="CONFIGURATION"
        title="Paramètres généraux"
        description="Gérez l’identité, les coordonnées et les préférences de DAFS Services."
        action="Enregistrer"
        icon={Check}
        onAction={() => { void save(); }}
      />
      {saved && (
        <div className="success-toast">
          <CheckCircle2 size={18} />
          Paramètres enregistrés avec succès.
        </div>
      )}
      <div className="settings-layout">
        <aside className="settings-nav">
          {[
            ["Identité & coordonnées", Building2],
          ].map(([label, I], i) => {
            const ItemIcon = I as Icon;
            return (
              <button key={label as string} className={i === 0 ? "active" : ""}>
                <ItemIcon size={17} />
                {label as string}
                <ChevronRight size={14} />
              </button>
            );
          })}
        </aside>
        <article className="panel settings-form">
          <div className="form-heading">
            <h2>Identité de l’entreprise</h2>
            <p>Ces informations sont utilisées sur le site public et dans vos documents.</p>
          </div>
          <div className="form-grid">
            <label className="full-field">
              <span>Titre de la page d’accueil</span>
              <input maxLength={180} value={draft.home_title} onChange={(event) => update("home_title", event.target.value)} placeholder={"Trouvez votre espace.\nImaginez votre avenir."} />
            </label>
            <label className="full-field">
              <span>Introduction de la page d’accueil</span>
              <textarea maxLength={500} rows={3} value={draft.home_intro} onChange={(event) => update("home_intro", event.target.value)} placeholder="Présentez l’offre DAFS Services en quelques lignes." />
            </label>
          </div>
          <div className="form-grid">
            <label>
              <span>Nom de l’entreprise</span>
              <input maxLength={120} value={draft.company_name} onChange={(event) => update("company_name", event.target.value)} />
            </label>
            <label>
              <span>Nom légal</span>
              <input maxLength={180} value={draft.legal_name} onChange={(event) => update("legal_name", event.target.value)} placeholder="Raison sociale" />
            </label>
            <label className="full-field">
              <span>Description</span>
              <textarea maxLength={1000} value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="Présentez l’activité de l’entreprise" rows={4} />
            </label>
            <label>
              <span>Adresse e-mail</span>
              <input maxLength={255} type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} placeholder="Adresse e-mail officielle" />
            </label>
            <label>
              <span>Téléphone</span>
              <input maxLength={30} type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Téléphone officiel" />
            </label>
            <label>
              <span>WhatsApp</span>
              <input maxLength={30} type="tel" value={draft.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="Numéro au format international" />
            </label>
            <label>
              <span>Adresse complète (pour l’itinéraire)</span>
              <input maxLength={250} value={draft.address} onChange={(event) => update("address", event.target.value)} placeholder="Avenue, numéro, quartier et commune, Kinshasa" />
            </label>
            <label className="full-field">
              <span>Titre de la page « À propos »</span>
              <input maxLength={180} value={draft.about_title} onChange={(event) => update("about_title", event.target.value)} placeholder="À propos de DAFS Services" />
            </label>
            <label className="full-field">
              <span>Présentation de l’entreprise</span>
              <textarea maxLength={10000} rows={6} value={draft.about_content} onChange={(event) => update("about_content", event.target.value)} placeholder="Rédigez la présentation publique. Séparez les paragraphes par une ligne vide." />
            </label>
            <label className="full-field">
              <span>Questions fréquentes</span>
              <textarea maxLength={10000} rows={6} value={draft.faq_content} onChange={(event) => update("faq_content", event.target.value)} placeholder="Ajoutez les réponses et informations utiles aux visiteurs." />
            </label>
            <label className="full-field">
              <span>Informations légales</span>
              <textarea maxLength={10000} rows={6} value={draft.legal_content} onChange={(event) => update("legal_content", event.target.value)} placeholder="Saisissez les informations légales validées par DAFS Services." />
            </label>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="form-footer">
            <span>{saved ? "Informations enregistrées." : "Ces informations sont affichées sur le site public."}</span>
            <Button
              icon={Check}
              onClick={() => { void save(); }}
              disabled={saving}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}

function PropertyModal({
  close,
  onSave,
  property,
}: {
  close: () => void;
  onSave: (draft: PropertyDraft, propertyId?: string) => Promise<void>;
  property?: PropertyRecord | null;
}) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [draft, setDraft] = useState(() => {
    const [category = "", storedOperation = ""] = property?.kind.split(" · ") ?? [];
    const operation = storedOperation === "Location" ? "Location longue durée" : storedOperation;
    const [city = "", municipality = ""] = property?.location.split(", ") ?? [];
    const amount = property?.price.replace(/[^\d,.]/g, "").replace(",", ".") ?? "";
    const currency = property?.price.includes("CDF") ? "CDF" : property?.price.includes("€") ? "EUR" : property ? "USD" : "";
    return {
      title: property?.title ?? "",
      shortDescription: property?.shortDescription ?? "",
      description: property?.description ?? "",
      category,
      operation,
      city: property?.city ?? (city === "Kinshasa" ? city : city || "Kinshasa"),
      municipality: property?.municipality ?? municipality,
      neighborhood: property?.neighborhood ?? "",
      address: property?.address ?? "",
      price: amount,
      isNegotiable: property?.isNegotiable ?? false,
      currency,
      bedrooms: property?.bedrooms?.toString() ?? "",
      bathrooms: property?.bathrooms?.toString() ?? "",
      livingArea: property?.livingArea?.toString() ?? "",
      landArea: property?.landArea?.toString() ?? "",
      image: null as File | null,
      removeImage: false,
    };
  });
  const updateDraft = <Field extends keyof typeof draft>(field: Field, value: (typeof draft)[Field]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError("");
  };
  const continueStep = () => {
    if (step === 1 && (!draft.title.trim() || !draft.category || !draft.operation)) {
      setValidationError("Renseignez le titre, le type de bien et l’opération pour continuer.");
      return;
    }
    if (step === 2 && !draft.municipality.trim()) {
      setValidationError("Renseignez la commune pour continuer.");
      return;
    }
    if (step === 2 && draft.price && (!draft.currency || !Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0)) {
      setValidationError("Indiquez une devise et un montant valide, ou laissez le prix vide.");
      return;
    }
    setValidationError("");
    setStep((current) => Math.min(3, current + 1));
  };
  if (done)
    return (
      <div className="modal-backdrop">
        <div className="success-modal">
          <div className="success-check">
            <Check size={30} />
          </div>
          <h2>{property ? "Modifications enregistrées" : "Propriété enregistrée"}</h2>
          <p>
            {property
              ? "Les informations ont été enregistrées dans Supabase."
              : "L’annonce a été enregistrée comme brouillon dans Supabase."}
          </p>
          <Button onClick={close}>Retour aux propriétés</Button>
        </div>
      </div>
    );
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{property ? "MODIFIER L’ANNONCE" : "NOUVELLE ANNONCE"}</p>
            <h2>{property ? "Modifier la propriété" : "Ajouter une propriété"}</h2>
            <span>
              Étape {step} sur 3 ·{" "}
              {step === 1
                ? "Informations générales"
                : step === 2
                  ? "Localisation & prix"
                  : "Vérification"}
            </span>
          </div>
          <Button variant="icon" icon={X} onClick={close} />
        </div>
        <div className="stepper">
          {["Informations", "Localisation & prix", "Publication"].map((s, i) => (
            <div key={s} className={step >= i + 1 ? "step-active" : ""}>
              <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
              <em>{s}</em>
            </div>
          ))}
        </div>
        <div className="modal-body">
          {step === 1 && (
            <div className="form-grid">
              <label className="full-field">
                <span>Titre de l’annonce *</span>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="Ex. Villa contemporaine avec piscine"
                  autoFocus
                />
              </label>
              <label>
                <span>Type de bien *</span>
                <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}>
                  <option value="" disabled>
                    Sélectionner
                  </option>
                  <option>Villa</option>
                  <option>Appartement</option>
                  <option>Maison</option>
                  <option>Duplex</option>
                  <option>Studio</option>
                  <option>Parcelle</option>
                  <option>Terrain</option>
                  <option>Local commercial</option>
                  <option>Autre</option>
                </select>
              </label>
              <label>
                <span>Type d’opération *</span>
                <select value={draft.operation} onChange={(event) => updateDraft("operation", event.target.value)}>
                  <option value="" disabled>Sélectionner</option>
                  <option>Vente</option>
                  <option>Location courte durée</option>
                  <option>Location longue durée</option>
                </select>
              </label>
              <label className="full-field">
                <span>Description courte</span>
                <textarea rows={4} maxLength={500} value={draft.shortDescription} onChange={(event) => updateDraft("shortDescription", event.target.value)} placeholder="Présentez les principaux atouts du bien…" />
              </label>
              <label className="full-field">
                <span>Description détaillée</span>
                <textarea rows={5} maxLength={10000} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Décrivez le bien, son état et les informations utiles aux visiteurs." />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="form-grid">
              <label>
                <span>Ville</span>
                <input value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />
              </label>
              <label>
                <span>Commune *</span>
                <input
                  list="kinshasa-communes"
                  value={draft.municipality}
                  onChange={(event) => updateDraft("municipality", event.target.value)}
                  placeholder="Choisir ou saisir une commune"
                />
                <datalist id="kinshasa-communes">{kinshasaCommunes.map((commune) => <option key={commune} value={commune} />)}</datalist>
              </label>
              <label>
                <span>Quartier</span>
                <input value={draft.neighborhood} onChange={(event) => updateDraft("neighborhood", event.target.value)} placeholder="Ex. Bandal Molard" />
              </label>
              <label className="full-field">
                <span>Adresse complète ou repère</span>
                <textarea rows={2} value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Avenue, numéro, référence ou repère connu. Le champ peut rester vide si l’information doit être complétée." />
              </label>
              <label><span>Surface habitable (m²)</span><input type="number" min="0" step="0.01" value={draft.livingArea} onChange={(event) => updateDraft("livingArea", event.target.value)} /></label>
              <label><span>Surface du terrain (m²)</span><input type="number" min="0" step="0.01" value={draft.landArea} onChange={(event) => updateDraft("landArea", event.target.value)} /></label>
              <label><span>Chambres</span><input type="number" min="0" step="1" value={draft.bedrooms} onChange={(event) => updateDraft("bedrooms", event.target.value)} /></label>
              <label><span>Salles d’eau</span><input type="number" min="0" step="1" value={draft.bathrooms} onChange={(event) => updateDraft("bathrooms", event.target.value)} /></label>
              <label>
                <span>Prix (facultatif)</span>
                <input
                  type="number"
                  min="1"
                  value={draft.price}
                  onChange={(event) => updateDraft("price", event.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={draft.isNegotiable} onChange={(event) => updateDraft("isNegotiable", event.target.checked)} />
                <span>Prix à discuter</span>
              </label>
              <label>
                <span>Devise</span>
                <select value={draft.currency} onChange={(event) => updateDraft("currency", event.target.value)}>
                  <option value="" disabled>Sélectionner</option>
                  <option>USD</option>
                  <option>CDF</option>
                  <option>EUR</option>
                </select>
              </label>
              <label className="full-field">
                <span>Photo principale (facultative)</span>
                {property?.image && !draft.removeImage && !draft.image && <div className="property-image-current"><img src={property.image} alt={`Photo actuelle de ${property.title}`} /><span>Photo actuelle</span><button type="button" onClick={() => updateDraft("removeImage", true)}>Supprimer cette photo</button></div>}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { updateDraft("image", event.target.files?.[0] ?? null); if (event.target.files?.[0]) updateDraft("removeImage", false); }}
                />
                {draft.image && <small>{draft.image.name}</small>}
                {draft.removeImage && !draft.image && <small>La photo principale sera supprimée.</small>}
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="review-box">
              <div className="review-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>Prêt à enregistrer ?</h3>
              <p>
                {draft.title} · {draft.category} · {draft.city || "Ville non renseignée"}
                {draft.municipality ? `, ${draft.municipality}` : ""}
                {draft.price ? ` · ${draft.price} ${draft.currency}` : " · Prix sur demande"}
              </p>
              <div>
                <CheckCircle2 size={16} />
                {draft.image ? "La photo principale sera remplacée." : draft.removeImage ? "La photo principale sera supprimée." : "L’annonce sera enregistrée sans nouvelle photo."}
              </div>
            </div>
          )}
        </div>
        {validationError && <p className="form-error" role="alert">{validationError}</p>}
        <div className="modal-footer">
          <Button variant="ghost" onClick={step === 1 ? close : () => setStep(step - 1)}>
            {step === 1 ? "Annuler" : "Retour"}
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              if (step < 3) {
                continueStep();
                return;
              }
              setSaving(true);
              setValidationError("");
              try {
                await onSave(
                  {
                    title: draft.title.trim(),
                    shortDescription: draft.shortDescription.trim(),
                    description: draft.description.trim(),
                    category: draft.category,
                    operation: draft.operation,
                    city: draft.city.trim(),
                    municipality: draft.municipality.trim(),
                    neighborhood: draft.neighborhood.trim(),
                    address: draft.address.trim(),
                    price: draft.price,
                    isNegotiable: draft.isNegotiable,
                    currency: draft.currency,
                    bedrooms: draft.bedrooms,
                    bathrooms: draft.bathrooms,
                    livingArea: draft.livingArea,
                    landArea: draft.landArea,
                    image: draft.image,
                    removeImage: draft.removeImage,
                  },
                  property?.id,
                );
                setDone(true);
              } catch (error) {
                setValidationError(error instanceof Error ? error.message : "L’enregistrement a échoué.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {step < 3 ? "Continuer" : saving ? "Enregistrement…" : property ? "Enregistrer les modifications" : "Enregistrer comme brouillon"}
            {step < 3 && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ close }: { close: () => void }) {
  return (
    <>
      <div className="panel-backdrop" onClick={close} />
      <aside className="notification-panel">
        <div className="notification-head">
          <div>
            <h2>Notifications</h2>
            <span>Aucune notification</span>
          </div>
          <Button variant="icon" icon={X} onClick={close} />
        </div>
        <div className="notifications empty-notifications">
          <p>Les nouvelles demandes et actions importantes apparaîtront ici.</p>
        </div>
      </aside>
    </>
  );
}

function AdminAccess({
  pending,
  error,
  onSignIn,
}: {
  pending: boolean;
  error: string;
  onSignIn: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [configError, setConfigError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfigError("");
    try {
      await onSignIn(email.trim(), password);
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Connexion impossible.");
    }
  };

  return (
    <main className="admin-auth-screen">
      <section className="admin-auth-card">
        <div className="admin-auth-mark"><Building2 size={25} /></div>
        <p className="eyebrow">DAFS SERVICES</p>
        <h1>Administration</h1>
        {!supabase ? (
          <p className="auth-message">La connexion à Supabase n’est pas configurée dans cet environnement.</p>
        ) : (
          <form onSubmit={submit}>
            <label>
              Adresse e-mail
              <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {(error || configError) && <p className="auth-error" role="alert">{error || configError}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [managedProperties, setManagedProperties] = useState<PropertyRecord[]>(properties);
  const [managedPlans, setManagedPlans] = useState<PlanRecord[]>([]);
  const [managedInquiries, setManagedInquiries] = useState<InquiryRecord[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: "DAFS SERVICES",
    legal_name: "",
    description: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    about_title: "",
    about_content: "",
    faq_content: "",
    legal_content: "",
    home_title: "",
    home_intro: "",
  });
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanRecord | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !session) {
      setIsAdmin(false);
      setAuthLoading(false);
      return;
    }
    let active = true;
    setAuthLoading(true);
    const verifyAdministrator = async () => {
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("is_active")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError || !profile?.is_active) {
        setAuthError("Ce compte n’est pas activé pour l’administration.");
        setIsAdmin(false);
        setAuthLoading(false);
        await client.auth.signOut();
        return;
      }
      const { data: assignedRoles, error: roleError } = await client
        .from("user_roles")
        .select("role_id")
        .eq("user_id", session.user.id);
      if (!active) return;
      if (roleError || !assignedRoles?.length) {
        setAuthError("Aucun rôle d’administration n’est attribué à ce compte.");
        setIsAdmin(false);
        setAuthLoading(false);
        await client.auth.signOut();
        return;
      }
      setAuthError("");
      setIsAdmin(true);
      setAuthLoading(false);
    };
    void verifyAdministrator();
    return () => {
      active = false;
    };
  }, [session]);

  const loadProperties = async () => {
    const client = supabase;
    if (!client || !session) return;
    setPropertiesLoading(true);
    setPropertiesError("");
    const { data, error } = await client
      .from("properties")
      .select("id, reference, title, short_description, description, operation_type, publication_status, city, municipality, neighborhood, address, bedrooms, bathrooms, living_area_m2, land_area_m2, price_amount, currency, pricing_period, is_negotiable, property_categories(name), property_images(storage_path, is_primary, sort_order)")
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      setPropertiesError("Les annonces ne peuvent pas être chargées. Vérifiez que la migration Supabase a été appliquée.");
      setPropertiesLoading(false);
      return;
    }
    const records = (data ?? []).map((row: any): PropertyRecord => {
      const imageList = [...(row.property_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      );
      const imagePath = imageList[0]?.storage_path;
      const operation = row.operation_type === "short_rental"
        ? "Location courte durée"
        : row.operation_type === "long_rental" ? "Location longue durée" : "Vente";
      const status = row.publication_status === "published" ? "Publiée"
        : row.publication_status === "pending_review" ? "À valider"
          : row.publication_status === "archived" ? "Archivée" : "Brouillon";
      const amount = row.price_amount && row.currency
        ? `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency }).format(row.price_amount)}${row.pricing_period === "month" ? " / mois" : row.pricing_period === "night" ? " / nuit" : ""}${row.is_negotiable ? " · à discuter" : ""}`
        : "Prix sur demande";
      return {
        id: row.id,
        ref: row.reference,
        title: row.title,
        shortDescription: row.short_description ?? "",
        description: row.description ?? "",
        kind: `${row.property_categories?.name ?? "Bien immobilier"} · ${operation}`,
        location: [row.city, row.municipality, row.neighborhood].filter(Boolean).join(", ") || "Localisation à renseigner",
        city: row.city ?? "",
        municipality: row.municipality ?? "",
        neighborhood: row.neighborhood ?? "",
        address: row.address ?? "",
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        livingArea: row.living_area_m2,
        landArea: row.land_area_m2,
        price: amount,
        isNegotiable: row.is_negotiable,
        status,
        tone: status === "Publiée" ? "success" : status === "À valider" ? "warning" : "neutral",
        color: "image-one",
        image: imagePath ? imagePath.startsWith("local:") ? imagePath.slice("local:".length) : client.storage.from("property-images").getPublicUrl(imagePath).data.publicUrl : undefined,
        imagePath,
      };
    });
    setManagedProperties(records);
    setPropertiesLoading(false);
  };

  const loadPlans = async () => {
    const client = supabase;
    if (!client || !session) return;
    const { data, error } = await client
      .from("architectural_plans")
      .select("id, reference, title, description, category, built_area_m2, bedrooms, floors, publication_status, preview_storage_path")
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      setPropertiesError("Les plans ne peuvent pas être chargés. Vérifiez la migration Supabase.");
      return;
    }
    setManagedPlans((data ?? []).map((row: any): PlanRecord => {
      const status = row.publication_status === "published" ? "Publié" : "Brouillon";
      const details = [
        row.built_area_m2 && `${row.built_area_m2} m²`,
        row.bedrooms !== null && row.bedrooms !== undefined && `${row.bedrooms} chambres`,
        row.floors && (row.floors === 1 ? "Plain-pied" : `R+${row.floors - 1}`),
      ].filter(Boolean).join(" · ");
      return {
        id: row.id,
        ref: row.reference,
        title: row.title,
        description: row.description ?? "",
        category: row.category ?? "",
        details,
        status,
        tone: status === "Publié" ? "success" : "neutral",
        storagePath: row.preview_storage_path ?? undefined,
        image: row.preview_storage_path
          ? client.storage.from("architectural-previews").getPublicUrl(row.preview_storage_path).data.publicUrl
          : undefined,
      };
    }));
  };

  const loadInquiries = async () => {
    const client = supabase;
    if (!client || !session) return;
    const { data, error } = await client
      .from("inquiries")
      .select("id, reference, full_name, email, phone, inquiry_type, subject, message, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setPropertiesError("Les demandes ne peuvent pas être chargées. Vérifiez la migration Supabase.");
      return;
    }
    const types: Record<string, string> = {
      general: "Générale",
      property: "Immobilier",
      visit: "Visite",
      reservation: "Réservation",
      plan: "Plan architectural",
      estimate: "Estimation",
    };
    setManagedInquiries((data ?? []).map((row: any): InquiryRecord => ({
      id: row.id,
      reference: row.reference,
      name: row.full_name,
      contact: [row.email, row.phone].filter(Boolean).join(" · "),
      subject: row.subject || "Demande sans objet",
      message: row.message,
      type: types[row.inquiry_type] ?? row.inquiry_type,
      date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(row.created_at)),
      status: row.status,
    })));
  };

  const loadCompanySettings = async () => {
    const client = supabase;
    if (!client || !session) return;
    const { data, error } = await client
      .from("site_settings")
      .select("settings")
      .eq("id", "global")
      .maybeSingle();
    if (error) {
      setPropertiesError("Les informations du site ne peuvent pas être chargées. Appliquez la migration Supabase.");
      return;
    }
    const values = (data?.settings ?? {}) as Partial<CompanySettings>;
    setCompanySettings({
      company_name: values.company_name || "DAFS SERVICES",
      legal_name: values.legal_name || "",
      description: values.description || "",
      email: values.email || "",
      phone: values.phone || "",
      whatsapp: values.whatsapp || "",
      address: values.address || "",
      about_title: values.about_title || "",
      about_content: values.about_content || "",
      faq_content: values.faq_content || "",
      legal_content: values.legal_content || "",
      home_title: values.home_title || "",
      home_intro: values.home_intro || "",
    });
  };

  useEffect(() => {
    if (isAdmin) {
      void loadProperties();
      void loadPlans();
      void loadInquiries();
      void loadCompanySettings();
    }
  }, [isAdmin, session]);

  const savePlan = async (draft: PlanDraft, planId?: string) => {
    const client = supabase;
    if (!client || !session) throw new Error("Votre session a expiré. Reconnectez-vous.");
    const id = planId ?? crypto.randomUUID();
    const existingPlan = managedPlans.find((item) => item.id === planId);
    let previewPath = existingPlan?.storagePath ?? null;
    if (draft.preview) {
      const safeName = draft.preview.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
      previewPath = `${id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await client.storage.from("architectural-previews").upload(previewPath, draft.preview, {
        cacheControl: "3600",
        contentType: draft.preview.type,
        upsert: false,
      });
      if (uploadError) throw new Error("L’aperçu n’a pas pu être téléversé.");
    }
    const slugBase = draft.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const planData = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      slug: `${slugBase}-${id.slice(0, 8)}`,
      reference: existingPlan?.ref ?? `PLN-${id.slice(0, 8).toUpperCase()}`,
      category: draft.category.trim() || null,
      built_area_m2: draft.area ? Number(draft.area) : null,
      bedrooms: draft.bedrooms ? Number(draft.bedrooms) : null,
      floors: draft.floors ? Number(draft.floors) : null,
      preview_storage_path: previewPath,
      updated_by: session.user.id,
    };
    const result = planId
      ? await client.from("architectural_plans").update(planData).eq("id", planId)
      : await client.from("architectural_plans").insert({
          ...planData,
          id,
          created_by: session.user.id,
          publication_status: "draft",
        });
    if (result.error) {
      if (draft.preview && previewPath) await client.storage.from("architectural-previews").remove([previewPath]);
      throw new Error("Le plan n’a pas pu être enregistré. Vérifiez les champs et les autorisations.");
    }
    if (draft.preview && existingPlan?.storagePath) {
      await client.storage.from("architectural-previews").remove([existingPlan.storagePath]);
    }
    await loadPlans();
  };

  const togglePlanPublication = async (plan: PlanRecord) => {
    const client = supabase;
    if (!client || !session) return;
    const publish = plan.status !== "Publié";
    const { error } = await client
      .from("architectural_plans")
      .update({
        publication_status: publish ? "published" : "unpublished",
        published_at: publish ? new Date().toISOString() : null,
        updated_by: session.user.id,
      })
      .eq("id", plan.id);
    if (error) {
      setPropertiesError("Le statut du plan n’a pas pu être modifié.");
      return;
    }
    await loadPlans();
  };

  const deletePlan = async (plan: PlanRecord) => {
    if (!supabase || !window.confirm(`Supprimer définitivement le plan « ${plan.title} » ?`)) return;
    setPropertiesError("");
    const { error } = await supabase.from("architectural_plans").delete().eq("id", plan.id);
    if (error) { setPropertiesError("Le plan n’a pas pu être supprimé."); return; }
    if (plan.storagePath) {
      const { error: storageError } = await supabase.storage.from("architectural-previews").remove([plan.storagePath]);
      if (storageError) setPropertiesError("Le plan est supprimé, mais son aperçu est resté dans Storage.");
    }
    await loadPlans();
  };

  const updateInquiryStatus = async (inquiry: InquiryRecord, status: InquiryRecord["status"]) => {
    const client = supabase;
    if (!client || !session) return;
    const { error } = await client
      .from("inquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", inquiry.id);
    if (error) {
      setPropertiesError("Le statut de la demande n’a pas pu être modifié.");
      return;
    }
    await loadInquiries();
  };

  const saveCompanySettings = async (settings: CompanySettings) => {
    const client = supabase;
    if (!client || !session) throw new Error("Votre session a expiré. Reconnectez-vous.");
    const { error } = await client.from("site_settings").upsert({
      id: "global",
      settings,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) throw new Error("Les informations n’ont pas été enregistrées. Vérifiez les autorisations Supabase.");
    setCompanySettings(settings);
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("La connexion Supabase n’est pas configurée.");
    setAuthPending(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthPending(false);
    if (error) throw new Error("Identifiants invalides ou connexion indisponible.");
  };

  const saveProperty = async (draft: PropertyDraft, propertyId?: string) => {
    if (!supabase || !session) throw new Error("Votre session a expiré. Reconnectez-vous.");
    const { data: category, error: categoryError } = await supabase
      .from("property_categories")
      .select("id")
      .eq("name", draft.category)
      .single();
    if (categoryError || !category) throw new Error("La catégorie choisie est introuvable.");

    const id = propertyId ?? crypto.randomUUID();
    const operationType = draft.operation === "Location courte durée"
      ? "short_rental"
      : draft.operation === "Location longue durée" ? "long_rental" : "sale";
    const slugBase = draft.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const propertyData = {
      id,
      category_id: category.id,
      title: draft.title.trim(),
      short_description: draft.shortDescription.trim() || null,
      description: draft.description.trim() || null,
      slug: `${slugBase}-${id.slice(0, 8)}`,
      operation_type: operationType,
      city: draft.city.trim() || null,
      municipality: draft.municipality.trim() || null,
      neighborhood: draft.neighborhood.trim() || null,
      address: draft.address.trim() || null,
      bedrooms: draft.bedrooms === "" ? null : Number(draft.bedrooms),
      bathrooms: draft.bathrooms === "" ? null : Number(draft.bathrooms),
      living_area_m2: draft.livingArea === "" ? null : Number(draft.livingArea),
      land_area_m2: draft.landArea === "" ? null : Number(draft.landArea),
      price_amount: draft.price ? Number(draft.price) : null,
      currency: draft.price ? draft.currency || null : null,
      is_negotiable: draft.isNegotiable,
      pricing_period: operationType === "short_rental" ? "night" : operationType === "long_rental" ? "month" : "fixed",
      updated_by: session.user.id,
    };
    const mutation = propertyId
      ? await supabase.from("properties").update(propertyData).eq("id", propertyId)
      : await supabase.from("properties").insert({ ...propertyData, created_by: session.user.id });
    if (mutation.error) throw new Error("L’annonce n’a pas pu être enregistrée. Vérifiez les champs et les autorisations.");

    const { data: currentPrimary } = await supabase.from("property_images")
      .select("id, storage_path")
      .eq("property_id", id)
      .eq("is_primary", true)
      .maybeSingle();
    if (draft.image) {
      if (currentPrimary) {
        const { error: clearPrimaryError } = await supabase.from("property_images").update({ is_primary: false }).eq("id", currentPrimary.id);
        if (clearPrimaryError) throw new Error("La photo actuelle ne peut pas être remplacée.");
      }
      const safeName = draft.image.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
      const storagePath = `${id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(storagePath, draft.image, {
        cacheControl: "3600",
        contentType: draft.image.type,
        upsert: false,
      });
      if (uploadError) {
        if (currentPrimary) await supabase.from("property_images").update({ is_primary: true }).eq("id", currentPrimary.id);
        throw new Error("L’annonce est enregistrée, mais la photo n’a pas pu être téléversée.");
      }
      const { error: imageError } = await supabase.from("property_images").insert({
        property_id: id,
        storage_path: storagePath,
        alt_text: draft.title,
        is_primary: true,
        sort_order: 0,
      });
      if (imageError) {
        await supabase.storage.from("property-images").remove([storagePath]);
        if (currentPrimary) await supabase.from("property_images").update({ is_primary: true }).eq("id", currentPrimary.id);
        throw new Error("La photo a été téléversée, mais son association à l’annonce a échoué.");
      }
      if (currentPrimary) {
        await supabase.from("property_images").delete().eq("id", currentPrimary.id);
        if (!currentPrimary.storage_path.startsWith("local:")) await supabase.storage.from("property-images").remove([currentPrimary.storage_path]);
      }
    } else if (draft.removeImage && currentPrimary) {
      const { error: removeRowError } = await supabase.from("property_images").delete().eq("id", currentPrimary.id);
      if (removeRowError) throw new Error("La photo principale n’a pas pu être supprimée.");
      if (!currentPrimary.storage_path.startsWith("local:")) {
        const { error: removeFileError } = await supabase.storage.from("property-images").remove([currentPrimary.storage_path]);
        if (removeFileError) throw new Error("La photo n’est plus liée à l’annonce mais le fichier est resté dans Storage.");
      }
    }
    await loadProperties();
  };

  const deleteProperty = async (property: PropertyRecord) => {
    if (!supabase || !window.confirm(`Supprimer définitivement « ${property.title} » et toutes ses photos ?`)) return;
    setPropertiesError("");
    const { data: images, error: readError } = await supabase.from("property_images").select("storage_path").eq("property_id", property.id);
    if (readError) { setPropertiesError("Les photos de cette annonce n’ont pas pu être identifiées."); return; }
    const { error: deleteError } = await supabase.from("properties").delete().eq("id", property.id);
    if (deleteError) { setPropertiesError("L’annonce n’a pas pu être supprimée."); return; }
    const uploadedImages = images?.filter((image) => !image.storage_path.startsWith("local:")) ?? [];
    if (uploadedImages.length) {
      const { error: storageError } = await supabase.storage.from("property-images").remove(uploadedImages.map((image) => image.storage_path));
      if (storageError) setPropertiesError("L’annonce est supprimée, mais certaines photos sont restées dans Storage.");
    }
    await loadProperties();
  };

  const togglePublication = async (property: PropertyRecord) => {
    if (!supabase || !session) return;
    const publish = property.status !== "Publiée";
    const { error } = await supabase
      .from("properties")
      .update({
        publication_status: publish ? "published" : "unpublished",
        published_at: publish ? new Date().toISOString() : null,
        updated_by: session.user.id,
      })
      .eq("id", property.id);
    if (error) {
      setPropertiesError("Le statut de publication n’a pas pu être modifié.");
      return;
    }
    await loadProperties();
  };

  const content = useMemo(() => {
    if (page === "dashboard")
      return <Dashboard properties={managedProperties} inquiryCount={managedInquiries.length} onAdd={() => setModalOpen(true)} navigate={setPage} />;
    if (page === "properties")
      return (
        <PropertyPage
          properties={managedProperties}
          onAdd={() => {
            setEditingProperty(null);
            setModalOpen(true);
          }}
          onEdit={(property) => {
            setEditingProperty(property);
            setModalOpen(true);
          }}
          onTogglePublish={(property) => { void togglePublication(property); }}
          onDelete={(property) => { void deleteProperty(property); }}
        />
      );
    if (page === "plans")
      return (
        <PlansPage
          plans={managedPlans}
          onAdd={() => {
            setEditingPlan(null);
            setPlanModalOpen(true);
          }}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setPlanModalOpen(true);
          }}
          onTogglePublish={(plan) => { void togglePlanPublication(plan); }}
          onDelete={(plan) => { void deletePlan(plan); }}
        />
      );
    if (page === "requests")
      return <InquiriesPage inquiries={managedInquiries} onStatusChange={(inquiry, status) => { void updateInquiryStatus(inquiry, status); }} />;
    if (page === "settings") return <SettingsPage settings={companySettings} onSave={saveCompanySettings} />;
    if (page === "site") return <SiteContentPage />;
    return <ModulePage page={page} />;
  }, [page, managedProperties, managedPlans, managedInquiries, companySettings]);

  if (authLoading) {
    return <main className="admin-auth-screen"><div className="admin-auth-card">Connexion à l’espace d’administration…</div></main>;
  }
  if (!isAdmin) {
    return <AdminAccess pending={authPending} error={authError} onSignIn={handleSignIn} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        signOut={() => { void supabase?.auth.signOut(); }}
      />
      <main className="main-shell">
        <Topbar
          page={page}
          openMenu={() => setSidebarOpen(true)}
          openNotifications={() => setNotificationsOpen(true)}
        />
        {propertiesError && <div className="data-error" role="alert">{propertiesError}</div>}
        {propertiesLoading && <div className="data-loading">Chargement des annonces…</div>}
        {content}
      </main>
      {modalOpen && (
        <PropertyModal
          property={editingProperty}
          onSave={saveProperty}
          close={() => {
            setModalOpen(false);
            setEditingProperty(null);
          }}
        />
      )}
      {planModalOpen && (
        <PlanModal
          plan={editingPlan}
          onSave={savePlan}
          close={() => {
            setPlanModalOpen(false);
            setEditingPlan(null);
          }}
        />
      )}
      {notificationsOpen && <NotificationPanel close={() => setNotificationsOpen(false)} />}
    </div>
  );
}

export default App;
