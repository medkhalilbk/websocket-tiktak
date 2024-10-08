import express from "express";
import http from "http";
import { Server, Socket } from "socket.io"; 
import { assignDeliveryManService, testDotEnv, updateCartDone } from "./services";
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const deliveryManData: { [id: string]: { coords: { latitude: number, longitude: number } } } = {};

const ordersStatus: { [id: string]: { status: string, totalPrice: number, restaurantName:string, deliveryManId?:string, companiesIds:string[] } } = {};

testDotEnv()
io.on("connection", (socket: Socket) => {
  console.log("A client connected");
  socket.on("deliveryMan-join", (room) => {
    if (!room.deliveryManInfo) {
      return;
    }

    const { deliveryManInfo } = room;
    const { id, coords } = deliveryManInfo;

    console.log(
      `Delivery man with ID ${id} with location: (${coords.latitude}, ${coords.longitude}) has joined`
    );

    // Join the room based on coordinates
    socket.join(`${coords.latitude}-${coords.longitude}`);
    deliveryManData[id] = { coords };

    socket.emit("joined-room", { coords, deliveryManInfo });
  });

  socket.on("companies-notifications", (obj) => {
    obj.room.forEach((item: any) => {
      console.log(item)
      ordersStatus[item.id] = {status: item.status, totalPrice: item.totalPrice, restaurantName: item.restaurantName,companiesIds:item.companiesIds}
    })

    if (obj.room?.length > 0) {
      const companiesIds = obj.room[0].companiesIds;

      // Emit to all connected clients (or specify a room if needed) 
      io.emit("waiting-for-delivery", { carts: ordersStatus });
      obj.room.forEach((item: any) => {
        const seenId = new Set<string>()
        // io.to(item.deliveryManIds).emit("companies-notifications", { room: [item] });
        item.deliveryManIds.forEach((id: string) => {
          io.emit(`${id}`, { cart: item, address: obj.address, type: "delivery-request" });
        })
      })

      io.emit("companies-update", { companyIds: companiesIds, orders: obj.room, type: "new-order" });
      console.log("Emitted companies-update with:", companiesIds);
    }
  });
  socket.on("companies-update", (obj) => {

    console.log(obj)
    if (obj.type === "order-ready") {
      console.log(ordersStatus)
      let {companyId,cartId} = obj
      if(ordersStatus[cartId]?.companiesIds.length == 0){
        return;
      }
      if(ordersStatus[cartId].companiesIds.includes(companyId)){ 
    ordersStatus[cartId].status = "ready" 
       }

      io.emit(obj.deliveryManId, { carts: ordersStatus, type: "order-ready" });
    }
  })


  socket.on("get-delivery-men", () => {
    // Convert the deliveryManData object to an array
    const deliveryMenArray = Object.keys(deliveryManData).map(id => ({
      id,
      coords: deliveryManData[id].coords
    }));

    // Return the list of delivery men
    socket.emit("delivery-men-list", { deliveryMen: deliveryMenArray });
  });



  socket.on("deliveryMan-update", (obj: any) => {

    const {id, response,cartId,companyId}  = obj 

   try {
    if (response === "accept") {
      console.log(ordersStatus)
      if(ordersStatus[cartId]){
        if(ordersStatus[cartId].status == "accepted"){
        io.emit(`${id}` , {type:"already-accepted"} )
        return ;
        }
        ordersStatus[cartId].status = "accepted"
        ordersStatus[cartId].deliveryManId = id 
        assignDeliveryManService(cartId, id) 
        io.emit("waiting-for-delivery", {carts:ordersStatus});
        io.emit("companies-update", { companyIds: ordersStatus[cartId].companiesIds, orders: [{id:cartId, status:"accepted"}] , type: "order-accept" });
      }else{
        console.log("it does not exist")
      }
     
    }else{
      return; 
    } 
   } catch (error) {
    console.log(error)
   }
  })

  socket.on("product-livred", (obj: any) => {
    const { cartId } = obj
    console.log(cartId)
    try {
      const result = updateCartDone(cartId)
      socket.emit("companies-update" , {companyIds:ordersStatus[cartId].companiesIds, orders: [{id:cartId, status:"done"}], type: "cart-done" })
    } catch (error) {
      console.log(error)
    }
  })
  socket.on("waiting-for-delivery", (room) => {
    // Handle waiting-for-delivery event
  });

  socket.on("disconnect", () => {
    // remove data from deliveryManData
    console.log("A client disconnected");
  });
});

server.listen(8080, () => {
  console.log("WebSocket server is running on port 8080");
});
 