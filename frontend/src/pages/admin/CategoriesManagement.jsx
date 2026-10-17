import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
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
    formState: { isSubmitting },
  } = useForm({ defaultValues: { isActive: true } });
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
    const payload = { ...data, slug: data.slug || slugify(data.name), imageUrl: data.imageUrl || undefined };
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
              Image URL
              <input className="input" {...register("imageUrl")} />
            </label>
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
              <div>
                <h2 className="font-black">{c.name}</h2>
                <p className="text-sm text-zinc-500">
                  /{c.slug} · {c.isActive ? "Active" : "Inactive"}
                </p>
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
