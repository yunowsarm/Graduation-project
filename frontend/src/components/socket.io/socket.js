import io from "socket.io-client";

// 这里根据你的后端地址和需求配置选项
export const notificationSocket = io("http://localhost:3001", {
  withCredentials: true,
});

export const chatSocket = io("http://localhost:3001", {
  withCredentials: true,
});
