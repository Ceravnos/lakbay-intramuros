import { NotebookIcon } from "lucide-react";
import { Link } from "react-router";

const TravelsNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-md mx-auto text-center">
      <div className="bg-primary/10 rounded-full p-8">
        <NotebookIcon className="size-10 text-primary" />
      </div>
      <h3 className="text-2xl font-bold">No travels yet</h3>
      <p className="text-base-content/70">
        Ready to Lakbay Intramuros? Create your travel itinerary to get started on your journey.
      </p>
      <Link to="/create" className="btn btn-primary">
        Create Your First Itinerary
      </Link>
    </div>
  );
};
export default TravelsNotFound;