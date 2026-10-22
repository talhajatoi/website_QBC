import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategoryImageUrl,
  updateCategory,
} from "../../services/category.service";
import LoadingSpinner from "../../Components/LoadingSpinner";
import EmptyState from "../../Components/EmptyState";
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export default function CategoriesManagement() {
  const [categories, setCategories] = useState();
  const [editing, setEditing] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { isActive: true } });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const categoryImage = useWatch({ control, name: "categoryImage" })?.[0];
  const [uploadedImagePreview, setUploadedImagePreview] = useState("");
  useEffect(() => {
    if (!categoryImage) {
      setUploadedImagePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(categoryImage);
    setUploadedImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [categoryImage]);
  const load = () =>
    getAdminCategories()
      .then((r) => setCategories(r.data.categories))
      .catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
  }, []);
  const open = (category) => {
    setEditing(category || {});
    reset(
      category || {
        name: "",
        slug: "",
        description: "",
        imageUrl: "",
        isActive: true,
      },
    );
  };
  const save = async (data) => {
    const { categoryImage: selectedImage, ...fields } = data;
    const payload = {
      ...fields,
      slug: data.slug || slugify(data.name),
      imageUrl: data.imageUrl || "",
      categoryImage: selectedImage?.[0],
    };
    try {
      if (editing?._id) await updateCategory(editing._id, payload);
      else await createCategory(payload);
      toast.success("Category saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const remove = async (category) => {
    if (
      !window.confirm(
        `Delete ${category.name}? Products must be reassigned first.`,
      )
    )
      return;
    try {
      await deleteCategory(category._id);
      toast.success("Category deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };
  if (!categories) return <LoadingSpinner label="Loading categories" />;
  return (
    <>
      <div className="flex justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="section-title">Categories</h1>
        </div>
        <button className="btn-primary" onClick={() => open(null)}>
          <Plus className="h-4 w-4" />
          New category
        </button>
      </div>
      {editing && (
        <form
          onSubmit={handleSubmit(save)}
          className="mt-7 rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between">
            <h2 className="text-xl font-black">
              {editing._id ? "Edit category" : "New category"}
            </h2>
            <button type="button" onClick={() => setEditing(null)}>
              <X />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field">
              Name
              <input
                className="input"
                {...register("name", { required: true })}
              />
            </label>
            <label className="field">
              Slug
              <input className="input" {...register("slug")} />
            </label>
            <label className="field md:col-span-2">
              Description
              <textarea className="input" {...register("description")} />
            </label>
            <label className="field md:col-span-2">
              Image URL (optional)
              <input
                className="input"
                type="url"
                placeholder="https://example.com/category.jpg"
                {...register("imageUrl")}
              />
            </label>
            <label className="field md:col-span-2">
              Or upload an image (JPEG, PNG, or WebP; max 10 MB)
              <input
                className="input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                {...register("categoryImage")}
              />
              <span className="text-xs font-medium text-zinc-500">
                If you provide both, the uploaded image will be used.
              </span>
            </label>
            {(uploadedImagePreview || imageUrl) && (
              <div className="md:col-span-2">
                <p className="field mb-2">Image preview</p>
                <img
                  className="h-36 w-56 rounded-xl object-cover"
                  src={uploadedImagePreview || getCategoryImageUrl(imageUrl)}
                  alt="Category preview"
                />
              </div>
            )}
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>
          <button disabled={isSubmitting} className="btn-primary mt-5">
            Save category
          </button>
        </form>
      )}
      {categories.length ? (
        <div className="mt-8 grid gap-4">
          {categories.map((c) => (
            <article
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"
              key={c._id}
            >
              <div className="flex min-w-0 items-center gap-4">
                {c.imageUrl && (
                  <img
                    className="h-14 w-20 rounded-lg object-cover"
                    src={getCategoryImageUrl(c.imageUrl)}
                    alt=""
                  />
                )}
                <div>
                  <h2 className="font-black">{c.name}</h2>
                  <p className="text-sm text-zinc-500">
                    /{c.slug} · {c.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-icon" onClick={() => open(c)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="btn-icon text-red-600"
                  onClick={() => remove(c)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No categories created" />
        </div>
      )}
    </>
  );
}
