import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors"
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors : {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const deliveryManData: { [id: string]: { coords: { latitude: number, longitude: number } } } = {};

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
    console.log("Received data:", obj);

    if (obj.room?.length > 0) {
      const companiesIds = obj.room.map((item: any) => item.companiesIds[0]);

      // Emit to all connected clients (or specify a room if needed)
      io.emit("companies-update", { companyIds: companiesIds });
      console.log("Emitted companies-update with:", companiesIds);
    }
  });

  socket.on("get-delivery-men", () => {
    // Convert the deliveryManData object to an array
    const deliveryMenArray = Object.keys(deliveryManData).map(id => ({
      id,
      coords: deliveryManData[id].coords
    }));

    // Return the list of delivery men
    socket.emit("delivery-men-list", { deliveryMen: deliveryMenArray });
  });

  socket.on("waiting-for-delivery", (room) => {
    // Handle waiting-for-delivery event
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

server.listen(8080, () => {
  console.log("WebSocket server is running on port 8080");
});
