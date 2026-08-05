import { useState } from "react";
import API from "../api/axios";


function AddParking(){

    const [form,setForm] = useState({
        name:"",
        address:"",
        latitude:"",
        longitude:"",
        total_slots:""
    });



    const handleChange = (e)=>{

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };



    const createParking = async()=>{

        try{

            const response = await API.post(
                "/parking/create",
                {
                    ...form,
                    latitude:Number(form.latitude),
                    longitude:Number(form.longitude),
                    total_slots:Number(form.total_slots)
                }
            );


            alert(
                response.data.message
            );


        }
        catch(error){

            alert(
                error.response?.data?.detail ||
                "Parking creation failed"
            );

        }

    };



    return(

        <div>

            <h1>
                Add Parking Location
            </h1>


            <input
            name="name"
            placeholder="Parking Name"
            onChange={handleChange}
            />


            <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            />


            <input
            name="latitude"
            placeholder="Latitude"
            onChange={handleChange}
            />


            <input
            name="longitude"
            placeholder="Longitude"
            onChange={handleChange}
            />


            <input
            name="total_slots"
            placeholder="Total Slots"
            onChange={handleChange}
            />


            <button onClick={createParking}>
                Create Parking
            </button>


        </div>

    );

}


export default AddParking;