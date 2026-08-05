import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";


function ParkingDetails(){

    const {id} = useParams();

    const [parking,setParking] = useState(null);



    useEffect(()=>{

        loadDetails();

    },[]);



    const loadDetails = async()=>{

        const response = await API.get(
            `/search/parking/${id}`
        );

        setParking(response.data);

    };



    const bookSlot = async(slotId)=>{

        const vehicle_number = prompt(
            "Enter Vehicle Number"
        );


        try{

            const response = await API.post(
                "/booking/create",
                {
                    slot_id: slotId,
                    vehicle_number
                }
            );


            alert(
                response.data.message
            );


            loadDetails();

        }
        catch(error){

            alert(
                error.response?.data?.detail ||
                "Booking failed"
            );

        }

    };



    if(!parking){

        return <h2>Loading...</h2>

    }



    return(

        <div>

            <h1>
                {parking.parking.name}
            </h1>


            <p>
                {parking.parking.address}
            </p>



            <h2>
                Select Slot
            </h2>



            {
                parking.slots.map((slot)=>(

                    <button
                    key={slot.id}
                    disabled={
                        slot.status==="booked"
                    }
                    onClick={()=>
                        bookSlot(slot.id)
                    }
                    >

                    {slot.slot_number}
                    -
                    {slot.status}

                    </button>

                ))
            }


        </div>

    );

}


export default ParkingDetails;