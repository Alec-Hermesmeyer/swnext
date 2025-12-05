"use client";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const BUCKET_NAME = "Images";
const IMAGE_BASE_URL = "https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images";

// Image assignment categories for the site
const IMAGE_CATEGORIES = {
  gallery: { label: "Gallery", description: "Project gallery images" },
  hero: { label: "Hero Banners", description: "Page hero/banner images" },
  services: { label: "Services", description: "Service page images" },
  homepage: { label: "Homepage", description: "Homepage specific images" },
  general: { label: "General", description: "Misc/uncategorized images" },
};

function ImageCard({ file, folder, onSelect, isSelected, onDelete, onPreview }) {
  const fullPath = folder ? `${folder}/${file.name}` : file.name;
  const imageUrl = `${IMAGE_BASE_URL}/${fullPath}`;

  return (
    <div
      className={`relative group rounded-xl border-2 overflow-hidden bg-white shadow-sm transition-all ${
        isSelected ? "border-red-500 ring-2 ring-red-200" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div
        className="aspect-square relative cursor-pointer"
        onClick={() => onPreview(imageUrl, file.name)}
      >
        <Image
          src={imageUrl}
          alt={file.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
          unoptimized
          loader={({ src }) => src}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      <div className="p-3">
        <p className="text-xs font-medium text-neutral-700 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {folder || "root"}
        </p>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(fullPath);
          }}
          className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
            isSelected
              ? "bg-red-600 text-white"
              : "bg-white/90 text-neutral-700 hover:bg-red-100"
          }`}
          title={isSelected ? "Selected" : "Select"}
        >
          {isSelected ? "✓" : "+"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(fullPath);
          }}
          className="p-1.5 rounded-md bg-white/90 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ImagePreviewModal({ imageUrl, imageName, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold"
      >
        ×
      </button>
      <div className="max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative max-h-[80vh] w-auto">
          <Image
            src={imageUrl}
            alt={imageName}
            width={1200}
            height={800}
            className="max-h-[75vh] w-auto object-contain rounded-lg"
            unoptimized
            loader={({ src }) => src}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-white font-medium">{imageName}</p>
          <p className="text-white/60 text-sm mt-1 break-all">{imageUrl}</p>
          <button
            onClick={() => navigator.clipboard.writeText(imageUrl)}
            className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            Copy URL
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentPanel({ selectedImages, onAssign, onClear }) {
  const [category, setCategory] = useState("gallery");
  const [slot, setSlot] = useState("");

  const handleAssign = () => {
    if (selectedImages.length === 0) return;
    onAssign(category, slot, selectedImages);
    setSlot("");
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-3`}>
        Assign Selected ({selectedImages.length})
      </h3>

      {selectedImages.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 mb-4 max-h-20 overflow-y-auto">
            {selectedImages.map((path) => (
              <span
                key={path}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md"
              >
                {path.split("/").pop()}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {Object.entries(IMAGE_CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Slot Name (optional)
              </label>
              <input
                type="text"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="e.g., hero, card1, background"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Save Assignment
              </button>
              <button
                onClick={onClear}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-neutral-500 text-sm">Select images to assign them to page locations.</p>
      )}
    </div>
  );
}

function UploadPanel({ onUploadComplete, currentFolder }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of files) {
        const filePath = currentFolder ? `${currentFolder}/${file.name}` : `public/${file.name}`;
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error("Upload error:", error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
      onUploadComplete();
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? "border-red-500 bg-red-50" : "border-neutral-300 bg-neutral-50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-neutral-600 font-medium">Uploading...</span>
        </div>
      ) : (
        <>
          <p className="text-neutral-600 mb-2">Drag and drop images here, or</p>
          <label className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white cursor-pointer hover:bg-red-700 transition-colors">
            Browse Files
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
          <p className="text-xs text-neutral-500 mt-2">
            Upload to: {currentFolder || "public"}/
          </p>
        </>
      )}
    </div>
  );
}

function ImageManager() {
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("public");
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [filterText, setFilterText] = useState("");

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      // List files in current folder
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(currentFolder, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.error("Error fetching images:", error);
        return;
      }

      // Separate folders and files
      const folderItems = files?.filter((f) => f.id === null) || [];
      const fileItems = files?.filter((f) => f.id !== null && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)) || [];

      setFolders(folderItems);
      setImages(fileItems);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Load saved assignments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sw-image-assignments");
    if (saved) {
      try {
        setAssignments(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load assignments:", e);
      }
    }
  }, []);

  const handleSelect = (path) => {
    setSelectedImages((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleDelete = async (path) => {
    if (!confirm(`Delete ${path}?`)) return;
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      fetchImages();
      setSelectedImages((prev) => prev.filter((p) => p !== path));
    }
  };

  const handleAssign = (category, slot, paths) => {
    const key = slot ? `${category}.${slot}` : category;
    const newAssignments = { ...assignments, [key]: paths };
    setAssignments(newAssignments);
    localStorage.setItem("sw-image-assignments", JSON.stringify(newAssignments));
    alert(`Assigned ${paths.length} image(s) to ${key}`);
    setSelectedImages([]);
  };

  const handlePreview = (url, name) => {
    setPreviewImage({ url, name });
  };

  const navigateToFolder = (folderName) => {
    setCurrentFolder(currentFolder ? `${currentFolder}/${folderName}` : folderName);
    setSelectedImages([]);
  };

  const navigateUp = () => {
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/") || "");
    setSelectedImages([]);
  };

  const filteredImages = filterText
    ? images.filter((img) => img.name.toLowerCase().includes(filterText.toLowerCase()))
    : images;

  return (
    <>
      <Head>
        <title>Image Manager | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Image Manager
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Manage images in your Supabase storage bucket
            </p>
          </div>
          <Link
            href="/admin/image-assignments"
            className="inline-flex items-center rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            ← Back to Assignments
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upload panel */}
            <UploadPanel onUploadComplete={fetchImages} currentFolder={currentFolder} />

            {/* Navigation & filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-neutral-700">Path:</span>
                <button
                  onClick={() => { setCurrentFolder(""); setSelectedImages([]); }}
                  className="text-red-600 hover:underline"
                >
                  root
                </button>
                {currentFolder.split("/").filter(Boolean).map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-neutral-400">/</span>
                    <button
                      onClick={() => {
                        setCurrentFolder(arr.slice(0, i + 1).join("/"));
                        setSelectedImages([]);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>

              {currentFolder && (
                <button
                  onClick={navigateUp}
                  className="ml-auto rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-200"
                >
                  ↑ Up
                </button>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Filter images by name..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
            />

            {/* Folders */}
            {folders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {folders.map((folder) => (
                  <button
                    key={folder.name}
                    onClick={() => navigateToFolder(folder.name)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span>📁</span>
                    {folder.name}
                  </button>
                ))}
              </div>
            )}

            {/* Images grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <p className="text-lg font-medium">No images found</p>
                <p className="text-sm mt-1">Upload some images or navigate to a different folder</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredImages.map((file) => (
                  <ImageCard
                    key={file.name}
                    file={file}
                    folder={currentFolder}
                    onSelect={handleSelect}
                    isSelected={selectedImages.includes(
                      currentFolder ? `${currentFolder}/${file.name}` : file.name
                    )}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <AssignmentPanel
              selectedImages={selectedImages}
              onAssign={handleAssign}
              onClear={() => setSelectedImages([])}
            />

            {/* Current assignments */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-3`}>
                Saved Assignments
              </h3>
              {Object.keys(assignments).length === 0 ? (
                <p className="text-neutral-500 text-sm">No assignments yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(assignments).map(([key, paths]) => (
                    <div key={key} className="text-xs">
                      <span className="font-semibold text-neutral-700">{key}:</span>
                      <span className="text-neutral-500 ml-1">{paths.length} image(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick info */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className={`${lato.className} text-lg font-bold text-neutral-800 mb-3`}>
                Quick Guide
              </h3>
              <ul className="text-xs text-neutral-600 space-y-2">
                <li>• Click an image to preview full size</li>
                <li>• Use + button to select multiple images</li>
                <li>• Assign selected images to page categories</li>
                <li>• Drag & drop to upload new images</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          imageName={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}

function ImageManagerPage() {
  return <ImageManager />;
}

ImageManagerPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ImageManagerPage);
