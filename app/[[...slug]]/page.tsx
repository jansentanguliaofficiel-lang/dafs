import { createClient } from "@supabase/supabase-js";
import App, { starterProperties, starterPublicServices, type ArchitecturalPlan, type PropertyListing, type PublicService, type ServiceMedia, type SiteSettings } from "../../src/App";

export const dynamic = "force-dynamic";

const fallbackServices = starterPublicServices;

async function loadPublishedContent(): Promise<{
  properties: PropertyListing[];
  plans: ArchitecturalPlan[];
  settings: SiteSettings;
  services: PublicService[];
  error: boolean;
}> {
  const defaultSettings: SiteSettings = {
    company_name: "DAFS Sarlu",
    legal_name: "DAFS Sarlu",
    description: "Locations, maisons et parcelles à vendre, plans architecturaux, déménagement, aménagement et nettoyage proposés par DAFS Sarlu.",
    email: "dafssarlu@gmail.com",
    phone: "",
    whatsapp: "",
    address: "Kinshasa, République démocratique du Congo",
    about_title: "À propos de DAFS Sarlu",
    about_content: "DAFS Sarlu réunit des services immobiliers et d’accompagnement de projets : locations, biens à vendre, plans architecturaux, déménagement et aménagement, ainsi que le service Cleaner pour le nettoyage de logements et d’espaces professionnels.\n\nLe site présente les biens, plans et services publiés par l’équipe. Les informations détaillées d’un bien ou d’une prestation se confirment directement auprès de DAFS Sarlu avant toute décision.\n\nVous pouvez parcourir les offres disponibles, consulter les fiches de services et transmettre une demande depuis la page Contact.\n\nDAFS Sarlu a été créée en (année de création). L’entreprise est portée par (nom ou présentation du fondateur et de l’équipe) et s’appuie sur (expérience, compétences ou partenariats à préciser).\n\nNotre mission est de (mission de l’entreprise à compléter). Notre vision pour les prochaines années est de (ambition ou vision à compléter).\n\nDAFS Sarlu intervient à Kinshasa, notamment à (communes et quartiers effectivement desservis). Pour une demande située ailleurs, l’équipe confirme au cas par cas sa capacité à intervenir.\n\nPour chaque demande, nous nous engageons à (engagements vérifiables à préciser : délais de réponse, suivi, qualité ou transparence). Les modalités, les délais et le périmètre sont confirmés avant le démarrage de toute prestation.",
    faq_content: "",
    legal_content: "Éditeur du site : DAFS Sarlu.\n\nContact : dafssarlu@gmail.com.\nAdresse indiquée : Kinshasa, R.D. Congo.\n\nLes informations d’immatriculation de l’entreprise, le responsable de publication et les coordonnées de l’hébergeur doivent être complétés par DAFS Sarlu.\n\nLes contenus concernant les biens et services sont publiés à titre informatif. Leur disponibilité, leurs caractéristiques et leurs modalités doivent être confirmées auprès de DAFS Sarlu. Toute estimation de construction communiquée après étude reste indicative et ne constitue pas un devis contractuel.",
    home_title: "DAFS Sarlu\nAu service de vos projets",
    home_intro: "Immobilier, plans architecturaux, déménagement, aménagement et nettoyage : découvrez les services DAFS Sarlu et échangez avec l’équipe autour de votre projet.",
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { properties: starterProperties, plans: [], settings: defaultSettings, services: fallbackServices, error: true };

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });

  try {
    const [propertyResult, planResult, settingsResult, serviceResult, mediaResult] = await Promise.all([
      client
        .from("properties")
        .select(
          "id, reference, title, description, short_description, address, operation_type, city, municipality, neighborhood, land_area_m2, living_area_m2, bedrooms, bathrooms, price_amount, currency, pricing_period, is_negotiable, property_images(storage_path, alt_text, caption, is_primary, sort_order), property_categories(name)",
        )
        .eq("publication_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false }),
      client
        .from("architectural_plans")
        .select("id, reference, title, description, category, built_area_m2, bedrooms, floors, preview_storage_path")
        .eq("publication_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false }),
      client
        .from("site_settings")
        .select("settings")
        .eq("id", "global")
        .maybeSingle(),
      client
        .from("service_pages")
        .select("id, slug, title, eyebrow, summary, body, features")
        .eq("publication_status", "published")
        .order("sort_order")
        .order("title"),
      client
        .from("media_assets")
        .select("id, service_id, title, description, alt_text, mime_type, storage_path")
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at"),
    ]);

    if (propertyResult.error || planResult.error || settingsResult.error) {
      return { properties: starterProperties, plans: [], settings: defaultSettings, services: fallbackServices, error: true };
    }

    const properties = (propertyResult.data ?? []).map((row: any) => {
      const gallery = [...(row.property_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      );
      const images = gallery.map((image: any) => ({
        src: String(image.storage_path).startsWith("local:")
          ? String(image.storage_path).slice("local:".length)
          : client.storage.from("property-images").getPublicUrl(image.storage_path).data.publicUrl,
        alt: image.alt_text ?? row.title,
        caption: image.caption ?? "",
        mimeType: String(image.storage_path).toLowerCase().endsWith(".mp4") ? "video/mp4" : "image/jpeg",
      }));
      const image = images[0]?.src ?? "";
      const operation =
        row.operation_type === "short_rental"
          ? "Courte durée"
          : row.operation_type === "long_rental"
            ? "Longue durée"
            : "Vente";
      const categoryRelation = row.property_categories;
      const category = Array.isArray(categoryRelation)
        ? categoryRelation[0]?.name
        : categoryRelation?.name;
      const type = [category, operation].filter(Boolean).join(" · ");
      const areas = [
        row.living_area_m2 && `${row.living_area_m2} m²`,
        row.land_area_m2 && `Terrain ${row.land_area_m2} m²`,
      ].filter(Boolean);
      const rooms = [
        row.bedrooms && `${row.bedrooms} chambres`,
        row.bathrooms && `${row.bathrooms} salles d’eau`,
      ].filter(Boolean);
      const amount =
        row.price_amount && row.currency
          ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency }).format(
              row.price_amount,
            )
          : "Prix sur demande";
      const period =
        row.pricing_period === "night" ? " / nuit" : row.pricing_period === "month" ? " / mois" : "";

      return {
        id: row.id,
        reference: row.reference,
        name: row.title,
        city: [row.city, row.municipality, row.neighborhood].filter(Boolean).join(", "),
        type,
        meta: [...areas, ...rooms].join(" · ") || "Détails disponibles sur demande",
        price: `${amount}${period}${row.is_negotiable ? " · à discuter" : ""}`,
        priceAmount: row.price_amount,
        isNegotiable: row.is_negotiable,
        currency: row.currency,
        pricingPeriod: row.pricing_period,
        image,
        description: row.description || row.short_description || "",
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        livingArea: row.living_area_m2,
        landArea: row.land_area_m2,
        address: row.address ?? "",
        images,
      };
    });
    const plans = (planResult.data ?? []).map((row) => ({
      id: row.id,
      reference: row.reference,
      name: row.title,
      description: row.description ?? "",
      category: row.category ?? "",
      meta: [
        row.built_area_m2 && `${row.built_area_m2} m²`,
        row.bedrooms && `${row.bedrooms} chambres`,
        row.floors && (row.floors === 1 ? "Plain-pied" : `R+${row.floors - 1}`),
      ]
        .filter(Boolean)
        .join(" · "),
      image: row.preview_storage_path
        ? client.storage.from("architectural-previews").getPublicUrl(row.preview_storage_path).data
            .publicUrl
        : "",
    }));

    const values = (settingsResult.data?.settings ?? {}) as Record<string, unknown>;
    const removedNumber = ["243", "838", "755", "731"].join("");
    const storedPhone = typeof values.phone === "string" ? values.phone : "";
    const storedWhatsapp = typeof values.whatsapp === "string" ? values.whatsapp : "";
    const storedAboutTitle = typeof values.about_title === "string" ? values.about_title : "";
    const legalContent = typeof values.legal_content === "string" ? values.legal_content : "";
    const settings: SiteSettings = {
      company_name: typeof values.company_name === "string" ? values.company_name : defaultSettings.company_name,
      legal_name: typeof values.legal_name === "string" && values.legal_name ? values.legal_name : defaultSettings.legal_name,
      description: typeof values.description === "string" && values.description ? values.description : defaultSettings.description,
      email: typeof values.email === "string" && values.email ? values.email : defaultSettings.email,
      phone: storedPhone.replace(/\D/g, "").includes(removedNumber) ? "" : storedPhone,
      whatsapp: storedWhatsapp.replace(/\D/g, "").includes(removedNumber) ? "" : storedWhatsapp,
      address: typeof values.address === "string" && values.address ? values.address : defaultSettings.address,
      about_title: storedAboutTitle === "DAFS Sarlu | Immobilier et architecture" ? defaultSettings.about_title : storedAboutTitle || defaultSettings.about_title,
      about_content: typeof values.about_content === "string" && values.about_content ? values.about_content : defaultSettings.about_content,
      faq_content: typeof values.faq_content === "string" ? values.faq_content : "",
      legal_content: (legalContent || defaultSettings.legal_content).replace(/https?:\/\/wa\.me\/\d+/gi, "").replace(/\+?243\s*838\s*755\s*731/g, "").trim(),
      home_title: typeof values.home_title === "string" && values.home_title ? values.home_title : defaultSettings.home_title,
      home_intro: typeof values.home_intro === "string" && values.home_intro ? values.home_intro : defaultSettings.home_intro,
    };
    const mediaByService = new Map<string, ServiceMedia[]>();
    if (!mediaResult.error) {
      for (const asset of mediaResult.data ?? []) {
        if (!asset.service_id) continue;
        const items = mediaByService.get(asset.service_id) ?? [];
        items.push({
          id: asset.id,
          title: asset.title,
          description: asset.description ?? "",
          alt: asset.alt_text ?? "",
          mimeType: asset.mime_type,
          url: client.storage.from("site-media").getPublicUrl(asset.storage_path).data.publicUrl,
        });
        mediaByService.set(asset.service_id, items);
      }
    }
    const services: PublicService[] = serviceResult.error || !serviceResult.data?.length ? fallbackServices : serviceResult.data.map((service) => ({
      id: service.id,
      slug: service.slug,
      title: service.title,
      eyebrow: service.eyebrow ?? "",
      summary: service.summary ?? "",
      body: service.body?.trim() || fallbackServices.find((fallback) => fallback.slug === service.slug)?.body || "",
      features: Array.isArray(service.features) && service.features.length
        ? service.features.filter((item): item is string => typeof item === "string")
        : fallbackServices.find((fallback) => fallback.slug === service.slug)?.features ?? [],
      media: mediaByService.get(service.id) ?? [],
    }));
    return { properties, plans, settings, services, error: false };
  } catch {
    return { properties: starterProperties, plans: [], settings: defaultSettings, services: fallbackServices, error: true };
  }
}

export default async function SitePage() {
  const { properties, plans, settings, services, error } = await loadPublishedContent();
  return <App initialProperties={properties} initialPlans={plans} initialSettings={settings} initialServices={services} initialDataError={error} />;
}
