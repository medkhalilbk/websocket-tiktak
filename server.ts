import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const deliveryManData: { [region: string]: Array<{ id: string }> } = {};
io.on('connection', (socket: Socket) => {
  console.log('A client connected');
  socket.on('deliveryMan-join', (room) => {
    const { id, region } = room;
    console.log(`Delivery man with ID ${id} has joined the region ${region}`);
    socket.join(region);
    if (!deliveryManData[region]) {
      deliveryManData[region] = [];
    }  
    Object.keys(deliveryManData).forEach((r) => {
      let isDeliveryManExists = deliveryManData[r].find((deliveryMan) => deliveryMan.id === id);
      if(isDeliveryManExists){
        deliveryManData[r] = deliveryManData[r].filter((deliveryMan) => deliveryMan.id !== id);
      }
    })
    deliveryManData[region].push({ id });
    socket.emit('joined-room', { id, region });
  });


  socket.on('get-delivery-men', ({region}) => { 
    const deliveryMen = deliveryManData[region] || [];
    console.log(deliveryManData[region]) 
    socket.emit('delivery-men-list', { region, deliveryMen });
});
}); 

server.listen(8080, () => {
  console.log('WebSocket server is running on port 8080');
});
