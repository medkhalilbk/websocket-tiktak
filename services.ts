require('dotenv').config()

export function testDotEnv(){
    console.log(process.env.SECRET_KEY)
}
export async function assignDeliveryManService(orderId: string, deliveryManId: string,companyId:string) {
    try {
        let response = await fetch((process.env.API_URL as string) + `/carts/${orderId}/accept`|| "http://192.168.1.4:3000/api/carts/"+orderId+"/accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ deliveryManId })
        })
        let data = await response.json()
        console.log("op op op", data)
        return data
    } catch (error) {
        console.log(error)
    }

}