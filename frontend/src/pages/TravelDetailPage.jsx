import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeftIcon, LoaderIcon, Trash2Icon } from "lucide-react";

import toast from "react-hot-toast";
import api from "../lib/axios";

const TravelDetailPage = () => {
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const { id } = useParams();

  useEffect(() => {
    const fetchTravel = async () => {
      try {
        const res = await api.get(`/travel/${id}`)
        setTravel(res.data)
      } catch (error) {
        console.log("Error in fetching travel", error);
        toast.error("Failed to fetch the travel ")
      } finally {
        setLoading(false)
      }
    }

    fetchTravel();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this travel?")) return;
     
    try {
      await api.delete(`/travel/${id}`);
      toast.success("Travel Deleted");
      navigate("/");
    } catch (error) {
      console.log("Error deleting the travel", error);
      toast.error("Failed to delete travel");
    }
  }

  const handleSave = async () => {
    if (!travel.title.trim() || !travel.content.trim()) {
      toast.error("Please add a title or content");
      return;
    }

    setSaving (true)

    try {
      await api.put(`travel/${id}`, travel);
      toast.success("Note updated successfully");
      navigate("/")
    } catch (error) {
      console.log("Error saving the travel:", error);
      toast.error("Failed to update travel");
    } finally {
      setSaving(false)
    }
  }

  console.log({ travel })

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <LoaderIcon className="animate-spin size-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8"> 
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6"> 
            <Link to="/" className="btn btn-ghost">
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Travel Gallery
            </Link>
            <button onClick={handleDelete} className="btn btn-error btn-outline">
              <Trash2Icon className="h-5 w-5" />
              Delete Travel
            </button>
          </div>

          <div className="card bg-base-100">
            <div className="card-body">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Travel Title"
                  className="input input-bordered"
                  value={travel.title}
                  onChange={(e) => setTravel({ ...travel, title: e.target.value})}
                />

              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Content</span>
                </label>
                <textarea
                  placeholder="Write your travel here..."
                  className="textarea textarea-bordered h-32"
                  value={travel.content}
                  onChange={(e) => setTravel({ ...travel, content: e.target.value})}
                />
              </div>

              <div className="card-actions justify-end">
                <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelDetailPage