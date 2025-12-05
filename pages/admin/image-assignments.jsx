"use client";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";
import { pageImages } from "@/config/imageConfig";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const IMAGE_BASE_URL = "https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images";
const BUCKET_NAME = "Images";

// Define all image slots that can be assigned
const IMAGE_SLOTS = {
  homepage: {
    label: "Homepage",
    slots: {
      hero: { label: "Hero Background", description: "Main hero section background" },
      infoBlock1: { label: "Info Block 1", description: "First info section image" },
      infoBlock2: { label: "Info Block 2", description: "Second info section image" },
      infoBlock3: { label: "Info Block 3", description: "Third info section image" },
      pierDrillingCard: { label: "Pier Drilling Card", description: "Service card image" },
      limitedAccessCard: { label: "Limited Access Card", description: "Service card image" },
      turnKeyCard: { label: "Turn-Key Card", description: "Service card image" },
      craneCard: { label: "Crane Card", description: "Service card image" },
      helicalPilesCard: { label: "Helical Piles Card", description: "Service card image" },
      safetyCard: { label: "Safety Card", description: "Service card image" },
      contactCTA: { label: "Contact CTA", description: "Call-to-action section background" },
    },
  },
  hero: {
    label: "Hero Banners",
    slots: {
      main: { label: "Main Hero", description: "Primary homepage hero" },
      service: { label: "Services Hero", description: "Services page hero" },
      about: { label: "About Hero", description: "About page hero" },
      contact: { label: "Contact Hero", description: "Contact page hero" },
      careers: { label: "Careers Hero", description: "Careers page hero" },
      pierDrilling: { label: "Pier Drilling Hero", description: "Pier drilling page hero" },
      safety: { label: "Safety Hero", description: "Safety page hero" },
      coreValues: { label: "Core Values Hero", description: "Core values page hero" },
    },
  },
  services: {
    label: "Service Pages",
    slots: {
      servicesHero: { label: "Services Page Hero", description: "Main services page hero" },
      pierDrillingHero: { label: "Pier Drilling Hero", description: "Pier drilling page hero" },
      pierDrillingContent: { label: "Pier Drilling Content", description: "Pier drilling content image" },
      limitedAccessHero: { label: "Limited Access Hero", description: "Limited access page hero" },
      limitedAccessContent: { label: "Limited Access Content", description: "Limited access content image" },
      craneHero: { label: "Crane Hero", description: "Crane services page hero" },
      craneContent: { label: "Crane Content", description: "Crane services content image" },
      helicalPilesHero: { label: "Helical Piles Hero", description: "Helical piles page hero" },
      helicalPilesContent: { label: "Helical Piles Content", description: "Helical piles content image" },
      turnKeyHero: { label: "Turn-Key Hero", description: "Turn-key page hero" },
      turnKeyContent: { label: "Turn-Key Content", description: "Turn-key content image" },
      safetyContent: { label: "Safety Content", description: "Safety page content image" },
      contactCTA: { label: "Services Contact CTA", description: "Services page CTA background" },
    },
  },
};

