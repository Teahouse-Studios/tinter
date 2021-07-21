import React, {useEffect} from 'react'
import SockJS from "sockjs-client";

const sockjs = window.SockJS as typeof SockJS

const sock = new sockjs('http://localhost:45000/echo')

function App() {
  return (
    <div>
      Hello
    </div>
  )
}

export default App
