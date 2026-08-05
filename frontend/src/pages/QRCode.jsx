import { useState } from "react";
import API from "../api/axios";


function QRCode(){

    const [bookingId,setBookingId] = useState("");
    const [qr,setQr] = useState(null);



    const generateQR = async()=>{

        try{

            const response = await API.post(
                `/qr/generate/${bookingId}`
            );


            setQr(response.data);


        }
        catch(error){

            alert(
                error.response?.data?.detail ||
                "QR generation failed"
            );

        }

    };



    return(

        <div>

            <h1>
                Parking QR Code
            </h1>


            <input
                placeholder="Enter Booking ID"
                onChange={
                    (e)=>setBookingId(e.target.value)
                }
            />


            <button onClick={generateQR}>
                Generate QR
            </button>



            {
                qr && (

                    <div>

                        <h3>
                            QR Generated
                        </h3>


                        <p>
                            Booking ID:
                            {" "}
                            {qr.booking_id}
                        </p>


                        <p>
                            Code:
                            {" "}
                            {qr.qr_code}
                        </p>


                        <img
                            src={
                                `http://127.0.0.1:8000/${qr.file}`
                            }
                            width="200"
                        />

                    </div>

                )
            }


        </div>

    );

}


export default QRCode;