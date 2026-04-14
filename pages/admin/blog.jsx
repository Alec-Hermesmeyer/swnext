"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
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
  const [form, setForm] = useState(EMPTY_FORM);
  const fileInputRef = useRef(null);
  const [generator, setGenerator] = useState({
    keyword: "",
    city: "Dallas-Fort Worth",
    tone: "Practical, trustworthy, expert",
    notes: "",
  });

  const generatedSlug = useMemo(() => toSlug(form.slug || form.title), [form.slug, form.title]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-blog-posts");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load blog posts.");
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not load blog posts.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogImages = async () => {
    setImagesLoading(true);
    try {
      const response = await fetch("/api/admin-blog-images");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load blog images.");
      const nextImages = Array.isArray(data.images) ? data.images : [];
      setBlogImages(nextImages);
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

      setForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        excerpt: draft.excerpt || prev.excerpt,
        imageId: draft.imageId || prev.imageId,
        content: draft.content || prev.content,
        status: "draft",
      }));
      setStatus({
        type: "success",
        message: "AI draft generated. Review, edit, then publish when ready.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not generate draft.",
      });
    } finally {
      setGenerating(false);
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
      fetchPosts();
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
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Blog Manager</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Create markdown blog posts for the public blog and keep content publishing inside admin.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>Create New Post</h2>
            <p className="mt-1 text-sm text-neutral-600">
              This creates a markdown file in <code>content/blog</code>.
            </p>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-neutral-700">
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
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
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    placeholder="building-better-foundations"
                  />
                </label>
                <label className="block text-sm font-semibold text-neutral-700">
                  Publish Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-neutral-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
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
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  placeholder="IMG_8084"
                />
              </label>

              <label className="block text-sm font-semibold text-neutral-700">
                Image Alt Text
                <input
                  type="text"
                  value={form.imageAlt}
                  onChange={(e) => updateField("imageAlt", e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  placeholder="Crew drilling pier foundations on an active Dallas commercial site"
                />
              </label>

              <div
                className={`rounded-lg border p-3 transition-colors ${
                  dragActive ? "border-[#0b2a5a] bg-blue-50" : "border-neutral-200 bg-neutral-50"
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                    Blog Image Library (bucket: blog-images)
                  </p>
                  <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] ring-1 ring-neutral-300 hover:bg-neutral-100">
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
                <p className="mt-1 text-xs text-neutral-500">
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
                              ? "border-[#0b2a5a] ring-2 ring-[#0b2a5a]/20"
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
                        className="rounded-md bg-[#0b2a5a] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#143a75]"
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
                        className="h-9 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={renameImage}
                        className="rounded-lg bg-[#0b2a5a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#143a75]"
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

              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <h3 className="text-sm font-bold text-indigo-900">AI Draft Generator</h3>
                <p className="mt-1 text-xs text-indigo-800">
                  Generate a first draft, then edit before publishing.
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="block text-xs font-semibold text-indigo-900">
                    Focus Keyword
                    <input
                      type="text"
                      value={generator.keyword}
                      onChange={(e) => updateGeneratorField("keyword", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm"
                      placeholder="commercial pier drilling dallas"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-indigo-900">
                    City / Area
                    <input
                      type="text"
                      value={generator.city}
                      onChange={(e) => updateGeneratorField("city", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm"
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
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-indigo-900">
                    Extra Notes
                    <input
                      type="text"
                      value={generator.notes}
                      onChange={(e) => updateGeneratorField("notes", e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm"
                      placeholder="Highlight project turnaround speed"
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={generateDraft}
                    disabled={generating}
                    className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {generating ? "Generating draft..." : "Generate AI Draft"}
                  </button>
                </div>
              </div>

              <label className="block text-sm font-semibold text-neutral-700">
                Markdown Content
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  className="mt-1 min-h-[260px] w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm"
                  placeholder={"## Intro\n\nWrite your post here..."}
                  required
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-neutral-500">
                  Final slug: <span className="font-semibold text-neutral-800">{generatedSlug || "—"}</span>
                </p>
                <button
                  type="submit"
                  disabled={saving || !generatedSlug}
                  className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75] disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Blog Post"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>Recent Posts</h2>
              <button
                type="button"
                onClick={() => {
                  fetchPosts();
                  fetchBlogImages();
                }}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-neutral-500">No posts found in content/blog.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.slug} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{post.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.status || "draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">/{post.slug}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[#0b2a5a] hover:underline"
                      >
                        Open post
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
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
              status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {status.message}
            <button onClick={() => setStatus(null)} className="ml-2 font-bold">
              x
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
