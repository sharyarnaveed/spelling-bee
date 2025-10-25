import { io } from "socket.io-client";
export default defineNuxtPlugin(()=>{
    const socket=io('https://spelling-bee-theta.vercel.app')

    return{
        provide:{
            socket
        }
    }
})