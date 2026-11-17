"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload as TusUpload } from "tus-js-client";
import { Check, Eye, EyeOff, Film, Image as ImageIcon, LoaderCircle, Pencil, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { supabase } from "./lib/supabase";

type ServicePage = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  body: string;
  features: string[];
  publication_status: "draft" | "published" | "unpublished";
  sort_order: number;
};

type MediaCategory = "moving" | "cleaning" | "construction" | "architecture" | "brand" | "other";

type MediaAsset = {
  id: string;
  service_id: string | null;
  title: string;
  description: string;
  alt_text: string;
  category: MediaCategory;
  storage_path: string;
  source_path: string;
  mime_type: string;
  file_size: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

type ServiceDraft = Omit<ServicePage, "id">;

const categories: { id: MediaCategory; label: string }[] = [
  { id: "moving", label: "Déménagement & aménagement" },
  { id: "cleaning", label: "Cleaner / nettoyage" },
  { id: "construction", label: "Construction" },
  { id: "architecture", label: "Plans 3D & architecture" },
  { id: "brand", label: "Identité / logo" },
  { id: "other", label: "À classer" },
];

const emptyService: ServiceDraft = {
  slug: "",
  title: "",
  eyebrow: "",
  summary: "",
  body: "",
  features: [],
  publication_status: "draft",
  sort_order: 30,
};

function cleanFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120) || "media";
}

function inferCategory(file: File): MediaCategory {
  const path = (file.webkitRelativePath || file.name).toLowerCase();
  if (path.includes("amenagement") || path.includes("aménagement")) return "moving";
  if (path.includes("construction")) return "construction";
  if (path.includes("plan-3d") || path.includes("plan_3d")) return "architecture";
  if (path.includes("logo")) return "brand";
  return "other";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function storageEndpoint(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith(".supabase.co")) {
    parsed.hostname = parsed.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
  }
  parsed.pathname = "/storage/v1/upload/resumable";
  parsed.search = "";
  return parsed.toString();
}

