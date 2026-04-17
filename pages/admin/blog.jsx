"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { readCachedValue, writeCachedValue } from "@/lib/client-cache";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const todayDate = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  imageId: "",
  imageAlt: "",
  date: todayDate(),
  status: "draft",
  content: "",
};
const BLOG_POSTS_CACHE_KEY = "admin-blog-posts";
const BLOG_IMAGES_CACHE_KEY = "admin-blog-images";
const BLOG_CACHE_TTL_MS = 5 * 60 * 1000;

function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [blogImages, setBlogImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [renamingPath, setRenamingPath] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [deletePath, setDeletePath] = useState("");
  const [altGeneratingPath, setAltGeneratingPath] = useState("");
  const [selectedBlogImage, setSelectedBlogImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [socialSuggestions, setSocialSuggestions] = useState([]);
  const [suggestionSource, setSuggestionSource] = useState("");
  const [queueingSuggestionIndex, setQueueingSuggestionIndex] = useState(null);
  const [copiedSuggestionIndex, setCopiedSuggestionIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const fileInputRef = useRef(null);
  const [generator, setGenerator] = useState({
    keyword: "",
    city: "Dallas-Fort Worth",
    tone: "Practical, trustworthy, expert",
    notes: "",
  });

  const generatedSlug = useMemo(() => toSlug(form.slug || form.title), [form.slug, form.title]);

  const fetchPosts = async ({ force = false } = {}) => {
    if (!force) {
      const cached = readCachedValue(BLOG_POSTS_CACHE_KEY, BLOG_CACHE_TTL_MS);
      if (Array.isArray(cached?.value)) {
        setPosts(cached.value);
        setLoading(false);
      }
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/admin-blog-posts");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load blog posts.");
      const nextPosts = Array.isArray(data.posts) ? data.posts : [];
      setPosts(nextPosts);
      writeCachedValue(BLOG_POSTS_CACHE_KEY, nextPosts);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not load blog posts.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogImages = async ({ force = false } = {}) => {
    if (!force) {
      const cached = readCachedValue(BLOG_IMAGES_CACHE_KEY, BLOG_CACHE_TTL_MS);
      if (Array.isArray(cached?.value)) {
        setBlogImages(cached.value);
        setImagesLoading(false);
      }
    } else {
      setImagesLoading(true);
    }

    try {
      const response = await fetch("/api/admin-blog-images");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load blog images.");
      const nextImages = Array.isArray(data.images) ? data.images : [];
      setBlogImages(nextImages);
      writeCachedValue(BLOG_IMAGES_CACHE_KEY, nextImages);
      if (selectedBlogImage?.path) {
        const refreshedSelection = nextImages.find((img) => img.path === selectedBlogImage.path) || null;
        setSelectedBlogImage(refreshedSelection);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not load blog images.",
      });
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchBlogImages();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setForm({ ...EMPTY_FORM, date: todayDate() });
  };

  const updateGeneratorField = (key, value) => {
    setGenerator((prev) => ({ ...prev, [key]: value }));
  };

  const generateDraft = async () => {
    if (generating) return;
    setGenerating(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin-blog-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          keyword: generator.keyword,
          city: generator.city,
          tone: generator.tone,
          notes: generator.notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate draft.");
      const draft = data?.draft || {};
      const returnedSuggestions = Array.isArray(data?.social_posts)
        ? data.social_posts
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        : [];

      setForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        excerpt: draft.excerpt || prev.excerpt,
        imageId: draft.imageId || prev.imageId,
        content: draft.content || prev.content,
        status: "draft",
      }));
      setSocialSuggestions(returnedSuggestions);
      setSuggestionSource(String(data?.source || ""));
      setStatus({
        type: "success",
        message: returnedSuggestions.length
          ? `AI draft generated with ${returnedSuggestions.length} social suggestion${returnedSuggestions.length === 1 ? "" : "s"}.`
          : "AI draft generated. Review, edit, then publish when ready.",
      });
    } catch (error) {
      setSocialSuggestions([]);
      setSuggestionSource("");
      setStatus({
        type: "error",
        message: error.message || "Could not generate draft.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copySuggestionToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestionIndex(index);
      setTimeout(() => setCopiedSuggestionIndex(null), 1500);
    } catch {
      setStatus({ type: "error", message: "Could not copy suggestion to clipboard." });
    }
  };

  const queueSuggestion = async (suggestion, index) => {
    if (!suggestion || queueingSuggestionIndex !== null) return;
    setQueueingSuggestionIndex(index);
    try {
      const response = await fetch("/api/social/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: "company_update",
          context: `${suggestion}\n\nRelated blog post title: ${form.title || "Untitled Blog Draft"}`,
          objective: "Promote related website blog content",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not queue social suggestion.");
      setStatus({
        type: "success",
        message: "Social suggestion added to the Social Media queue as a pending draft.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not queue social suggestion.",
      });
    } finally {
      setQueueingSuggestionIndex(null);
    }
  };

  const uploadBlogImage = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || imageUploading) return;
    await uploadImageFile(file);
    if (event?.target) event.target.value = "";
  };

  const uploadImageFile = async (file) => {
    if (!file || imageUploading) return;
    setImageUploading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin-blog-images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not upload image.");
      if (data?.image?.path) {
        setForm((prev) => ({ ...prev, imageId: data.image.path, imageAlt: prev.imageAlt || "" }));
      }
      await fetchBlogImages();
      setStatus({
        type: "success",
        message: "Image uploaded to blog-images bucket.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not upload blog image.",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const renameImage = async () => {
    if (!renamingPath || !renameValue.trim()) return;
    try {
      const response = await fetch("/api/admin-blog-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath: renamingPath,
          nextName: renameValue.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not rename image.");

      if (form.imageId === renamingPath && data?.image?.path) {
        setForm((prev) => ({ ...prev, imageId: data.image.path }));
      }
      setRenamingPath("");
      setRenameValue("");
      await fetchBlogImages();
      setStatus({ type: "success", message: "Image renamed." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not rename image." });
    }
  };

  const deleteImage = async (imagePath) => {
    if (!imagePath) return;
    const confirmed = confirm("Delete this image from blog-images?");
    if (!confirmed) return;
    setDeletePath(imagePath);
    try {
      const response = await fetch("/api/admin-blog-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: imagePath }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete image.");
      if (form.imageId === imagePath) {
        setForm((prev) => ({ ...prev, imageId: "" }));
      }
      if (selectedBlogImage?.path === imagePath) {
        setSelectedBlogImage(null);
      }
      await fetchBlogImages();
      setStatus({ type: "success", message: "Image deleted." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not delete image." });
    } finally {
      setDeletePath("");
    }
  };

  const generateAltText = async (image) => {
    if (!image?.publicUrl) return;
    setAltGeneratingPath(image.path);
    try {
      const response = await fetch("/api/admin-blog-image-alt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: image.publicUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate alt text.");
      if (data?.altText) {
        setForm((prev) => ({ ...prev, imageId: image.path, imageAlt: data.altText }));
        setStatus({ type: "success", message: "Alt text generated and applied to form." });
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not generate alt text." });
    } finally {
      setAltGeneratingPath("");
    }
  };

  const onDropFiles = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) await uploadImageFile(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin-blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: generatedSlug,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create blog post.");

      setStatus({
        type: "success",
        message: `Created post "${form.title}" at /blog/${data.slug}.`,
      });
      clearForm();
      fetchPosts({ force: true });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not create blog post.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Blog Manager | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Blog Manager</h1>
            <p className="mt-0.5 text-sm text-neutral-600">
              Create markdown blog posts for the public blog and keep content publishing inside admin.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className={`${lato.className} text-lg font-bold text-neutral-900 leading-tight`}>Create New Post</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Generates a markdown file in <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px] text-neutral-700">content/blog</code>.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              <label className="block text-sm font-semibold text-neutral-700">
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder="Building Better Foundations in DFW"
                  required
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm font-semibold text-neutral-700">
                  Slug (optional)
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    placeholder="building-better-foundations"
                  />
                </label>
                <label className="block text-sm font-semibold text-neutral-700">
                  Publish Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-neutral-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                >
                  <option value="draft">Draft (not visible publicly)</option>
                  <option value="published">Published (visible on /blog)</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-neutral-700">
                Excerpt
                <textarea
                  value={form.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder="1-2 sentence summary shown on the blog listing."
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-neutral-700">
                Image ID
                <input
                  type="text"
                  value={form.imageId}
                  onChange={(e) => updateField("imageId", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder="IMG_8084"
                />
              </label>

              <label className="block text-sm font-semibold text-neutral-700">
                Image Alt Text
                <input
                  type="text"
                  value={form.imageAlt}
                  onChange={(e) => updateField("imageAlt", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder="Crew drilling pier foundations on an active Dallas commercial site"
                />
              </label>

              <div
                className={`rounded-xl border p-4 transition-colors ${
                  dragActive ? "border-brand bg-brand-50/60" : "border-neutral-200 bg-neutral-50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={onDropFiles}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white ring-1 ring-neutral-200">
                      <svg className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-700">Blog Image Library</p>
                      <p className="text-[10px] text-neutral-500">Bucket: blog-images</p>
                    </div>
                  </div>
                  <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-neutral-300 transition-colors hover:bg-neutral-100 hover:ring-neutral-400">
                    {imageUploading ? "Uploading..." : "Upload image"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={uploadBlogImage}
                      className="hidden"
                      disabled={imageUploading}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Drag-and-drop an image anywhere in this card or click upload. Click a tile to select.
                </p>
                <div className="mt-3 max-h-52 overflow-y-auto">
                  {imagesLoading ? (
                    <p className="text-xs text-neutral-500">Loading images...</p>
                  ) : blogImages.length === 0 ? (
                    <p className="text-xs text-neutral-500">No images uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {blogImages.map((img) => (
                        <button
                          key={img.path}
                          type="button"
                          onClick={() => setSelectedBlogImage(img)}
                          className={`overflow-hidden rounded-lg border text-left transition-all ${
                            selectedBlogImage?.path === img.path || form.imageId === img.path
                              ? "border-brand ring-2 ring-brand/20"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                          title={img.path}
                        >
                          <img src={img.publicUrl} alt={img.name} className="h-20 w-full object-cover" />
                          <div className="truncate bg-white px-1.5 py-1 text-[10px] text-neutral-600">
                            {img.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedBlogImage ? (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="truncate text-xs font-semibold text-neutral-700">{selectedBlogImage.name}</p>
                    <p className="truncate text-[11px] text-neutral-500">{selectedBlogImage.path}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateField("imageId", selectedBlogImage.path);
                          if (!form.imageAlt) updateField("imageAlt", "");
                        }}
                        className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-light"
                      >
                        Use image
                      </button>
                      <button
                        type="button"
                        onClick={() => generateAltText(selectedBlogImage)}
                        disabled={altGeneratingPath === selectedBlogImage.path}
                        className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                      >
                        {altGeneratingPath === selectedBlogImage.path ? "Generating alt..." : "AI alt text"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingPath(selectedBlogImage.path);
                          setRenameValue(selectedBlogImage.name);
                        }}
                        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImage(selectedBlogImage.path)}
                        disabled={deletePath === selectedBlogImage.path}
                        className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletePath === selectedBlogImage.path ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : null}
                {renamingPath ? (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                    <p className="text-xs font-semibold text-neutral-700">Rename image</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-9 flex-1 rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                      />
                      <button
                        type="button"
                        onClick={renameImage}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-light"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingPath("");
                          setRenameValue("");
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-indigo-900 leading-tight">AI Draft Generator</h3>
                    <p className="mt-0.5 text-xs text-indigo-800/80">
                      Generate a first draft, then edit before publishing.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="block text-xs font-semibold text-indigo-900">
                    Focus Keyword
                    <input
                      type="text"
                      value={generator.keyword}
                      onChange={(e) => updateGeneratorField("keyword", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="commercial pier drilling dallas"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-indigo-900">
                    City / Area
                    <input
                      type="text"
                      value={generator.city}
                      onChange={(e) => updateGeneratorField("city", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <label className="block text-xs font-semibold text-indigo-900">
                    Tone
                    <input
                      type="text"
                      value={generator.tone}
                      onChange={(e) => updateGeneratorField("tone", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-indigo-900">
                    Extra Notes
                    <input
                      type="text"
                      value={generator.notes}
                      onChange={(e) => updateGeneratorField("notes", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Highlight project turnaround speed"
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={generateDraft}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:shadow-none"
                  >
                    {generating ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating draft...
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate AI Draft
                      </>
                    )}
                  </button>
                </div>
                {socialSuggestions.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-900">
                        Suggested social posts
                      </p>
                      {suggestionSource ? (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Source: {suggestionSource}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 space-y-2">
                      {socialSuggestions.map((suggestion, index) => (
                        <div key={`${index}-${suggestion.slice(0, 24)}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                          <p className="whitespace-pre-wrap text-xs text-neutral-700">{suggestion}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => queueSuggestion(suggestion, index)}
                              disabled={queueingSuggestionIndex === index}
                              className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-light disabled:opacity-60"
                            >
                              {queueingSuggestionIndex === index ? "Queueing..." : "Add to Social Queue"}
                            </button>
                            <button
                              type="button"
                              onClick={() => copySuggestionToClipboard(suggestion, index)}
                              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                            >
                              {copiedSuggestionIndex === index ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="block text-sm font-semibold text-neutral-700">
                Markdown Content
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  className="mt-1 min-h-[260px] w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  placeholder={"## Intro\n\nWrite your post here..."}
                  required
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                <p className="text-xs text-neutral-500">
                  Final slug:{" "}
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-700">
                    {generatedSlug || "—"}
                  </span>
                </p>
                <button
                  type="submit"
                  disabled={saving || !generatedSlug}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60 disabled:shadow-none"
                >
                  {saving ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Blog Post"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11H5m14-7H5m14 14H5m14 0l-3-3m3 3l-3 3" />
                  </svg>
                </div>
                <div>
                  <h2 className={`${lato.className} text-lg font-bold text-neutral-900 leading-tight`}>Recent Posts</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Latest drafts and published posts.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchPosts({ force: true });
                  fetchBlogImages({ force: true });
                }}
                className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {loading ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-neutral-500">No posts found in content/blog.</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.slug}
                    className="group rounded-xl border border-neutral-200 bg-white p-3 transition-all hover:border-neutral-300 hover:shadow-card-hover"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-semibold text-neutral-900 leading-tight">{post.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.status || "draft"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-neutral-400">/{post.slug}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-light"
                      >
                        Open post
                        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
            role="status"
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {status.type === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
              )}
            </svg>
            <p className="flex-1 text-sm font-medium leading-snug">{status.message}</p>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="shrink-0 rounded-md p-0.5 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

AdminBlogPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminBlogPage);
