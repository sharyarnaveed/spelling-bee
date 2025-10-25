import { io } from "socket.io-client";
export default defineNuxtPlugin(()=>{
    const socket=io('https://spellingbee.burjalsama.site')

    return{
        provide:{
            socket
        }
    }
})