export default function SiteContentPage() {
  const [tab, setTab] = useState<"services" | "media">("services");
  const [services, setServices] = useState<ServicePage[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("other");
  const [uploadServiceId, setUploadServiceId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, file: "" });
  const [filter, setFilter] = useState<MediaCategory | "all">("all");

  const loadContent = useCallback(async () => {
    if (!supabase) {
      setError("La connexion à Supabase n’est pas configurée dans cet environnement.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const [serviceResult, mediaResult] = await Promise.all([
      supabase.from("service_pages").select("*").order("sort_order").order("title"),
      supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    ]);
    if (serviceResult.error || mediaResult.error) {
      setError("Le module de contenu n’est pas encore configuré. Appliquez la migration 202611170001_services_media.sql dans le SQL Editor Supabase.");
      setLoading(false);
      return;
    }
    setServices((serviceResult.data ?? []) as ServicePage[]);
    setAssets((mediaResult.data ?? []) as MediaAsset[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadContent(); }, [loadContent]);

  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const visibleAssets = useMemo(
    () => filter === "all" ? assets : assets.filter((asset) => asset.category === filter),
    [assets, filter],
  );

  const saveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !serviceDraft) return;
    const slug = serviceDraft.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) { setError("Ajoutez un identifiant d’URL au service."); return; }
    setSavingService(true);
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const patch = { ...serviceDraft, slug, updated_by: sessionData.session?.user.id ?? null };
    const result = editingId
      ? await supabase.from("service_pages").update(patch).eq("id", editingId)
      : await supabase.from("service_pages").insert({ ...patch, created_by: sessionData.session?.user.id ?? null });
    if (result.error) setError(result.error.message.includes("duplicate") ? "Cet identifiant de service existe déjà." : "Le service n’a pas pu être enregistré. Vérifiez la migration et les droits Supabase.");
    else {
      setServiceDraft(null);
      setEditingId(null);
      await loadContent();
    }
    setSavingService(false);
  };

  const toggleService = async (service: ServicePage) => {
    if (!supabase) return;
    const next = service.publication_status === "published" ? "unpublished" : "published";
    const { error: updateError } = await supabase.from("service_pages").update({ publication_status: next }).eq("id", service.id);
    if (updateError) setError("Le statut public du service n’a pas pu être modifié.");
    else await loadContent();
  };

  const deleteService = async (service: ServicePage) => {
    if (!supabase || !window.confirm(`Supprimer le service « ${service.title} » et les médias qui lui sont associés ?`)) return;
    setError("");
    const linked = assets.filter((asset) => asset.service_id === service.id);
    const { error: deleteError } = await supabase.from("service_pages").delete().eq("id", service.id);
    if (deleteError) { setError("Le service n’a pas pu être supprimé."); return; }
    if (linked.length) {
      const { error: storageError } = await supabase.storage.from("site-media").remove(linked.map((asset) => asset.storage_path));
      if (storageError) setError("Le service est supprimé, mais certains fichiers sont restés dans Storage.");
    }
    await loadContent();
  };

  const updateAsset = async (asset: MediaAsset, values: Partial<MediaAsset>) => {
    if (!supabase) return;
    const { error: updateError } = await supabase.from("media_assets").update(values).eq("id", asset.id);
    if (updateError) setError("La fiche du média n’a pas pu être mise à jour.");
    else await loadContent();
  };

  const deleteAsset = async (asset: MediaAsset) => {
    if (!supabase || !window.confirm(`Supprimer définitivement « ${asset.title} » du site et du stockage ?`)) return;
    const { error: rowError } = await supabase.from("media_assets").delete().eq("id", asset.id);
    if (rowError) { setError("La fiche de ce média n’a pas pu être supprimée."); return; }
    const { error: storageError } = await supabase.storage.from("site-media").remove([asset.storage_path]);
    if (storageError) setError("La fiche est supprimée, mais le fichier est resté dans Storage.");
    await loadContent();
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/") || file.type === "video/mp4" || file.type === "video/quicktime");
    setFiles(selected);
    const firstCategory = selected[0] ? inferCategory(selected[0]) : "other";
    setUploadCategory(firstCategory);
    setUploadServiceId(services.find((service) => service.slug === (firstCategory === "cleaning" ? "cleaner" : "demenagement-amenagement"))?.id ?? "");
    setError("");
  };

  const uploadOne = (file: File, path: string, token: string, apiKey: string, endpoint: string, onProgress: (sent: number, total: number) => void) => new Promise<void>((resolve, reject) => {
    const upload = new TusUpload(file, {
      endpoint,
      retryDelays: [0, 1500, 3000, 6000, 10000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: { authorization: `Bearer ${token}`, apikey: apiKey },
      metadata: {
        bucketName: "site-media",
        objectName: path,
        contentType: file.type,
        cacheControl: "3600",
      },
      onProgress,
      onError: reject,
      onSuccess: () => resolve(),
    });
    upload.start();
  });

  const uploadSelectedFiles = async () => {
    if (!supabase || !files.length) return;
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData.session;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (sessionError || !session || !apiKey || !supabaseUrl) { setError("Session Supabase expirée. Reconnectez-vous puis recommencez l’import."); return; }
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 450 * 1024 * 1024) { setError("Sélectionnez au maximum 450 Mo par import pour respecter les limites de stockage du projet."); return; }
    const endpoint = storageEndpoint(supabaseUrl);
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length, file: "Préparation de l’import…" });
    setError("");
    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      const category = files.length === 1 ? uploadCategory : inferCategory(file) === "other" ? uploadCategory : inferCategory(file);
      const inferredService = category === "cleaning" ? "cleaner" : category === "moving" ? "demenagement-amenagement" : "";
      const serviceId = files.length === 1 ? uploadServiceId : services.find((service) => service.slug === inferredService)?.id ?? "";
      if (file.size > 50 * 1024 * 1024) { failures.push(`${file.name} dépasse la limite de 50 Mo.`); continue; }
      if (!file.type.startsWith("image/") && !["video/mp4", "video/quicktime"].includes(file.type)) { failures.push(`${file.name} n’est pas un format image ou vidéo autorisé.`); continue; }
      const assetId = crypto.randomUUID();
      const path = `${category}/${assetId}-${cleanFileName(file.name)}`;
      setUploadProgress({ current: index, total: files.length, file: file.name });
      try {
        await uploadOne(file, path, session.access_token, apiKey, endpoint, (sent) => {
          setUploadProgress({ current: index + sent / Math.max(file.size, 1), total: files.length, file: file.name });
        });
        const { error: rowError } = await supabase.from("media_assets").insert({
          id: assetId,
          service_id: serviceId || null,
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          alt_text: "",
          category,
          storage_path: path,
          source_path: file.webkitRelativePath || file.name,
          mime_type: file.type,
          file_size: file.size,
          is_published: false,
          sort_order: 0,
          uploaded_by: session.user.id,
        });
        if (rowError) {
          await supabase.storage.from("site-media").remove([path]);
          failures.push(`${file.name} : fiche non enregistrée.`);
        }
      } catch {
        failures.push(`${file.name} : téléversement interrompu.`);
      }
      setUploadProgress({ current: index + 1, total: files.length, file: file.name });
    }
    setUploading(false);
    setFiles([]);
    if (failures.length) setError(`Import terminé avec ${failures.length} fichier(s) à reprendre : ${failures.slice(0, 4).join(" ")}`);
    await loadContent();
  };

  return (
    <div className="page-content site-content-page">
      <section className="list-header">
        <div>
          <p className="eyebrow">CONTENU DU SITE PUBLIC</p>
          <h1>Services & médias</h1>
          <span>Gérez les nouvelles pages de services et classez les images et vidéos avant publication.</span>
        </div>
        {tab === "services" && <button className="btn btn-primary" onClick={() => { setEditingId(null); setServiceDraft({ ...emptyService }); }}><Plus size={17} /> Ajouter un service</button>}
      </section>

      <div className="site-content-tabs" role="tablist" aria-label="Gestion du contenu public">
        <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>Pages de services <span>{services.length}</span></button>
        <button className={tab === "media" ? "active" : ""} onClick={() => setTab("media")}>Bibliothèque médias <span>{assets.length}</span></button>
      </div>

      {error && <p className="site-content-error" role="alert">{error}</p>}
      {loading ? <div className="data-loading">Chargement des services et médias…</div> : tab === "services" ? (
        <div className="service-admin-grid">
          {serviceDraft && (
            <form className="panel service-editor" onSubmit={saveService}>
              <div className="form-heading"><h2>{editingId ? "Modifier le service" : "Créer un service"}</h2><button type="button" className="site-content-close" onClick={() => { setServiceDraft(null); setEditingId(null); }} aria-label="Fermer"><X size={18} /></button></div>
              <label><span>Nom affiché *</span><input required maxLength={180} value={serviceDraft.title} onChange={(event) => setServiceDraft({ ...serviceDraft, title: event.target.value })} /></label>
              <label><span>Identifiant d’URL *</span><input required maxLength={100} value={serviceDraft.slug} onChange={(event) => setServiceDraft({ ...serviceDraft, slug: event.target.value })} placeholder="ex. nettoyage" /></label>
              <label><span>Surtitre</span><input maxLength={180} value={serviceDraft.eyebrow} onChange={(event) => setServiceDraft({ ...serviceDraft, eyebrow: event.target.value })} /></label>
              <label><span>Résumé public</span><textarea rows={3} maxLength={500} value={serviceDraft.summary} onChange={(event) => setServiceDraft({ ...serviceDraft, summary: event.target.value })} /></label>
              <label><span>Description détaillée</span><textarea rows={5} maxLength={5000} value={serviceDraft.body} onChange={(event) => setServiceDraft({ ...serviceDraft, body: event.target.value })} /></label>
              <label><span>Prestations (une ligne par élément)</span><textarea rows={4} value={serviceDraft.features.join("\n")} onChange={(event) => setServiceDraft({ ...serviceDraft, features: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} placeholder="Exemple : Préparation et emballage des effets" /></label>
              <label><span>Ordre d’affichage</span><input type="number" value={serviceDraft.sort_order} onChange={(event) => setServiceDraft({ ...serviceDraft, sort_order: Number(event.target.value) })} /></label>
              <label className="site-content-checkbox"><input type="checkbox" checked={serviceDraft.publication_status === "published"} onChange={(event) => setServiceDraft({ ...serviceDraft, publication_status: event.target.checked ? "published" : "draft" })} /> Publier cette page sur le site</label>
              <div className="form-footer"><button type="button" className="btn btn-ghost" onClick={() => { setServiceDraft(null); setEditingId(null); }}>Annuler</button><button className="btn btn-primary" type="submit" disabled={savingService}>{savingService ? "Enregistrement…" : "Enregistrer"}</button></div>
            </form>
          )}
          <div className="service-admin-list">
            {services.map((service) => (
              <article className="panel service-admin-card" key={service.id}>
                <div><span className={`badge badge-${service.publication_status === "published" ? "success" : "neutral"}`}><span className="badge-dot" />{service.publication_status === "published" ? "Publié" : "Brouillon"}</span><h2>{service.title}</h2><p>{service.summary || "Aucun résumé renseigné."}</p><small>/{service.slug} · {assets.filter((asset) => asset.service_id === service.id).length} média(s)</small></div>
                <div className="service-admin-actions">
                  <button className="btn btn-secondary" onClick={() => { setEditingId(service.id); setServiceDraft({ ...service, features: service.features ?? [] }); }}>Modifier</button>
                  <button className="btn btn-icon" title={service.publication_status === "published" ? "Retirer du site" : "Publier"} onClick={() => { void toggleService(service); }}>{service.publication_status === "published" ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  <button className="btn btn-icon btn-delete" title="Supprimer le service" onClick={() => { void deleteService(service); }}><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
            {!services.length && <article className="panel service-admin-card">Aucun service. Ajoutez une page pour la publier ici.</article>}
          </div>
        </div>
      ) : (
        <div className="media-admin-layout">
          <section className="panel media-upload-panel">
            <div className="form-heading"><h2>Importer des photos ou vidéos</h2><p>Vous pouvez sélectionner plusieurs fichiers ou un dossier complet. Les médias restent privés jusqu’à leur publication.</p></div>
            <label className="media-drop-zone"><UploadCloud size={25} /><strong>Sélectionner un dossier complet</strong><span>Les sous-dossiers AMENAGEMENT, CONSTRUCTION et PLAN-3D sont classés automatiquement.</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" multiple {...{ webkitdirectory: "" }} onChange={handleFileSelection} /></label>
            <label className="media-file-picker"><span>Ou choisir quelques fichiers</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" multiple onChange={handleFileSelection} /></label>
            {!!files.length && <div className="media-upload-queue"><strong>{files.length} fichier(s) · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</strong><span>Le classement suit les dossiers AMENAGEMENT, CONSTRUCTION, PLAN-3D et LOGO. Vérifiez chaque fiche avant publication.</span>
              <label><span>Service associé pour les fichiers non classés</span><select value={uploadServiceId} onChange={(event) => setUploadServiceId(event.target.value)}><option value="">Aucun service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select></label>
              <label><span>Classement par défaut</span><select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value as MediaCategory)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
              <button className="btn btn-primary" disabled={uploading} onClick={() => { void uploadSelectedFiles(); }}>{uploading ? <><LoaderCircle size={17} className="spin" /> Import {Math.min(Math.floor(uploadProgress.current), uploadProgress.total)}/{uploadProgress.total}</> : <><UploadCloud size={17} /> Importer dans la bibliothèque</>}</button>
              {uploading && <div className="media-progress"><span style={{ width: `${uploadProgress.total ? Math.min(100, uploadProgress.current / uploadProgress.total * 100) : 0}%` }} /><small>{uploadProgress.file}</small></div>}
            </div>}
          </section>
          <section className="media-library-section">
            <div className="media-library-toolbar"><div><h2>Bibliothèque médias</h2><p>{assets.length} fichier(s) · seuls les médias publiés apparaissent sur le site.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value as MediaCategory | "all")}><option value="all">Tous les classements</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></div>
            <div className="media-admin-grid">
              {visibleAssets.map((asset) => {
                const url = supabase?.storage.from("site-media").getPublicUrl(asset.storage_path).data.publicUrl ?? "";
                const video = asset.mime_type.startsWith("video/");
                return <article className="panel media-admin-card" key={asset.id}>
                  <div className="media-preview">{video ? <video src={url} controls preload="metadata" /> : <img src={url} alt={asset.alt_text || asset.title} loading="lazy" />}{video && <span><Film size={14} /> Vidéo</span>}</div>
                  <div className="media-card-body">
                    <input aria-label="Titre du média" defaultValue={asset.title} onBlur={(event) => { if (event.target.value !== asset.title) void updateAsset(asset, { title: event.target.value }); }} />
                    <input aria-label="Texte alternatif" placeholder="Description pour les lecteurs d’écran" defaultValue={asset.alt_text} onBlur={(event) => { if (event.target.value !== asset.alt_text) void updateAsset(asset, { alt_text: event.target.value }); }} />
                    <textarea aria-label="Description du média" rows={2} placeholder="Légende ou description publique" defaultValue={asset.description} onBlur={(event) => { if (event.target.value !== asset.description) void updateAsset(asset, { description: event.target.value }); }} />
                    <select aria-label="Classement" value={asset.category} onChange={(event) => { void updateAsset(asset, { category: event.target.value as MediaCategory }); }}>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
                    <select aria-label="Service associé" value={asset.service_id ?? ""} onChange={(event) => { void updateAsset(asset, { service_id: event.target.value || null }); }}><option value="">Aucun service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select>
                    <label className="site-content-checkbox"><input type="checkbox" checked={asset.is_published} onChange={(event) => { void updateAsset(asset, { is_published: event.target.checked }); }} /> Visible sur le site</label>
                    <small>{formatBytes(asset.file_size)} · {serviceById.get(asset.service_id ?? "")?.title ?? "Bibliothèque"}</small>
                    {asset.source_path && <small title={asset.source_path}>{asset.source_path}</small>}
                    <button className="btn btn-ghost btn-media-delete" onClick={() => { void deleteAsset(asset); }}><Trash2 size={15} /> Supprimer fichier</button>
                  </div>
                </article>;
              })}
              {!visibleAssets.length && <div className="panel media-empty"><ImageIcon size={23} /><strong>Aucun média dans ce classement</strong><span>Importez des images et vidéos ou choisissez un autre filtre.</span></div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
