import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });
const GALLERY_BASE = "/galleryImages";
const BUCKET_NAME = "Images";
const STORAGE_BASE = "https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images";

const CATEGORIES = [
  "Pier Drilling",
  "Equipment & Operations",
  "Infrastructure Projects",
  "Commercial Buildings",
  "Industrial Projects",
];

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20";

function GalleryManagement() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ filename: "", category: CATEGORIES[0], title: "", description: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Inline status messages
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gallery-images?all=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setImages(data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (img) => {
    const newVal = !img.is_visible;
    setStatusMap((prev) => ({ ...prev, [img.id]: "Saving..." }));
    try {
      const res = await fetch("/api/gallery-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id, is_visible: newVal }),
      });
      if (!res.ok) throw new Error("Failed");
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, is_visible: newVal } : i))
      );
      setStatusMap((prev) => ({ ...prev, [img.id]: newVal ? "Visible" : "Hidden" }));
    } catch {
      setStatusMap((prev) => ({ ...prev, [img.id]: "Error" }));
    }
    setTimeout(() => setStatusMap((prev) => ({ ...prev, [img.id]: "" })), 1500);
  };

  const deleteImage = async (img) => {
    if (!confirm(`Permanently remove ${img.filename}?`)) return;
    try {
      const res = await fetch("/api/gallery-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id }),
      });
      if (!res.ok) throw new Error("Failed");
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch {
      alert("Failed to delete image");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (adding) return;
    setAddError("");
    if (!addForm.filename.trim()) { setAddError("Filename is required"); return; }

    setAdding(true);
    try {
      const res = await fetch("/api/gallery-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setImages((prev) => [...prev, data.image]);
      setAddForm({ filename: "", category: CATEGORIES[0], title: "", description: "" });
      setShowAdd(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Filter
  const filtered = images.filter((img) => {
    if (filterCategory !== "all" && img.category !== filterCategory) return false;
    if (filterVisibility === "visible" && !img.is_visible) return false;
    if (filterVisibility === "hidden" && img.is_visible) return false;
    return true;
  });

  const visibleCount = images.filter((i) => i.is_visible).length;
  const hiddenCount = images.length - visibleCount;

  return (
    <>
      <Head>
        <title>Gallery Images | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Gallery Images
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {visibleCount} visible, {hiddenCount} hidden &mdash; toggle visibility or add new images
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchImages}
              disabled={loading}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => { setShowAdd(!showAdd); setAddError(""); }}
              className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75]"
            >
              {showAdd ? "Cancel" : "+ Add Image"}
            </button>
          </div>
        </div>

        {/* Add from storage browser */}
        {showAdd && (
          <StoragePicker
            onAdd={handleAdd}
            adding={adding}
            addError={addError}
            categories={CATEGORIES}
            existingFilenames={new Set(images.map((i) => i.filename))}
          />
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All ({images.length})</option>
            <option value="visible">Visible ({visibleCount})</option>
            <option value="hidden">Hidden ({hiddenCount})</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Image grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading gallery...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((img) => (
              <div
                key={img.id}
                className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
                  img.is_visible
                    ? "border-neutral-200"
                    : "border-red-300 opacity-60"
                }`}
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                  <Image
                    src={`${GALLERY_BASE}/${img.filename}`}
                    alt={img.title || img.filename}
                    width={300}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                    loader={({ src }) => src}
                  />
                </div>

                {/* Hidden badge */}
                {!img.is_visible && (
                  <div className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    HIDDEN
                  </div>
                )}

                {/* Info + actions */}
                <div className="px-3 py-2.5">
                  <div className="truncate text-xs font-semibold text-neutral-800">
                    {img.filename}
                  </div>
                  <div className="truncate text-[11px] text-neutral-500">
                    {img.category}
                  </div>

                  {/* Status message */}
                  {statusMap[img.id] && (
                    <div className="mt-1 text-[11px] font-medium text-blue-600">{statusMap[img.id]}</div>
                  )}

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleVisibility(img)}
                      className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                        img.is_visible
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {img.is_visible ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => deleteImage(img)}
                      className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-red-600"
                      title="Permanently remove"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full py-12 text-center text-neutral-500">
                No images match the current filters.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

GalleryManagement.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(GalleryManagement);
