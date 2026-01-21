"use client"

import React, { ReactNode } from 'react'
import Message from './Message'
interface Props{
   
    children: ReactNode
}
const MessageBox= ({children}: Props) => {
    
  return (
    <>

          {/* Chat header */}
          <div className="p-3 border-bottom fw-bold">
            Alice
          </div>

          {/* Messages */}
          <ul className="flex-grow-1 p-3 overflow-auto bg-dark no-bottom-padding">
          {children}
          </ul>

          {/* Input box */}
          <div className="p-3 border-top">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message…"
              />
              <button className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
    </>
      
  )
}

export default MessageBox