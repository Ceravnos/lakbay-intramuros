import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast"
import api from "../lib/axios"
import Navbar from "../components/Navbar"

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!title.trim() || !content.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true)
    try {
      await api.post("travel", {title, content})
      toast.success("Destination added to your itinerary")
      navigate("/")
    } catch (error) {
      console.log("Error creating travel", error)
      toast.error("Failed to create destination")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Itinerary</span>
        </Link>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-terracotta-600" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-stone-800">
              Add New Destination
            </h1>
          </div>
          <p className="text-stone-500">
            Create a new stop for your Intramuros journey
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Destination Name
              </label>
              <input 
                type="text"
                placeholder="e.g., Fort Santiago, Manila Cathedral..."
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Notes & Details
              </label>
              <textarea
                placeholder="Add details about this destination, what you want to see, historical notes..."
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400 resize-none h-40"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <Link 
                to="/" 
                className="px-5 py-2.5 text-stone-600 hover:text-stone-800 font-medium transition-colors"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add to Itinerary"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePage