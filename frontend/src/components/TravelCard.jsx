import { PenSquareIcon, Trash2Icon } from "lucide-react"
import { Link } from "react-router"
import { formatDate } from "../lib/utils"
import api from "../lib/axios"
import toast from "react-hot-toast"

const TravelCard = ({ travel, setTravel }) => {
  const handleDelete = async (e, id) => {
    e.preventDefault(); // gets rid of the navigation behavior

    if (!window.confirm("Are you sure you want to delete this travel?")) return;

    try {
      await api.delete(`/travel/${id}`)
      setTravel((prev) => prev.filter(travel => travel._id !== id))
      toast.success("Travel deleted successfully");
    } catch (error) {
      console.log("Error in handleDelete", error);
      toast.error("Failed to delete travel");
    }
  }

  return (
    <Link to={`/travel/${travel._id}`}
      className=" card bg-base-100 hover:shadow-lg transition-all duration-200
        border-t-4 border-solid border-[#f5cf12]"
    >
      <div className="card-body">
        <h3 className="card-title text-base-content">{travel.title}</h3>
        <p className="text-base-content/70 line-clamp-3">{travel.content}</p>
        <div className="card-actions justify-between items-center mt-4">
          <span className="text-sm text-base-content/60">
            {formatDate(new Date(travel.createdAt))}
          </span>
          <div className="flex items-center gap-1">
            <PenSquareIcon className="size-4" />
            <button className="btn btn-ghost btn-xs text-error" onClick={(e) => handleDelete(e, travel._id)}>
              <Trash2Icon className="size-4"/>
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default TravelCard