import { useEffect, useState } from "react";
import API from "../api/axios";


function MyBookings(){

    const [bookings,setBookings] = useState([]);


    useEffect(()=>{

        loadBookings();

    },[]);



    const loadBookings = async()=>{

        const response = await API.get(
            "/booking/my-bookings"
        );

        setBookings(response.data);

    };



    const cancelBooking = async(id)=>{

        try{

            const response = await API.delete(
                `/booking/cancel/${id}`
            );


            alert(
                response.data.message
            );


            loadBookings();

        }
        catch(error){

            alert(
                error.response?.data?.detail ||
                "Cancel failed"
            );

        }

    };



    return(

        <div>

            <h1>
                My Bookings
            </h1>


            {
                bookings.map((booking)=>(

                    <div key={booking.id}>

                        <p>
                            Booking ID:
                            {" "}
                            {booking.id}
                        </p>


                        <p>
                            Vehicle:
                            {" "}
                            {booking.vehicle_number}
                        </p>


                        <p>
                            Slot ID:
                            {" "}
                            {booking.slot_id}
                        </p>


                        <button
                        onClick={()=>
                            cancelBooking(booking.id)
                        }
                        >
                            Cancel Booking
                        </button>


                    </div>

                ))
            }


        </div>

    );

}


export default MyBookings;