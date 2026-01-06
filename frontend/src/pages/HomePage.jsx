import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

import Navbar from '../components/Navbar'
import RateLimitedUI from '../components/RateLimitedUI'
import TravelCard from '../components/TravelCard'
import TravelsNotFound from '../components/TravelsNotFound'

const HomePage = () => {
    const [isRateLimited, setIsRateLimited]=useState(false);
    const [travel, setTravel] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect (() => {
        const fetchTravels = async () => {
            try {
                const res = await api.get("/travel");
                console.log(res.data);
                setTravel(res.data);
                setIsRateLimited(false)
            } catch (error) {
                console.log("Error fetching travels")
                if(error.response?.status === 429){
                    setIsRateLimited(true)
                } else {
                    toast.error("Failed to load travels")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchTravels();
    }, [] )

    return (
    <div className='min-h-screen'>
        <Navbar />

        {isRateLimited && <RateLimitedUI />}

        <div className="max-w7xl mx-auto p-4 mt-6"> 
            {loading && <div className="text-center text-primary py-10">Loading travels...</div>}

            {travel.length === 0 && !isRateLimited && <TravelsNotFound />}

            {travel.length > 0 && !isRateLimited && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {travel.map(travel => (
                        <TravelCard key={travel._id} travel={travel} setTravel={setTravel} />
                    ))}
                </div>
            )}
        </div>
    </div>
    )
}

export default HomePage