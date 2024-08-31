import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors"
import {  assignDeliveryManService, testDotEnv } from "./services";
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors : {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const deliveryManData: { [id: string]: { coords: { latitude: number, longitude: number } } } = {};

const ordersStatus: { [id: string]: { status: string, totalPrice: number, restaurantName:string, deliveryManId?:string, companyId:string } } = {};

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
      ordersStatus[item.id] = {status: item.status, totalPrice: item.totalPrice, restaurantName: item.restaurantName,companyId:item.companyId}
    })
    if (obj.room?.length > 0) {
      const companiesIds = obj.room[0].companiesIds;

      // Emit to all connected clients (or specify a room if needed) 
      io.emit("waiting-for-delivery", {carts:ordersStatus});
      io.emit("companies-update", { companyIds: companiesIds, orders: obj.room , type: "new-order" });
      console.log("Emitted companies-update with:", companiesIds);
    }
  });
  socket.on("companies-update" , (obj) => {
    
    console.log(obj)
    if(obj.type === "order-ready"){
      console.log(ordersStatus)
      let {companyId,orderId} = obj
      if(!ordersStatus[orderId].companyId){
        return;
      }
      if(ordersStatus[orderId].companyId === companyId){ 
    ordersStatus[orderId].status = "ready" 
       }
       io.emit("waiting-for-delivery", {carts:ordersStatus});
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



  socket.on("deliveryMan-update", (obj:any) => {

    const {id, response,orderId,companyId}  = obj 

    if (response === "accept") {
      console.log(ordersStatus)
      ordersStatus[orderId].status = "accepted"
      ordersStatus[orderId].deliveryManId = id
      ordersStatus[orderId].companyId = companyId
      assignDeliveryManService(orderId, id,companyId) 
      io.emit("waiting-for-delivery", {carts:ordersStatus});
      io.emit("companies-update", { companyIds: [companyId], orders: [{id:orderId, status:"accepted"}] , type: "order-accept" });
    }else{
      return; 
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


// complete accept process 