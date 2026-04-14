import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { readCachedValue, writeCachedValue } from "@/lib/client-cache";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });
const GALLERY_BASE = "/galleryImages";
const BUCKET_NAME = "Images";
const STORAGE_BASE = "https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images";
const GALLERY_CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORIES = [
  "Pier Drilling",
  "Equipment & Operations",
  "Infrastructure Projects",
  "Commercial Buildings",
  "Industrial Projects",
];

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0b2a5a] focus:outline-none focus:ring-2 focus:ring-[#0b2a5a]/20";

function StoragePicker({ onAdd, adding, addError, categories, existingFilenames }) {
  const [browserImages, setBrowserImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("public");
  const [browserLoading, setBrowserLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [justAdded, setJustAdded] = useState(new Set());

  const fetchFolder = useCallback(async ({ force = false } = {}) => {
    const cacheKey = `admin-gallery-browser:${currentFolder || "root"}`;
    if (!force) {
      const cached = readCachedValue(cacheKey, GALLERY_CACHE_TTL_MS);
      if (cached?.value) {
        setFolders(Array.isArray(cached.value.folders) ? cached.value.folders : []);
        setBrowserImages(Array.isArray(cached.value.images) ? cached.value.images : []);
        setBrowserLoading(false);
      }
    } else {
      setBrowserLoading(true);
    }

    try {
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list(currentFolder, { limit: 300, sortBy: { column: "name", order: "asc" } });

      if (files) {
        const nextFolders = files.filter((f) => f.id === null);
        const nextImages = files.filter((f) => f.id !== null && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
        setFolders(nextFolders);
        setBrowserImages(nextImages);
        writeCachedValue(cacheKey, { folders: nextFolders, images: nextImages });
      }
    } finally {
      setBrowserLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const navigateTo = (folder) => {
    setCurrentFolder(currentFolder ? `${currentFolder}/${folder}` : folder);
  };

  const navigateUp = () => {
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/") || "");
  };

  const handlePickImage = async (file) => {
    const success = await onAdd({
      filename: file.name,
      category: selectedCategory,
      title: null,
    });
    if (success) {
      setJustAdded((prev) => new Set(prev).add(file.name));
    }
  };

  const filtered = filterText
    ? browserImages.filter((f) => f.name.toLowerCase().includes(filterText.toLowerCase()))
    : browserImages;

  return (
    <div className="mb-6 rounded-xl border border-[#dbe4f0] bg-[#f8fbff] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-bold text-[#0b2a5a]">Browse Storage &mdash; click an image to add it</div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-neutral-600">Add to:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Folder nav */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-semibold text-neutral-700">Path:</span>
        <button onClick={() => setCurrentFolder("")} className="text-red-600 hover:underline">root</button>
        {currentFolder.split("/").filter(Boolean).map((part, i, arr) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-neutral-400">/</span>
            <button
              onClick={() => setCurrentFolder(arr.slice(0, i + 1).join("/"))}
              className="text-red-600 hover:underline"
            >
              {part}
            </button>
          </span>
        ))}
        {currentFolder && (
          <button
            onClick={navigateUp}
            className="ml-auto rounded-lg bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700 hover:bg-neutral-200"
          >
            &uarr; Up
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter images in this folder..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      {addError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</div>
      )}

      {/* Content */}
      {browserLoading ? (
        <div className="flex items-center justify-center py-12 text-neutral-500">
          <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {/* Folders */}
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => navigateTo(folder.name)}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white p-3 text-center hover:border-[#0b2a5a]/30 hover:bg-neutral-50"
            >
              <span className="text-2xl">📁</span>
              <span className="truncate text-[11px] font-medium text-neutral-700 w-full">{folder.name}</span>
            </button>
          ))}

          {/* Images */}
          {filtered.map((file) => {
            const imageUrl = `${STORAGE_BASE}/${currentFolder}/${file.name}`;
            const alreadyInGallery = existingFilenames.has(file.name) || justAdded.has(file.name);

            return (
              <button
                key={file.name}
                onClick={() => !alreadyInGallery && !adding && handlePickImage(file)}
                disabled={alreadyInGallery || adding}
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                  alreadyInGallery
                    ? "border-green-400 opacity-60 cursor-default"
                    : "border-transparent hover:border-[#0b2a5a] cursor-pointer"
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={file.name}
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized
                  loader={({ src }) => src}
                />
                {alreadyInGallery && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-600/30">
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Added
                    </span>
                  </div>
                )}
                {!alreadyInGallery && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <span className="rounded-full bg-[#0b2a5a] px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      + Add
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                  <span className="block truncate text-[9px] text-white">{file.name}</span>
                </div>
              </button>
            );
          })}

          {!folders.length && !filtered.length && (
            <div className="col-span-full py-8 text-center text-sm text-neutral-500">
              No images in this folder.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async ({ force = false } = {}) => {
    if (!force) {
      const cached = readCachedValue("admin-gallery-images", GALLERY_CACHE_TTL_MS);
      if (Array.isArray(cached?.value)) {
        setImages(cached.value);
        setLoading(false);
      }
    } else {
      setRefreshing(true);
      setLoading(true);
    }

    setError("");
    try {
      const res = await fetch("/api/gallery-images?all=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const nextImages = data.images || [];
      setImages(nextImages);
      writeCachedValue("admin-gallery-images", nextImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleAdd = async ({ filename, category, title }) => {
    if (adding) return;
    setAddError("");
    if (!filename) { setAddError("Filename is required"); return; }

    setAdding(true);
    try {
      const res = await fetch("/api/gallery-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, category: category || CATEGORIES[0], title: title || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      if (data.image) setImages((prev) => [...prev, data.image]);
      return true;
    } catch (err) {
      setAddError(err.message);
      return false;
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
              onClick={() => fetchImages({ force: true })}
              disabled={loading || refreshing}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
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

// Named export for embedding as a component (no auth wrapper, no layout)
export { GalleryManagement };

GalleryManagement.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(GalleryManagement);