function ImageSlotCard({ page, slotKey, slotInfo, currentUrl, onSelect, isLoading }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className={`${lato.className} font-bold text-neutral-800`}>{slotInfo.label}</h4>
          <p className="text-xs text-neutral-500 mt-0.5">{slotInfo.description}</p>
        </div>
        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded font-mono">
          {page}.{slotKey}
        </span>
      </div>

      <div
        className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100 cursor-pointer group"
        onClick={() => onSelect(page, slotKey, currentUrl)}
      >
        {currentUrl && !imageError ? (
          <>
            <Image
              src={currentUrl}
              alt={slotInfo.label}
              fill
              className="object-cover"
              sizes="300px"
              unoptimized
              loader={({ src }) => src}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Change Image
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <div className="text-3xl mb-1">🖼️</div>
              <span className="text-xs">{imageError ? "Image not found" : "No image set"}</span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-neutral-500 truncate" title={currentUrl}>
        {currentUrl ? currentUrl.split('/').pop() : "Not assigned"}
      </div>
    </div>
  );
}

function ImagePickerModal({ isOpen, onClose, onSelect, currentUrl, slotLabel }) {
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("public");
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(currentFolder, { limit: 200, sortBy: { column: "name", order: "asc" } });

      if (error) {
        console.error("Error fetching images:", error);
        return;
      }

      const folderItems = files?.filter((f) => f.id === null) || [];
      const fileItems = files?.filter((f) => f.id !== null && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)) || [];

      setFolders(folderItems);
      setImages(fileItems);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  // Global search across all folders
  const globalSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setIsGlobalSearch(false);
      setGlobalSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setIsGlobalSearch(true);

    try {
      const allImages = [];
      const foldersToSearch = ["public", "public/newimages", "public/gallery", "public/services", "public/heroes", "public/about", "public/careers"];

      for (const folder of foldersToSearch) {
        try {
          const { data: files } = await supabase.storage
            .from(BUCKET_NAME)
            .list(folder, { limit: 500, sortBy: { column: "name", order: "asc" } });

          if (files) {
            const imageFiles = files.filter(
              (f) => f.id !== null && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)
            );
            imageFiles.forEach((file) => {
              allImages.push({
                ...file,
                folder,
                fullPath: `${folder}/${file.name}`,
              });
            });
          }
        } catch (e) {
          // Folder might not exist, continue
        }
      }

      // Also check root of public folder subfolders dynamically
      const { data: publicFolders } = await supabase.storage
        .from(BUCKET_NAME)
        .list("public", { limit: 100 });

      if (publicFolders) {
        const subfolders = publicFolders.filter((f) => f.id === null);
        for (const subfolder of subfolders) {
          const subPath = `public/${subfolder.name}`;
          if (!foldersToSearch.includes(subPath)) {
            try {
              const { data: subFiles } = await supabase.storage
                .from(BUCKET_NAME)
                .list(subPath, { limit: 500 });

              if (subFiles) {
                const imageFiles = subFiles.filter(
                  (f) => f.id !== null && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)
                );
                imageFiles.forEach((file) => {
                  allImages.push({
                    ...file,
                    folder: subPath,
                    fullPath: `${subPath}/${file.name}`,
                  });
                });
              }
            } catch (e) {
              // Continue on error
            }
          }
        }
      }

      // Filter by search term
      const filtered = allImages.filter((img) =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setGlobalSearchResults(filtered);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  // Debounced global search
  useEffect(() => {
    if (filterText.length >= 2) {
      const timer = setTimeout(() => {
        globalSearch(filterText);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsGlobalSearch(false);
      setGlobalSearchResults([]);
    }
  }, [filterText, globalSearch]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredImages = filterText
    ? images.filter((img) => img.name.toLowerCase().includes(filterText.toLowerCase()))
    : images;

  const handleSelectImage = (file) => {
    const fullPath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
    const imageUrl = `${IMAGE_BASE_URL}/${fullPath}`;
    onSelect(imageUrl);
  };

  const navigateToFolder = (folderName) => {
    setCurrentFolder(currentFolder ? `${currentFolder}/${folderName}` : folderName);
  };

  const navigateUp = () => {
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/") || "");
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h3 className={`${lato.className} text-xl font-bold text-neutral-800`}>
              Select Image for: {slotLabel}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">Browse your Supabase storage</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-neutral-200 space-y-3">
          {/* Folder navigation */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-neutral-700">Path:</span>
            <button
              onClick={() => setCurrentFolder("")}
              className="text-red-600 hover:underline"
            >
              root
            </button>
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
                ↑ Up
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search images across ALL folders (min 2 chars)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm pr-20"
            />
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-neutral-200 px-2 py-1 rounded hover:bg-neutral-300"
              >
                Clear
              </button>
            )}
          </div>
          {isGlobalSearch && (
            <p className="text-xs text-blue-600">
              🔍 Searching all folders... {searchLoading ? "loading..." : `${globalSearchResults.length} results found`}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Global search results */}
          {isGlobalSearch ? (
            searchLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : globalSearchResults.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <p>No images found matching "{filterText}"</p>
                <p className="text-xs mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {globalSearchResults.map((file) => {
                  const imageUrl = `${IMAGE_BASE_URL}/${file.fullPath}`;
                  const isSelected = currentUrl === imageUrl;

                  return (
                    <button
                      key={file.fullPath}
                      onClick={() => onSelect(imageUrl)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="150px"
                        unoptimized
                        loader={({ src }) => src}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                            Current
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-white text-xs truncate">{file.name}</p>
                        <p className="text-white/60 text-[10px] truncate">{file.folder}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {folders.map((folder) => (
                    <button
                      key={folder.name}
                      onClick={() => navigateToFolder(folder.name)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      📁 {folder.name}
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
                  <p>No images found in this folder</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredImages.map((file) => {
                    const fullPath = currentFolder ? `${currentFolder}/${file.name}` : file.name;
                    const imageUrl = `${IMAGE_BASE_URL}/${fullPath}`;
                    const isSelected = currentUrl === imageUrl;

                    return (
                      <button
                        key={file.name}
                        onClick={() => handleSelectImage(file)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-transparent hover:border-neutral-300"
                        }`}
                      >
                        <Image
                          src={imageUrl}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="150px"
                          unoptimized
                          loader={({ src }) => src}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                              Current
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                          <p className="text-white text-xs truncate">{file.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageAssignmentsPage() {
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ homepage: true, hero: true, services: true });

  // Load saved assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch("/api/image-assignments");
        const data = await res.json();
        setAssignments(data.assignments || {});
      } catch (err) {
        console.error("Failed to load assignments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const getCurrentUrl = (page, slotKey) => {
    // First check saved assignments, then fall back to default config
    const assignmentKey = `${page}.${slotKey}`;
    if (assignments[assignmentKey]) {
      return assignments[assignmentKey];
    }
    // Fall back to pageImages config
    return pageImages[page]?.[slotKey] || "";
  };

  const handleOpenPicker = (page, slotKey, currentUrl) => {
    setSelectedSlot({ page, slotKey, currentUrl, label: IMAGE_SLOTS[page].slots[slotKey].label });
    setPickerOpen(true);
  };

  const handleSelectImage = async (imageUrl) => {
    if (!selectedSlot) return;

    const { page, slotKey } = selectedSlot;
    const key = `${page}.${slotKey}`;

    setSaving((prev) => ({ ...prev, [key]: true }));
    setPickerOpen(false);

    try {
      await fetch("/api/image-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, slot: slotKey, image_url: imageUrl }),
      });

      setAssignments((prev) => ({ ...prev, [key]: imageUrl }));
    } catch (err) {
      console.error("Failed to save assignment:", err);
      alert("Failed to save. Make sure the image_assignments table exists in Supabase.");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Image Assignments | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Image Assignments
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Click any image to assign a different one from your Supabase storage
            </p>
          </div>
          <Link
            href="/admin/images"
            className="inline-flex items-center rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            📁 Browse All Images
          </Link>
        </div>

        {/* Info box about Supabase table */}
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Assignments are saved to Supabase. Make sure you have an{" "}
            <code className="bg-blue-100 px-1 rounded">image_assignments</code> table with columns:{" "}
            <code className="bg-blue-100 px-1 rounded">page</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">slot</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">image_url</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">updated_at</code>
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {Object.entries(IMAGE_SLOTS).map(([pageKey, pageData]) => (
            <section key={pageKey} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(pageKey)}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h2 className={`${lato.className} text-xl font-bold text-[#0b2a5a]`}>
                  {pageData.label}
                </h2>
                <span className="text-2xl text-neutral-400">
                  {expandedSections[pageKey] ? "−" : "+"}
                </span>
              </button>

              {expandedSections[pageKey] && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(pageData.slots).map(([slotKey, slotInfo]) => (
                    <ImageSlotCard
                      key={slotKey}
                      page={pageKey}
                      slotKey={slotKey}
                      slotInfo={slotInfo}
                      currentUrl={getCurrentUrl(pageKey, slotKey)}
                      onSelect={handleOpenPicker}
                      isLoading={saving[`${pageKey}.${slotKey}`]}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Image picker modal */}
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectImage}
        currentUrl={selectedSlot?.currentUrl}
        slotLabel={selectedSlot?.label || ""}
      />
    </>
  );
}

ImageAssignmentsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ImageAssignmentsPage);
